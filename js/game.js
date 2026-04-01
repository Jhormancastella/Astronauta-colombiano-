// --- GAME MAIN ---
import { BASE_W, BASE_H, SCALE, recalcLayout, calcPlayerSize, setSize, setMobile, detectMobile,
         s, rand, clamp, rectCollision, loadSprite } from './utils.js';
import * as Utils from './utils.js';
import { loadAllSounds, playSFX, playMusic, stopMusic, resumeCtx } from './audio.js';
import { keys, shooting, joystick, getJoystickRadius, initInput, onAction } from './input.js';
import { initParticles, spawnExplosion, spawnTrail, updateParticles, drawParticles, clearParticles } from './particles.js';
import { Star, Bullet, Fragment, Warning, Pickup, initEntities, setDifficultyRef } from './entities.js';
import { player, resetPlayer, damagePlayer, killByOxygen, killByFuel,
         updatePlayerDeath, drawPlayer, initPlayer, onPlayerDeath, onPlayerDamage } from './player.js';
import { initRenderer, drawBackground, drawHUD, drawJoystick, drawVignette, drawPause, drawGameOver,
         drawWeaponHUD, drawUpgradeNotif, PAUSE_BTN_CONTINUE, PAUSE_BTN_EXIT } from './renderer.js';
import { initMenu, drawMenu, menuUp, menuDown, menuConfirm, menuBack, menuClick,
         onMenuAction, getMenuState, setMenuState, MENU, getSelectedDifficulty,
         getScreenShake, getVignette, getParticleLevel } from './menu.js';
import { initStory, startStory, updateStory, drawStory, storyAdvance, storySkip } from './story.js';
import { updateWeapon, resetWeapon, getBullets, spawnMuzzleFlash,
         getWeaponName, getWeaponColor, getUnlockTimes, currentWeapon, onWeaponUpgrade, WEAPON } from './weapons.js';

// ---- CANVAS SETUP ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    setMobile(detectMobile());
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    canvas.width  = screenW;
    canvas.height = screenH;
    recalcLayout(screenW, screenH);
    setSize(screenW, screenH);
    // Tamaño del jugador = 8% del ancho lógico, mínimo 24 unidades
    const ps = calcPlayerSize();
    player.w = Math.max(24, ps.w);
    player.h = Math.max(29, ps.h);
}
window.addEventListener('resize', resize);
resize();

// ---- INIT MODULES ----
initParticles(ctx);
initEntities(ctx);
initPlayer(ctx);
initRenderer(ctx, () => gameTime, () => score, () => difficultyLevel);
initMenu(ctx);
initStory(ctx);
initInput(canvas);

// ---- GAME STATE ----
const STATE = { MENU: 'menu', STORY: 'story', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover' };
let gameState = STATE.MENU;
let gameTime = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('astronautaColombiano_HS')) || 0;
let difficultyLevel = 1;

// ---- ENTITIES ----
const stars = Array.from({ length: 60 }, () => new Star());
let fragments = [], bullets = [], pickups = [], warnings = [];
let fragmentTimer = 0;

// ---- SCREEN FX ----
let shakeAmount = 0, shakeDuration = 0;
let flashAlpha = 0, flashColor = '#fff';

function triggerShake(a, d) { shakeAmount = a; shakeDuration = d; }
function triggerFlash(c = '#ff0000', a = 0.3) { flashColor = c; flashAlpha = a; }

// ---- WEAPON UPGRADE NOTIFICATION ----
let upgradeNotif = { text: '', color: '#fff', timer: 0 };
onWeaponUpgrade(level => {
    upgradeNotif.text = `★ ARMA: ${getWeaponName()}`;
    upgradeNotif.color = getWeaponColor();
    upgradeNotif.timer = 3.0;
    triggerFlash(getWeaponColor(), 0.15);
    playSFX('pickup');
});

// ---- DIFFICULTY (ajustada por selección del jugador) ----
function getDifficulty() {
    const d = getSelectedDifficulty(); // 0=Fácil, 1=Normal, 2=Difícil
    const diffMult = [0.65, 1.0, 1.5][d];
    const oxyMult  = [0.6,  1.0, 1.6][d];
    return {
        fragmentInterval: Math.max(0.2, (1.2 - gameTime * 0.008) / diffMult),
        fragmentSpeed:    (1 + gameTime * 0.015) * diffMult,
        pickupChance:     Math.max(0.12, (0.45 - gameTime * 0.003) * (d === 0 ? 1.4 : 1.0)),
        oxygenDrain:      (2.5 + gameTime * 0.08) * oxyMult,
    };
}

// ---- GAME ACTIONS ----
function startGame() {
    gameState = STATE.PLAYING;
    gameTime = 0; score = 0; difficultyLevel = 1;
    fragments = []; bullets = []; pickups = []; warnings = [];
    fragmentTimer = 0;
    upgradeNotif.timer = 0;
    clearParticles();
    resetPlayer();
    resetWeapon();
    setDifficultyRef(difficultyLevel);
    stopMusic();
    playMusic('gameplay');
}

function goToMenu() {
    gameState = STATE.MENU;
    setMenuState(MENU.MAIN);
    stopMusic();
    playMusic('menu');
}

// ---- PLAYER CALLBACKS ----
onPlayerDeath(() => { gameState = STATE.GAMEOVER; });
onPlayerDamage(() => { triggerShake(4, 0.3); triggerFlash('#ff0000', 0.25); playSFX('hit'); });

// ---- MENU CALLBACKS ----
onMenuAction({
    // Nueva partida → directo al juego
    playDirect: () => startGame(),
    // Nueva partida → ver historia → juego
    storyThenPlay: () => {
        gameState = STATE.STORY;
        stopMusic();
        startStory(() => {
            startGame();
        });
    },
});

// ---- INPUT ACTIONS ----
onAction(action => {
    resumeCtx();

    if (typeof action === 'object') {
        // Touch / click
        if (action.type === 'touch' || action.type === 'click') {
            const pos = action.type === 'click'
                ? (() => { const r = canvas.getBoundingClientRect(); return { x: (action.x - r.left) / (SCALE || 1), y: (action.y - r.top) / (SCALE || 1) }; })()
                : action.pos;

            if (gameState === STATE.MENU)     { menuClick(pos.x, pos.y); return; }
            if (gameState === STATE.STORY)    { storyAdvance(); return; }
            if (gameState === STATE.GAMEOVER) { startGame(); return; }

            if (gameState === STATE.PAUSED) {
                // Botón CONTINUAR
                const bc = PAUSE_BTN_CONTINUE;
                if (pos.x >= bc.x && pos.x <= bc.x + bc.w &&
                    pos.y >= bc.y && pos.y <= bc.y + bc.h) {
                    gameState = STATE.PLAYING; return;
                }
                // Botón SALIR AL MENÚ
                const be = PAUSE_BTN_EXIT;
                if (pos.x >= be.x && pos.x <= be.x + be.w &&
                    pos.y >= be.y && pos.y <= be.y + be.h) {
                    goToMenu(); return;
                }
                // Tap fuera de botones → continuar (comportamiento anterior)
                gameState = STATE.PLAYING;
                return;
            }
        }
        return;
    }

    // String actions
    if (action === 'confirm') {
        if (gameState === STATE.MENU) menuConfirm();
        else if (gameState === STATE.STORY) storyAdvance();
        else if (gameState === STATE.GAMEOVER) startGame();
        else if (gameState === STATE.PAUSED) gameState = STATE.PLAYING;
    }
    if (action === 'pause') {
        if (gameState === STATE.STORY)   { storySkip(); return; }
        if (gameState === STATE.PLAYING) { gameState = STATE.PAUSED; return; }
        if (gameState === STATE.PAUSED)  { gameState = STATE.PLAYING; return; }  // P → continuar
        if (gameState === STATE.MENU && getMenuState() !== MENU.MAIN) { menuBack(); return; }
        if (gameState === STATE.GAMEOVER) { goToMenu(); return; }
    }
    // ESC separado: en pausa siempre va al menú
    if (action === 'escape') {
        if (gameState === STATE.STORY)   { storySkip(); return; }
        if (gameState === STATE.PAUSED)  { goToMenu(); return; }
        if (gameState === STATE.PLAYING) { gameState = STATE.PAUSED; return; }
        if (gameState === STATE.MENU && getMenuState() !== MENU.MAIN) { menuBack(); return; }
        if (gameState === STATE.GAMEOVER) { goToMenu(); return; }
    }
    if (action === 'menuUp')   { if (gameState === STATE.MENU) menuUp(); }
    if (action === 'menuDown') { if (gameState === STATE.MENU) menuDown(); }
    if (action === 'mute') { import('./audio.js').then(m => m.toggleMute()); }
});

// ---- GAME LOGIC ----
function spawnFragment() {
    const f = new Fragment();
    const diff = getDifficulty();
    f.speed *= diff.fragmentSpeed;
    fragments.push(f);
    if (f.w > 24 && Math.random() < 0.5) warnings.push(new Warning(f.x + f.w / 2));
}

function shoot() {
    if (player.shootCooldown > 0) return;
    // Cadencia según arma: láser más lenta, triple un poco más lenta
    const rates = [0.22, 0.20, 0.25, 0.30];
    player.shootRate = rates[currentWeapon] ?? 0.22;

    const defs = getBullets(player.x, player.y, player.w);
    for (const d of defs) {
        bullets.push(new Bullet(d.x, d.y, d.w, d.h, d.speed, d.vx ?? 0, d.damage ?? 1, d.isLaser ?? false));
    }
    spawnMuzzleFlash(player.x, player.y, player.w);
    player.shootCooldown = player.shootRate;
    playSFX('shoot');
}

function dropPickup(x, y) {
    const r = Math.random();
    const type = r < 0.45 ? 'oxygen' : r < 0.85 ? 'fuel' : 'health';
    pickups.push(new Pickup(x, y, type));
}

function collectPickup(p) {
    if (p.type === 'oxygen') player.oxygen = Math.min(player.maxOxygen, player.oxygen + 25);
    else if (p.type === 'fuel') player.fuel = Math.min(player.maxFuel, player.fuel + 20);
    else player.health = Math.min(player.maxHealth, player.health + 15);
    spawnExplosion(p.x, p.y, p.type === 'oxygen' ? '#4488ff' : p.type === 'fuel' ? '#44dd66' : '#ff4466', 8, 40);
    p.alive = false;
    score += 50;
    playSFX('pickup');
}

// ---- UPDATE ----
function update(dt) {
    if (gameState === STATE.STORY) { updateStory(dt); return; }
    // Actualizar animación de muerte aunque el jugador no esté vivo
    if (!player.alive) {
        updatePlayerDeath(dt);
        updateParticles(dt);
        for (const st of stars) st.update(dt);
        if (shakeDuration > 0) shakeDuration -= dt;
        if (flashAlpha > 0) flashAlpha -= dt * 2;
        return;
    }
    if (gameState !== STATE.PLAYING) return;

    gameTime += dt;
    difficultyLevel = 1 + Math.floor(gameTime / 15);
    setDifficultyRef(difficultyLevel);
    score += Math.floor(dt * 10 * difficultyLevel);

    // Actualizar nivel de arma según tiempo
    updateWeapon(gameTime, getSelectedDifficulty());

    // Notificación de upgrade
    if (upgradeNotif.timer > 0) upgradeNotif.timer -= dt;

    const diff = getDifficulty();

    // Input
    let inputX = 0, inputY = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) inputX -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) inputX += 1;
    if (keys['ArrowUp'] || keys['KeyW']) inputY -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) inputY += 1;

    if (joystick.active) {
        const jLen = Math.hypot(joystick.dx, joystick.dy);
        const JR = getJoystickRadius();
        if (jLen > 5) { inputX = joystick.dx / JR; inputY = joystick.dy / JR; }
    }

    const inputLen = Math.hypot(inputX, inputY);
    if (inputLen > 1) { inputX /= inputLen; inputY /= inputLen; }

    const moving = inputLen > 0.1;
    if (moving && player.fuel > 0) {
        player.vx += inputX * player.speed * 4 * dt;
        player.vy += inputY * player.speed * 4 * dt;
        player.fuel -= dt * 3;
        player.thrustAnim += dt * 15;
    }

    player.vx *= Math.pow(0.04, dt);
    player.vy *= Math.pow(0.04, dt);

    const maxSpd = player.speed;
    const spd = Math.hypot(player.vx, player.vy);
    if (spd > maxSpd) { player.vx = (player.vx / spd) * maxSpd; player.vy = (player.vy / spd) * maxSpd; }

    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = clamp(player.x, 2, Utils.BASE_W - player.w - 2);
    player.y = clamp(player.y, 30, Utils.BASE_H - player.h - 10);

    // Oxígeno — muerte inmediata al llegar a 0
    player.oxygen -= diff.oxygenDrain * dt;
    if (player.oxygen <= 0) {
        player.oxygen = 0;
        killByOxygen(score, highScore, ns => { highScore = ns; localStorage.setItem('astronautaColombiano_HS', ns); });
        return;
    }

    // Combustible — muerte si llega a 0 y el jugador lleva más de 3s sin combustible
    if (player.fuel > 0) {
        player.fuelEmptyTimer = 0;
    } else {
        player.fuel = 0;
        player.fuelEmptyTimer = (player.fuelEmptyTimer || 0) + dt;
        if (player.fuelEmptyTimer >= 3) {
            killByFuel(score, highScore, ns => { highScore = ns; localStorage.setItem('astronautaColombiano_HS', ns); });
            return;
        }
    }

    if (player.invincible > 0) player.invincible -= dt;

    player.shootCooldown -= dt;
    if (shooting) shoot();

    if (moving && player.fuel > 0) {
        spawnTrail(player.x + player.w / 2, player.y + player.h, '#f80');
        if (Math.random() < 0.3) spawnTrail(player.x + player.w / 2, player.y + player.h, '#ff6');
    }

    // Spawn fragments
    fragmentTimer -= dt;
    if (fragmentTimer <= 0) {
        spawnFragment();
        if (difficultyLevel > 2 && Math.random() < 0.3) spawnFragment();
        if (difficultyLevel > 4 && Math.random() < 0.3) spawnFragment();
        fragmentTimer = diff.fragmentInterval;
    }

    // Fragment collisions
    for (const f of fragments) {
        f.update(dt);
        if (f.alive && player.alive && player.invincible <= 0) {
            if (rectCollision(
                { x: player.x + 2, y: player.y + 2, w: player.w - 4, h: player.h - 4 },
                { x: f.x, y: f.y, w: f.w, h: f.h }
            )) {
                damagePlayer(f.damage, score, highScore, ns => { highScore = ns; localStorage.setItem('astronautaColombiano_HS', ns); });
                spawnExplosion(f.x + f.w / 2, f.y + f.h / 2, '#aaa', 10, 60);
                playSFX('explosion');
                f.alive = false;
            }
        }
    }

    // Bullet collisions
    for (const b of bullets) {
        b.update(dt);
        for (const f of fragments) {
            if (!b.alive || !f.alive) continue;
            if (rectCollision({ x: b.x, y: b.y, w: b.w, h: b.h }, { x: f.x, y: f.y, w: f.w, h: f.h })) {
                b.alive = false;
                f.health -= (b.damage ?? 1);
                spawnExplosion(b.x, b.y, b.isLaser ? '#ff8800' : '#ff6', b.isLaser ? 6 : 4, b.isLaser ? 50 : 30);
                if (f.health <= 0) {
                    f.alive = false;
                    score += 25 * f.maxHealth;
                    spawnExplosion(f.x + f.w / 2, f.y + f.h / 2, f.type === 2 ? '#f44' : '#aaa', 15, 70);
                    playSFX('explosion');
                    if (f.type === 2) { triggerShake(3, 0.2); spawnExplosion(f.x + f.w / 2, f.y + f.h / 2, '#ff8800', 20, 100); }
                    if (Math.random() < diff.pickupChance) dropPickup(f.x + f.w / 2, f.y + f.h / 2);
                }
            }
        }
    }

    // Pickups
    for (const p of pickups) {
        p.update(dt);
        if (p.alive) {
            const pd = Math.hypot((player.x + player.w / 2) - p.x, (player.y + player.h / 2) - p.y);
            if (pd < p.r + 12) collectPickup(p);
            else if (pd < 50) {
                const angle = Math.atan2(player.y + player.h / 2 - p.y, player.x + player.w / 2 - p.x);
                p.x += Math.cos(angle) * 80 * dt;
                p.y += Math.sin(angle) * 80 * dt;
            }
        }
    }

    for (const w of warnings) w.update(dt);
    updateParticles(dt);
    for (const st of stars) st.update(dt);

    if (shakeDuration > 0) shakeDuration -= dt;
    if (flashAlpha > 0) flashAlpha -= dt * 2;

    fragments = fragments.filter(f => f.alive);
    bullets = bullets.filter(b => b.alive);
    pickups = pickups.filter(p => p.alive);
    warnings = warnings.filter(w => w.life > 0);
}

// ---- DRAW ----
function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === STATE.MENU) {
        drawMenu(time, stars, highScore);
        return;
    }

    if (gameState === STATE.STORY) {
        drawStory(time);
        return;
    }

    // Shake (respeta opción de gráficos)
    let shakeX = 0, shakeY = 0;
    if (shakeDuration > 0 && getScreenShake()) {
        shakeX = (Math.random() - 0.5) * shakeAmount;
        shakeY = (Math.random() - 0.5) * shakeAmount;
    }

    ctx.save();
    ctx.translate(s(shakeX), s(shakeY));

    drawBackground(time, stars);
    drawParticles();
    for (const f of fragments) f.draw();
    for (const b of bullets) b.draw();
    for (const p of pickups) p.draw(time);
    for (const w of warnings) w.draw(time);
    drawPlayer(time);

    ctx.restore();

    if (flashAlpha > 0) {
        ctx.fillStyle = flashColor;
        ctx.globalAlpha = flashAlpha;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
    }

    if (getVignette()) drawVignette();
    drawHUD();
    drawWeaponHUD(getWeaponName(), getWeaponColor(), gameTime, getSelectedDifficulty(), getUnlockTimes);
    drawUpgradeNotif(upgradeNotif, time);
    drawJoystick();

    if (gameState === STATE.PAUSED) drawPause(time);
    if (gameState === STATE.GAMEOVER) drawGameOver(time, score, highScore, gameTime, difficultyLevel, player.deathCause);
}

// ---- GAME LOOP ----
let lastTime = 0;
function gameLoop(timestamp) {
    const time = timestamp / 1000;
    const dt = Math.min(time - lastTime, 0.05);
    lastTime = time;
    update(dt);
    draw(time);
    requestAnimationFrame(gameLoop);
}

// ---- BOOT ----
async function boot() {
    await Promise.all([
        loadSprite('player', 'img/Ast.png'),
        loadSprite('explosion', 'img/Astexp.png'),
        loadSprite('textures', 'img/texpreview.png'),
        loadAllSounds(),
    ]);
    playMusic('menu');
    requestAnimationFrame(ts => { lastTime = ts / 1000; gameLoop(ts); });
}

boot();
