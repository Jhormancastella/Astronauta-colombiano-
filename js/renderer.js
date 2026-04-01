// --- RENDERER: HUD, fondo, overlays ---
import { s, BASE_W, BASE_H, isMobile } from './utils.js';
import * as Utils from './utils.js';
import { player } from './player.js';
import { joystick, shootButton, getJoystickRadius, getFireButtonCenter, FIRE_BTN_RADIUS } from './input.js';

let _ctx = null;
let _gameTime = () => 0;
let _score = () => 0;
let _level = () => 1;

export function initRenderer(ctx, getGameTime, getScore, getLevel) {
    _ctx = ctx;
    _gameTime = getGameTime;
    _score = getScore;
    _level = getLevel;
}

export function drawBackground(time, stars) {
    const grad = _ctx.createLinearGradient(0, 0, 0, _ctx.canvas.height);
    grad.addColorStop(0, '#050510');
    grad.addColorStop(0.5, '#0a0a20');
    grad.addColorStop(1, '#0f0a15');
    _ctx.fillStyle = grad;
    _ctx.fillRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);

    _ctx.globalAlpha = 0.03;
    _ctx.fillStyle = '#4400aa';
    _ctx.beginPath();
    _ctx.arc(s(100 + Math.sin(time * 0.2) * 20), s(200), s(120), 0, Math.PI * 2);
    _ctx.fill();
    _ctx.fillStyle = '#aa2200';
    _ctx.beginPath();
    _ctx.arc(s(300 + Math.cos(time * 0.15) * 15), s(400), s(100), 0, Math.PI * 2);
    _ctx.fill();
    _ctx.globalAlpha = 1;

    for (const st of stars) st.draw(time);
}

export function drawHUD() {
    const gameTime = _gameTime();
    const score = _score();
    const level = _level();
    const barW = 90, barH = 9, barX = 10;
    let barY = 12;
    const gap = 15;

    drawBar(barX, barY, barW, barH, player.health, player.maxHealth, '#ff4444', '#880000', '❤ HP');
    barY += gap;
    drawBar(barX, barY, barW, barH, player.oxygen, player.maxOxygen, '#4488ff', '#003388', 'O₂');
    barY += gap;
    drawBar(barX, barY, barW, barH, player.fuel, player.maxFuel, '#44dd66', '#006622', '⛽');

    // Score
    _ctx.fillStyle = '#fff';
    _ctx.font = `bold ${s(13)}px Courier New`;
    _ctx.textAlign = 'right';
    _ctx.fillText(`${score}`, s(BASE_W - 10), s(22));

    _ctx.font = `${s(8)}px Courier New`;
    _ctx.fillStyle = '#aaa';
    _ctx.fillText(`LVL ${level}`, s(BASE_W - 10), s(34));

    const mins = Math.floor(gameTime / 60);
    const secs = Math.floor(gameTime % 60);
    _ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, s(BASE_W - 10), s(44));

    // Alertas
    if (player.oxygen < 25 && Math.sin(gameTime * 6) > 0) {
        _ctx.fillStyle = '#ff4444';
        _ctx.font = `bold ${s(9)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText('⚠ OXÍGENO BAJO ⚠', s(BASE_W / 2), s(58));
    }
    if (player.fuel < 15 && Math.sin(gameTime * 5) > 0) {
        _ctx.fillStyle = '#ffaa00';
        _ctx.font = `bold ${s(9)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText('⚠ COMBUSTIBLE BAJO ⚠', s(BASE_W / 2), s(70));
    }
}

function drawBar(x, y, w, h, value, max, color, bgColor, label) {
    const ratio = Math.max(0, Math.min(1, value / max));
    const gameTime = _gameTime();

    _ctx.fillStyle = '#111';
    _ctx.fillRect(s(x), s(y), s(w), s(h));
    _ctx.fillStyle = bgColor;
    _ctx.fillRect(s(x + 1), s(y + 1), s(w - 2), s(h - 2));
    _ctx.fillStyle = color;
    _ctx.fillRect(s(x + 1), s(y + 1), s((w - 2) * ratio), s(h - 2));

    if (ratio < 0.25) {
        _ctx.fillStyle = `rgba(255,255,255,${0.1 + 0.1 * Math.sin(gameTime * 8)})`;
        _ctx.fillRect(s(x + 1), s(y + 1), s((w - 2) * ratio), s(h - 2));
    }

    _ctx.strokeStyle = '#444';
    _ctx.lineWidth = s(0.5);
    _ctx.strokeRect(s(x), s(y), s(w), s(h));

    _ctx.fillStyle = '#fff';
    _ctx.font = `${s(7)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText(label, s(x + w + 4), s(y + h - 1));
}

export function drawJoystick() {
    if (!Utils.isMobile) return;

    const fireBtn = getFireButtonCenter();

    // Zona joystick — indicador estático en reposo (lado izquierdo)
    if (!joystick.active) {
        _ctx.beginPath();
        _ctx.arc(s(Utils.BASE_W * 0.22), s(Utils.BASE_H - 90), s(getJoystickRadius()), 0, Math.PI * 2);
        _ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        _ctx.lineWidth = s(1.5);
        _ctx.stroke();
        _ctx.fillStyle = 'rgba(255,255,255,0.03)';
        _ctx.fill();
    }

    // Joystick activo
    if (joystick.active) {
        const JR = getJoystickRadius();
        // Anillo exterior
        _ctx.beginPath();
        _ctx.arc(s(joystick.startX), s(joystick.startY), s(JR), 0, Math.PI * 2);
        _ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        _ctx.lineWidth = s(2);
        _ctx.stroke();
        _ctx.fillStyle = 'rgba(255,255,255,0.05)';
        _ctx.fill();
        // Knob
        _ctx.beginPath();
        _ctx.arc(s(joystick.startX + joystick.dx), s(joystick.startY + joystick.dy),
            s(20), 0, Math.PI * 2);
        _ctx.fillStyle = 'rgba(255,255,255,0.4)';
        _ctx.fill();
        _ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        _ctx.lineWidth = s(1.5);
        _ctx.stroke();
    }

    // Botón FIRE — siempre visible
    _ctx.beginPath();
    _ctx.arc(s(fireBtn.x), s(fireBtn.y), s(30), 0, Math.PI * 2);
    _ctx.fillStyle = shootButton.active ? 'rgba(255,80,80,0.45)' : 'rgba(255,255,255,0.08)';
    _ctx.fill();
    _ctx.strokeStyle = shootButton.active ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.28)';
    _ctx.lineWidth = s(2);
    _ctx.stroke();

    _ctx.fillStyle = shootButton.active ? '#fff' : 'rgba(255,255,255,0.6)';
    _ctx.font = `bold ${s(11)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.textBaseline = 'middle';
    _ctx.fillText('FIRE', s(fireBtn.x), s(fireBtn.y));
    _ctx.textBaseline = 'alphabetic';
}

export function drawVignette() {
    const vignette = _ctx.createRadialGradient(
        _ctx.canvas.width / 2, _ctx.canvas.height / 2, _ctx.canvas.height * 0.3,
        _ctx.canvas.width / 2, _ctx.canvas.height / 2, _ctx.canvas.height * 0.7
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    _ctx.fillStyle = vignette;
    _ctx.fillRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
}

// Zonas táctiles de la pausa (en coordenadas BASE)
export const PAUSE_BTN_CONTINUE = { x: 50, y: BASE_H / 2 - 30, w: BASE_W - 100, h: 44 };
export const PAUSE_BTN_EXIT     = { x: 50, y: BASE_H / 2 + 28, w: BASE_W - 100, h: 44 };

// Botón de pausa en juego (móvil) — esquina superior derecha
export const PAUSE_INGAME_BTN = { x: BASE_W - 38, y: 6, w: 32, h: 32 };

export function drawPauseButton() {
    if (!Utils.isMobile) return;
    const b = PAUSE_INGAME_BTN;
    _ctx.fillStyle = 'rgba(255,255,255,0.07)';
    _ctx.fillRect(s(b.x), s(b.y), s(b.w), s(b.h));
    _ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    _ctx.lineWidth = s(1);
    _ctx.strokeRect(s(b.x), s(b.y), s(b.w), s(b.h));
    // Icono ❚❚
    _ctx.fillStyle = 'rgba(255,255,255,0.7)';
    _ctx.fillRect(s(b.x + 9),  s(b.y + 9), s(5), s(14));
    _ctx.fillRect(s(b.x + 18), s(b.y + 9), s(5), s(14));
}

export function drawPause(time) {
    _ctx.fillStyle = 'rgba(0,0,0,0.75)';
    _ctx.fillRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);

    // Título
    _ctx.fillStyle = '#fff';
    _ctx.font = `bold ${s(26)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText('PAUSA', s(BASE_W / 2), s(BASE_H / 2 - 60));

    if (isMobile) {
        // Móvil: dos botones táctiles grandes
        // Botón CONTINUAR
        _ctx.fillStyle = 'rgba(232,200,64,0.12)';
        _ctx.fillRect(s(50), s(BASE_H / 2 - 30), s(BASE_W - 100), s(44));
        _ctx.strokeStyle = '#e8c840';
        _ctx.lineWidth = s(1.5);
        _ctx.strokeRect(s(50), s(BASE_H / 2 - 30), s(BASE_W - 100), s(44));
        _ctx.fillStyle = '#e8c840';
        _ctx.font = `bold ${s(13)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText('▶  CONTINUAR', s(BASE_W / 2), s(BASE_H / 2 - 2));

        // Botón SALIR AL MENÚ
        _ctx.fillStyle = 'rgba(255,80,80,0.1)';
        _ctx.fillRect(s(50), s(BASE_H / 2 + 28), s(BASE_W - 100), s(44));
        _ctx.strokeStyle = '#ff5555';
        _ctx.lineWidth = s(1.5);
        _ctx.strokeRect(s(50), s(BASE_H / 2 + 28), s(BASE_W - 100), s(44));
        _ctx.fillStyle = '#ff5555';
        _ctx.font = `bold ${s(13)}px Courier New`;
        _ctx.fillText('✕  SALIR AL MENÚ', s(BASE_W / 2), s(BASE_H / 2 + 56));
    } else {
        // Desktop: instrucciones de teclado
        const alpha = 0.5 + 0.5 * Math.sin(time * 3);
        _ctx.globalAlpha = alpha;
        _ctx.fillStyle = '#e8c840';
        _ctx.font = `${s(11)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText('P  →  CONTINUAR', s(BASE_W / 2), s(BASE_H / 2 - 10));
        _ctx.globalAlpha = 1;

        _ctx.fillStyle = '#ff5555';
        _ctx.font = `${s(10)}px Courier New`;
        _ctx.fillText('ESC  →  SALIR AL MENÚ', s(BASE_W / 2), s(BASE_H / 2 + 20));
    }
}

export function drawGameOver(time, score, highScore, gameTime, difficultyLevel, deathCause) {
    _ctx.fillStyle = 'rgba(0,0,0,0.82)';
    _ctx.fillRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);

    _ctx.fillStyle = '#ff4444';
    _ctx.font = `bold ${s(30)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText('GAME OVER', s(BASE_W / 2), s(190));

    // Causa de muerte
    const causeText = deathCause === 'oxygen' ? '💀 Sin oxígeno' :
                      deathCause === 'fuel'   ? '💀 Sin combustible' :
                                                '💀 Destruido';
    _ctx.fillStyle = deathCause === 'oxygen' ? '#4488ff' :
                     deathCause === 'fuel'   ? '#44dd66' : '#ff8800';
    _ctx.font = `${s(10)}px Courier New`;
    _ctx.fillText(causeText, s(BASE_W / 2), s(218));

    _ctx.fillStyle = '#fff';
    _ctx.font = `${s(12)}px Courier New`;
    _ctx.fillText(`PUNTUACIÓN: ${score}`, s(BASE_W / 2), s(258));

    const mins = Math.floor(gameTime / 60);
    const secs = Math.floor(gameTime % 60);
    _ctx.fillText(`TIEMPO: ${mins}:${secs.toString().padStart(2, '0')}`, s(BASE_W / 2), s(282));
    _ctx.fillText(`NIVEL: ${difficultyLevel}`, s(BASE_W / 2), s(306));

    if (score >= highScore) {
        _ctx.fillStyle = '#e8c840';
        _ctx.font = `bold ${s(14)}px Courier New`;
        _ctx.fillText('★ NUEVO RÉCORD ★', s(BASE_W / 2), s(348));
    } else {
        _ctx.fillStyle = '#888';
        _ctx.font = `${s(10)}px Courier New`;
        _ctx.fillText(`MEJOR: ${highScore}`, s(BASE_W / 2), s(345));
    }

    const alpha = 0.5 + 0.5 * Math.sin(time * 3);
    _ctx.globalAlpha = alpha;
    _ctx.fillStyle = '#fff';
    _ctx.font = `bold ${s(12)}px Courier New`;
    _ctx.fillText(isMobile ? 'TOCA PARA REINICIAR' : 'ENTER  REINICIAR', s(BASE_W / 2), s(420));
    _ctx.globalAlpha = 1;

    _ctx.fillStyle = '#555';
    _ctx.font = `${s(9)}px Courier New`;
    _ctx.fillText(isMobile ? '' : 'ESC  Menú principal', s(BASE_W / 2), s(448));
}

// ---- WEAPON HUD ----
export function drawWeaponHUD(weaponName, weaponColor, gameTime, difficulty, getUnlockTimesFn) {
    const unlocks = getUnlockTimesFn(difficulty);
    // Próximo unlock
    let nextUnlock = null;
    for (const t of unlocks) {
        if (gameTime < t) { nextUnlock = t; break; }
    }

    // Indicador de arma actual (esquina inferior izquierda)
    _ctx.fillStyle = weaponColor;
    _ctx.font = `bold ${s(8)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText(`⚡ ${weaponName}`, s(10), s(BASE_H - 18));

    // Barra de progreso hacia siguiente arma
    if (nextUnlock !== null) {
        const prevUnlock = unlocks.filter(t => t <= gameTime).pop() ?? 0;
        const progress = (gameTime - prevUnlock) / (nextUnlock - prevUnlock);
        const barX = 10, barW = 80, barH = 4;
        const barY = BASE_H - 12;

        _ctx.fillStyle = '#111';
        _ctx.fillRect(s(barX), s(barY), s(barW), s(barH));
        _ctx.fillStyle = weaponColor;
        _ctx.fillRect(s(barX), s(barY), s(barW * progress), s(barH));
        _ctx.strokeStyle = '#333';
        _ctx.lineWidth = s(0.5);
        _ctx.strokeRect(s(barX), s(barY), s(barW), s(barH));

        const remaining = Math.ceil(nextUnlock - gameTime);
        _ctx.fillStyle = '#444';
        _ctx.font = `${s(6)}px Courier New`;
        _ctx.textAlign = 'left';
        _ctx.fillText(`próx. mejora: ${remaining}s`, s(barX + barW + 4), s(barY + barH));
    }
}

export function drawUpgradeNotif(notif, time) {
    if (notif.timer <= 0) return;
    const alpha = Math.min(1, notif.timer) * (notif.timer < 0.5 ? notif.timer * 2 : 1);
    _ctx.globalAlpha = alpha;
    _ctx.fillStyle = notif.color;
    _ctx.font = `bold ${s(14)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(notif.text, s(BASE_W / 2), s(BASE_H / 2 - 60));
    _ctx.globalAlpha = 1;
}
