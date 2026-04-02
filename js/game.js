// --- GAME MAIN ---
import { recalcLayout, calcPlayerSize, setSize, setMobile, detectMobile,
         s, rand, clamp, rectCollision, loadSprite } from './utils.js';
import * as Utils from './utils.js';
import { getLang } from './i18n.js';
import { loadAllSounds, playSFX, playMusic, stopMusic, resumeCtx } from './audio.js';
import { keys, shooting, joystick, getJoystickRadius, initInput, onAction } from './input.js';
import { initParticles, spawnExplosion, spawnTrail, updateParticles, drawParticles, clearParticles } from './particles.js';
import { Star, Bullet, Fragment, Warning, Pickup, SupplyDrop, BlackHole, SolarStorm, Checkpoint, initEntities, setDifficultyRef } from './entities.js';
import { player, resetPlayer, damagePlayer, killByOxygen, killByFuel,
         updatePlayerDeath, drawPlayer, initPlayer, onPlayerDeath, onPlayerDamage } from './player.js';
import { initRenderer, drawBackground, drawHUD, drawJoystick, drawVignette, drawPause, drawGameOver,
         drawWeaponHUD, drawUpgradeNotif, drawPauseButton, PAUSE_BTN_CONTINUE, PAUSE_BTN_OPTIONS, PAUSE_BTN_EXIT, PAUSE_INGAME_BTN } from './renderer.js';
import { initMenu, drawMenu, menuUp, menuDown, menuConfirm, menuBack, menuClick,
         onMenuAction, getMenuState, setMenuState, MENU, getSelectedDifficulty,
         getScreenShake, getVignette, getParticleLevel, setReturnToPause } from './menu.js';
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

// Precargar imágenes de galería desde Cloudinary (URLs exactas)
const GALLERY_DATA = [
    { id: 'bg1', url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099142/background-1_f7fgfn.png' },
    { id: 'bg2', url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099143/background-2_mrsyij.png' },
    { id: 'bg3', url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099139/background-3_njmh3b.png' },
    { id: 'bg4', url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099140/background-4_lrtcry.png' },
    { id: 'bg5', url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099139/background-5_hy8grj.png' },
    { id: 'bg6', url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099145/background-6_c5vxzj.png' },
    { id: 'bg7', url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099144/background-7_xhvhti.png' },
    { id: 'bg8', url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099136/background-8_lvlwnq.png' },
    { id: 'bg9', url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099139/background-9_jhrux2.png' },
];
GALLERY_DATA.forEach(data => loadSprite(data.id, data.url));

// ---- GAME STATE ----
const STATE = { MENU: 'menu', STORY: 'story', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover' };
let gameState = STATE.MENU;
let gameTime = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('astronautaColombiano_HS')) || 0;
let difficultyLevel = 1;

// ---- ENTITIES ----
const stars = Array.from({ length: 60 }, () => new Star());
let fragments = [], bullets = [], pickups = [], warnings = [], supplyDrops = [];
let blackHoles = [], checkpoints = [];
let solarStorm = null;
let fragmentTimer = 0;
let supplyDropTimer = 0;
let blackHoleTimer = 0;
let solarStormTimer = 0;
let checkpointSpawned = false;

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
function startGame(fromSave = false) {
    gameState = STATE.PLAYING;
    setReturnToPause(false);

    if (fromSave) {
        const save = JSON.parse(localStorage.getItem('astronautaColombiano_Checkpoint'));
        score = save.score;
        difficultyLevel = save.level;
    } else {
        gameTime = 0; score = 0; difficultyLevel = 1;
    }

    fragments = []; bullets = []; pickups = []; warnings = []; supplyDrops = [];
    blackHoles = []; checkpoints = []; solarStorm = null;
    fragmentTimer = 0;
    supplyDropTimer = 0;
    blackHoleTimer = 30;
    solarStormTimer = 60;
    checkpointSpawned = false;
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
    setReturnToPause(false);
    setMenuState(MENU.MAIN);
    stopMusic();
    playMusic('menu');
}

// ---- PLAYER CALLBACKS ----
onPlayerDeath(() => { gameState = STATE.GAMEOVER; });
onPlayerDamage(() => { triggerShake(4, 0.3); triggerFlash('#ff0000', 0.25); playSFX('hit'); });

// ---- MENU CALLBACKS ----
onMenuAction({
    // Continuar desde checkpoint
    continue: () => startGame(true),
    // Nueva partida → directo al juego
    play: () => startGame(false),
    // Nueva partida → ver historia → juego
    story: () => {
        gameState = STATE.STORY;
        setReturnToPause(false);
        stopMusic();
        startStory(() => {
            startGame(false);
        });
    },
    // Regresar al juego desde opciones (cuando se abrió desde pausa)
    backToPause: () => {
        gameState = STATE.PAUSED;
        setReturnToPause(false);
    }
});

// ---- INPUT ACTIONS ----
let _musicStarted = false;
onAction(action => {
    resumeCtx();
    // Iniciar música del menú en el primer gesto del usuario
    if (!_musicStarted) { _musicStarted = true; playMusic('menu'); }

    if (typeof action === 'object') {
        // Touch / click — pos ya viene en coordenadas lógicas desde input.js
        if (action.type === 'touch' || action.type === 'click') {
            const pos = action.pos;

            if (gameState === STATE.MENU)     { menuClick(pos.x, pos.y); return; }
            if (gameState === STATE.STORY)    { storyAdvance(); return; }
            if (gameState === STATE.GAMEOVER) { startGame(); return; }

            // Botón pausa en juego (móvil)
            if (gameState === STATE.PLAYING) {
                const pb = PAUSE_INGAME_BTN;
                const dx = pos.x - (pb.x + pb.r);
                const dy = pos.y - (pb.y + pb.r);
                if (Math.hypot(dx, dy) <= pb.r + 5) { // +5 de margen de toque
                    gameState = STATE.PAUSED; return;
                }
            }

            if (gameState === STATE.PAUSED) {
                const bx = PAUSE_BTN_CONTINUE.x;
                const bw = PAUSE_BTN_CONTINUE.w;
                
                if (pos.x >= bx && pos.x <= bx + bw) {
                    if (pos.y >= PAUSE_BTN_CONTINUE.y && pos.y <= PAUSE_BTN_CONTINUE.y + PAUSE_BTN_CONTINUE.h) {
                        gameState = STATE.PLAYING; return;
                    }
                    if (pos.y >= PAUSE_BTN_OPTIONS.y && pos.y <= PAUSE_BTN_OPTIONS.y + PAUSE_BTN_OPTIONS.h) {
                        gameState = STATE.MENU;
                        setReturnToPause(true);
                        setMenuState(MENU.OPTIONS);
                        return;
                    }
                    if (pos.y >= PAUSE_BTN_EXIT.y && pos.y <= PAUSE_BTN_EXIT.y + PAUSE_BTN_EXIT.h) {
                        goToMenu(); return;
                    }
                }
                // En móvil no cerrar pausa con tap fuera de botones
                if (!Utils.isMobile) gameState = STATE.PLAYING;
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
    // Nueva acción para abrir opciones desde teclado en pausa
    if (action === 'options') {
        if (gameState === STATE.PAUSED) {
            gameState = STATE.MENU;
            setReturnToPause(true);
            setMenuState(MENU.OPTIONS);
            return;
        }
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
    if (p.type === 'oxygen') player.oxygen = Math.min(player.maxOxygen, player.oxygen + 12);
    else if (p.type === 'fuel') player.fuel = Math.min(player.maxFuel, player.fuel + 10);
    else player.health = Math.min(player.maxHealth, player.health + 15);
    spawnExplosion(p.x, p.y, p.type === 'oxygen' ? '#4488ff' : p.type === 'fuel' ? '#44dd66' : '#ff4466', 8, 40);
    p.alive = false;
    score += 50;
    playSFX('pickup');
}

function collectSupplyDrop(sd) {
    if (sd.type === 'oxygen') player.oxygen = Math.min(player.maxOxygen, player.oxygen + sd.amount);
    else player.fuel = Math.min(player.maxFuel, player.fuel + sd.amount);
    spawnExplosion(sd.x + sd.w / 2, sd.y + sd.h / 2, sd.type === 'oxygen' ? '#4488ff' : '#44dd66', 14, 60);
    sd.alive = false;
    score += 150;
    playSFX('pickup');
}

function collectCheckpoint(cp) {
    // Guardar estado en localStorage
    const saveData = {
        level: cp.level,
        score: score,
        date: new Date().toISOString()
    };
    localStorage.setItem('astronautaColombiano_Checkpoint', JSON.stringify(saveData));
    
    // Notificación visual
    upgradeNotif.text = '★ PUNTO DE CONTROL GUARDADO ★';
    upgradeNotif.color = '#e8c840';
    upgradeNotif.timer = 4.0;
    
    spawnExplosion(cp.x + cp.w / 2, cp.y + cp.h / 2, '#e8c840', 25, 100);
    triggerFlash('#e8c840', 0.2);
    cp.alive = false;
    score += 500;
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

    // Spawn supply drops (oxygen tank / fuel canister grandes)
    supplyDropTimer -= dt;
    if (supplyDropTimer <= 0) {
        const type = Math.random() < 0.5 ? 'oxygen' : 'fuel';
        supplyDrops.push(new SupplyDrop(type));
        supplyDropTimer = 18 - Math.min(difficultyLevel * 0.5, 8); // más frecuente con dificultad
    }

    // Spawn Checkpoints (Reliquias) - Cada 5 niveles
    if (difficultyLevel % 5 === 0 && !checkpointSpawned) {
        checkpoints.push(new Checkpoint(difficultyLevel, Math.floor(Math.random() * 3)));
        checkpointSpawned = true;
    } else if (difficultyLevel % 5 !== 0) {
        checkpointSpawned = false; // Reset para el siguiente múltiplo de 5
    }

    // Spawn Black Holes (Nuevo Enemigo)
    blackHoleTimer -= dt;
    if (blackHoleTimer <= 0 && difficultyLevel >= 3) {
        blackHoles.push(new BlackHole());
        blackHoleTimer = 25 - Math.min(difficultyLevel * 0.8, 12);
    }

    // Spawn Solar Storm (Evento Aleatorio)
    solarStormTimer -= dt;
    if (solarStormTimer <= 0 && !solarStorm && difficultyLevel >= 5) {
        solarStorm = new SolarStorm();
        triggerFlash('#ff6600', 0.4);
        playSFX('hit'); // Sonido de alerta
    }

    // Black Hole collisions & update
    for (const bh of blackHoles) {
        const drain = bh.update(dt, player);
        if (drain > 0 && player.alive) {
            // Aplicar drenaje de vida (max 15 HP/s en el centro)
            player.health -= bh.maxDrain * drain * dt;
            if (Math.random() < 0.1) triggerFlash('#4400aa', 0.05); // Destello púrpura sutil
            
            if (player.health <= 0) {
                player.health = 0;
                damagePlayer(0, score, highScore, ns => { highScore = ns; localStorage.setItem('astronautaColombiano_HS', ns); });
            }
        }

        if (bh.alive && player.alive) {
            const dist = Math.hypot((player.x + player.w / 2) - (bh.x + bh.w / 2), (player.y + player.h / 2) - (bh.y + bh.h / 2));
            if (dist < bh.w * 0.3) { // Daño por impacto directo en el núcleo
                damagePlayer(15, score, highScore, ns => { highScore = ns; localStorage.setItem('astronautaColombiano_HS', ns); });
                bh.alive = false;
            }
        }
    }

    // Solar Storm update
    if (solarStorm) {
        solarStorm.update(dt);
        if (Math.random() < 0.05) triggerShake(2, 0.1);
        player.oxygen -= dt * 2; // Drenaje extra de oxígeno durante la tormenta
        if (!solarStorm.active) {
            solarStorm = null;
            solarStormTimer = 40 + Math.random() * 30;
        }
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

    // Supply drops
    for (const sd of supplyDrops) {
        sd.update(dt);
        if (sd.alive) {
            const pd = Math.hypot((player.x + player.w / 2) - (sd.x + sd.w / 2),
                                  (player.y + player.h / 2) - (sd.y + sd.h / 2));
            if (pd < sd.w / 2 + 12) collectSupplyDrop(sd);
        }
    }

    // Checkpoints (Reliquias)
    for (const cp of checkpoints) {
        cp.update(dt);
        if (cp.alive) {
            const pd = Math.hypot((player.x + player.w / 2) - (cp.x + cp.w / 2),
                                  (player.y + player.h / 2) - (cp.y + cp.h / 2));
            if (pd < cp.w / 2 + 15) collectCheckpoint(cp);
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
    supplyDrops = supplyDrops.filter(sd => sd.alive);
    blackHoles = blackHoles.filter(bh => bh.alive);
    checkpoints = checkpoints.filter(cp => cp.alive);
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
    if (solarStorm) solarStorm.draw();
    drawParticles();
    for (const f of fragments) f.draw();
    for (const bh of blackHoles) bh.draw(time);
    for (const cp of checkpoints) cp.draw(time);
    for (const b of bullets) b.draw();
    for (const p of pickups) p.draw(time);
    for (const sd of supplyDrops) sd.draw(time);
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
    drawUpgradeNotif(upgradeNotif);
    drawJoystick();
    drawPauseButton();

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
        loadSprite('oxygenTank', 'img/oxygen-tank.png'),
        loadSprite('fuelCanister', 'img/combustible.jpg'),
        loadAllSounds(),
    ]);
    // La música se inicia en el primer gesto del usuario (resumeCtx lo maneja)
    // No llamar playMusic aquí para evitar el error de AudioContext
    requestAnimationFrame(ts => { lastTime = ts / 1000; gameLoop(ts); });
}

boot();
