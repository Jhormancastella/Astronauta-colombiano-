// --- RENDERER: HUD, fondo, overlays ---
import { s, BASE_W, BASE_H } from './utils.js';
import * as Utils from './utils.js';
import { player } from './player.js';
import { joystick, getJoystickRadius } from './input.js';
import { t } from './i18n.js';

let _ctx = null;
let _gameTime = () => 0;
let _score    = () => 0;
let _level    = () => 1;

export function initRenderer(ctx, getGameTime, getScore, getLevel) {
    _ctx = ctx;
    _gameTime = getGameTime;
    _score    = getScore;
    _level    = getLevel;
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
    const score    = _score();
    const level    = _level();
    const barW = 90, barH = 9, barX = 10;
    let barY = 12;
    const gap = 15;

    _drawBar(barX, barY, barW, barH, player.health, player.maxHealth, '#ff4444', '#880000', '❤ HP');
    barY += gap;
    _drawBar(barX, barY, barW, barH, player.oxygen, player.maxOxygen, '#4488ff', '#003388', 'O₂');
    barY += gap;
    _drawBar(barX, barY, barW, barH, player.fuel,   player.maxFuel,   '#44dd66', '#006622', '⛽');

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

    if (player.oxygen < 25 && Math.sin(gameTime * 6) > 0) {
        _ctx.fillStyle = '#ff4444';
        _ctx.font = `bold ${s(9)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(t('hudOxyLow'), s(BASE_W / 2), s(58));
    }
    if (player.fuel < 15 && Math.sin(gameTime * 5) > 0) {
        _ctx.fillStyle = '#ffaa00';
        _ctx.font = `bold ${s(9)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(t('hudFuelLow'), s(BASE_W / 2), s(70));
    }
}

function _drawBar(x, y, w, h, value, max, color, bgColor, label) {
    const ratio    = Math.max(0, Math.min(1, value / max));
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

// Joystick — solo lado izquierdo, sin botón FIRE visible
export function drawJoystick() {
    if (!Utils.isMobile) return;

    if (!joystick.active) {
        _ctx.beginPath();
        _ctx.arc(s(Utils.BASE_W * 0.22), s(Utils.BASE_H - 90), s(getJoystickRadius()), 0, Math.PI * 2);
        _ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        _ctx.lineWidth = s(1.5);
        _ctx.stroke();
        _ctx.fillStyle = 'rgba(255,255,255,0.02)';
        _ctx.fill();
    } else {
        const JR = getJoystickRadius();
        _ctx.beginPath();
        _ctx.arc(s(joystick.startX), s(joystick.startY), s(JR), 0, Math.PI * 2);
        _ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        _ctx.lineWidth = s(2);
        _ctx.stroke();
        _ctx.fillStyle = 'rgba(255,255,255,0.04)';
        _ctx.fill();
        _ctx.beginPath();
        _ctx.arc(s(joystick.startX + joystick.dx), s(joystick.startY + joystick.dy),
            s(20), 0, Math.PI * 2);
        _ctx.fillStyle = 'rgba(255,255,255,0.38)';
        _ctx.fill();
        _ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        _ctx.lineWidth = s(1.5);
        _ctx.stroke();
    }
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

// El ancho de los botones de pausa debe ser contenido en pantallas anchas
function pW() { return Math.min(BASE_W - 80, 320); }
function pX() { return (BASE_W - pW()) / 2; }

export const PAUSE_BTN_CONTINUE = { get x() { return pX(); }, y: BASE_H / 2 - 45, get w() { return pW(); }, h: 44 };
export const PAUSE_BTN_OPTIONS  = { get x() { return pX(); }, y: BASE_H / 2 + 10, get w() { return pW(); }, h: 44 };
export const PAUSE_BTN_EXIT     = { x: 50, y: BASE_H / 2 + 65, w: 300, h: 44 }; // Referencia base, se usa pX/pW en draw
// Botón pausa en juego (móvil) — Más abajo y circular
export const PAUSE_INGAME_BTN   = { x: 10, y: 80, r: 18 };

export function drawPauseButton() {
    if (!Utils.isMobile) return;
    const b = PAUSE_INGAME_BTN;
    const cx = s(b.x + b.r);
    const cy = s(b.y + b.r);
    const r  = s(b.r);

    // Fondo circular con glow suave
    _ctx.beginPath();
    _ctx.arc(cx, cy, r, 0, Math.PI * 2);
    _ctx.fillStyle = 'rgba(255,255,255,0.12)';
    _ctx.fill();
    _ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    _ctx.lineWidth = s(1.5);
    _ctx.stroke();

    // Icono ❚❚ centrado
    _ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const iw = s(3), ih = s(12), ig = s(4);
    _ctx.fillRect(cx - ig/2 - iw, cy - ih/2, iw, ih);
    _ctx.fillRect(cx + ig/2,      cy - ih/2, iw, ih);
}

export function drawPause(time) {
    _ctx.fillStyle = 'rgba(0,0,0,0.85)';
    _ctx.fillRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
    
    const bx = pX();
    const bw = pW();

    _ctx.fillStyle = '#fff';
    _ctx.font = `bold ${s(32)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(t('pauseTitle'), s(BASE_W / 2), s(BASE_H / 2 - 120));

    // Botones (unificados para PC y móvil)
    _drawPauseBtn({ x: bx, y: PAUSE_BTN_CONTINUE.y, w: bw, h: 44 }, t('pauseCont'), '#e8c840', 'rgba(232,200,64,0.15)');
    _drawPauseBtn({ x: bx, y: PAUSE_BTN_OPTIONS.y,  w: bw, h: 44 }, t('pauseOpt'), '#4488ff', 'rgba(68,136,255,0.15)');
    _drawPauseBtn({ x: bx, y: PAUSE_BTN_EXIT.y,     w: bw, h: 44 }, t('pauseExit'), '#ff5555', 'rgba(255,80,80,0.1)');

    if (!Utils.isMobile) {
        _ctx.fillStyle = '#888';
        _ctx.font = `${s(9)}px Courier New`;
        _ctx.fillText(t('pauseContPC'), s(BASE_W / 2), s(BASE_H / 2 + 135));
    }
}

function _drawPauseBtn(b, label, color, fill) {
    _ctx.fillStyle = fill;
    _ctx.fillRect(s(b.x), s(b.y), s(b.w), s(b.h));
    _ctx.strokeStyle = color;
    _ctx.lineWidth = s(1.5);
    _ctx.strokeRect(s(b.x), s(b.y), s(b.w), s(b.h));
    _ctx.fillStyle = color;
    _ctx.font = `bold ${s(13)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.textBaseline = 'middle'; // Centrado vertical exacto
    _ctx.fillText(label, s(b.x + b.w / 2), s(b.y + b.h / 2 + 2));
    _ctx.textBaseline = 'alphabetic'; // Reset
}

export function drawGameOver(time, score, highScore, gameTime, difficultyLevel, deathCause) {
    _ctx.fillStyle = 'rgba(0,0,0,0.82)';
    _ctx.fillRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
    _ctx.fillStyle = '#ff4444';
    _ctx.font = `bold ${s(30)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(t('goTitle'), s(BASE_W / 2), s(190));

    const causeText = deathCause === 'oxygen' ? t('goOxy') :
                      deathCause === 'fuel'   ? t('goFuel') : t('goDestroyed');
    _ctx.fillStyle = deathCause === 'oxygen' ? '#4488ff' :
                     deathCause === 'fuel'   ? '#44dd66' : '#ff8800';
    _ctx.font = `${s(10)}px Courier New`;
    _ctx.fillText(causeText, s(BASE_W / 2), s(218));

    _ctx.fillStyle = '#fff';
    _ctx.font = `${s(12)}px Courier New`;
    _ctx.fillText(`${t('goScore')} ${score}`, s(BASE_W / 2), s(258));
    const mins = Math.floor(gameTime / 60);
    const secs = Math.floor(gameTime % 60);
    _ctx.fillText(`${t('goTime')} ${mins}:${secs.toString().padStart(2, '0')}`, s(BASE_W / 2), s(282));
    _ctx.fillText(`${t('goLevel')} ${difficultyLevel}`, s(BASE_W / 2), s(306));

    if (score >= highScore) {
        _ctx.fillStyle = '#e8c840';
        _ctx.font = `bold ${s(14)}px Courier New`;
        _ctx.fillText(t('goRecord'), s(BASE_W / 2), s(348));
    } else {
        _ctx.fillStyle = '#888';
        _ctx.font = `${s(10)}px Courier New`;
        _ctx.fillText(`${t('goBest')} ${highScore}`, s(BASE_W / 2), s(345));
    }

    const alpha = 0.5 + 0.5 * Math.sin(time * 3);
    _ctx.globalAlpha = alpha;
    _ctx.fillStyle = '#fff';
    _ctx.font = `bold ${s(12)}px Courier New`;
    _ctx.fillText(Utils.isMobile ? t('goRestart') : t('goRestartPC'), s(BASE_W / 2), s(420));
    _ctx.globalAlpha = 1;
    _ctx.fillStyle = '#555';
    _ctx.font = `${s(9)}px Courier New`;
    _ctx.fillText(Utils.isMobile ? '' : t('goMenuPC'), s(BASE_W / 2), s(448));
}

export function drawWeaponHUD(weaponName, weaponColor, gameTime, difficulty, getUnlockTimesFn) {
    const unlocks = getUnlockTimesFn(difficulty);
    let nextUnlock = null;
    for (const t of unlocks) {
        if (gameTime < t) { nextUnlock = t; break; }
    }
    _ctx.fillStyle = weaponColor;
    _ctx.font = `bold ${s(8)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText(`⚡ ${weaponName}`, s(10), s(BASE_H - 18));

    if (nextUnlock !== null) {
        const prevUnlock = unlocks.filter(t => t <= gameTime).pop() ?? 0;
        const progress = (gameTime - prevUnlock) / (nextUnlock - prevUnlock);
        const barX = 10, barW = 80, barH = 4, barY = BASE_H - 12;
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
        _ctx.fillText(`${t('hudNextUpg')} ${remaining}s`, s(barX + barW + 4), s(barY + barH));
    }
}

export function drawUpgradeNotif(notif) {
    if (notif.timer <= 0) return;
    const alpha = Math.min(1, notif.timer) * (notif.timer < 0.5 ? notif.timer * 2 : 1);
    _ctx.globalAlpha = alpha;
    _ctx.fillStyle = notif.color;
    _ctx.font = `bold ${s(14)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(notif.text, s(BASE_W / 2), s(BASE_H / 2 - 60));
    _ctx.globalAlpha = 1;
}
