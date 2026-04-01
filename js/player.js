// --- PLAYER ---
import { s, BASE_W, BASE_H, sprites } from './utils.js';
import * as Utils from './utils.js';
import { spawnExplosion } from './particles.js';

let _ctx = null;
export function initPlayer(ctx) { _ctx = ctx; }

export const player = {
    x: 190, y: 580,
    w: 20, h: 24,
    speed: 160,
    vx: 0, vy: 0,
    health: 100, maxHealth: 100,
    oxygen: 100, maxOxygen: 100,
    fuel: 100, maxFuel: 100,
    invincible: 0,
    shootCooldown: 0,
    shootRate: 0.22,
    alive: true,
    thrustAnim: 0,
    deathCause: null,
    deathTimer: 0,
    exploding: false,
    fuelEmptyTimer: 0,
};

export function resetPlayer() {
    // Centrar en el BASE_W actual (dinámico)
    player.x = Utils.BASE_W / 2 - player.w / 2;
    player.y = Utils.BASE_H - 120;
    player.vx = 0; player.vy = 0;
    player.health = 100;
    player.oxygen = 100;
    player.fuel = 100;
    player.invincible = 0;
    player.shootCooldown = 0;
    player.alive = true;
    player.thrustAnim = 0;
    player.deathCause = null;
    player.deathTimer = 0;
    player.exploding = false;
    player.fuelEmptyTimer = 0;
}

let _onDeath = null;
let _onDamage = null;
export function onPlayerDeath(fn) { _onDeath = fn; }
export function onPlayerDamage(fn) { _onDamage = fn; }

function killPlayer(cause, score, highScore, onNewHS) {
    if (!player.alive) return;
    player.alive = false;
    player.health = 0;
    player.deathCause = cause;
    player.exploding = true;
    player.deathTimer = 0;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    spawnExplosion(cx, cy, '#ff6', 40, 140);
    spawnExplosion(cx, cy, '#f80', 25, 100);
    spawnExplosion(cx, cy, '#fff', 15, 60);
    if (score > highScore) onNewHS(score);
    if (_onDeath) setTimeout(_onDeath, 1000);
}

export function damagePlayer(amount, score, highScore, onNewHS) {
    if (player.invincible > 0 || !player.alive) return;
    player.health -= amount;
    player.invincible = 0.8;
    if (_onDamage) _onDamage();
    spawnExplosion(player.x + player.w / 2, player.y + player.h / 2, '#ff4', 8, 60);
    if (player.health <= 0) killPlayer('hp', score, highScore, onNewHS);
}

export function killByOxygen(score, highScore, onNewHS) {
    killPlayer('oxygen', score, highScore, onNewHS);
}

export function killByFuel(score, highScore, onNewHS) {
    killPlayer('fuel', score, highScore, onNewHS);
}

export function updatePlayerDeath(dt) {
    if (player.exploding) player.deathTimer += dt;
}

export function drawPlayer(time) {
    if (player.exploding) {
        const progress = Math.min(player.deathTimer / 0.9, 1);
        const alpha = 1 - progress;
        const scale = 1 + progress * 2.5;
        const cx = player.x + player.w / 2;
        const cy = player.y + player.h / 2;
        const size = player.w * 3.5 * scale;
        _ctx.globalAlpha = alpha;
        if (sprites.explosion) {
            _ctx.drawImage(sprites.explosion,
                s(cx - size / 2), s(cy - size / 2), s(size), s(size));
        } else {
            _ctx.fillStyle = '#ff8800';
            _ctx.beginPath();
            _ctx.arc(s(cx), s(cy), s(size / 2), 0, Math.PI * 2);
            _ctx.fill();
        }
        _ctx.globalAlpha = 1;
        return;
    }

    if (!player.alive) return;

    const { x: px, y: py, w: pw, h: ph, vx, vy, oxygen, fuel, invincible } = player;

    if (invincible > 0 && Math.sin(time * 20) > 0) _ctx.globalAlpha = 0.4;

    if (Math.hypot(vx, vy) > 10 && fuel > 0) {
        const tl = 3 + Math.sin(time * 20) * 2;
        _ctx.fillStyle = '#f80';
        _ctx.fillRect(s(px + pw / 2 - 3), s(py + ph), s(6), s(tl));
        _ctx.fillStyle = '#ff6';
        _ctx.fillRect(s(px + pw / 2 - 2), s(py + ph), s(4), s(tl * 0.6));
    }

    if (sprites.player) {
        _ctx.drawImage(sprites.player, s(px), s(py), s(pw), s(ph));
    } else {
        _ctx.fillStyle = '#e8c840';
        _ctx.fillRect(s(px + 2), s(py + 6), s(pw - 4), s(ph - 8));
        _ctx.fillStyle = '#fff';
        _ctx.fillRect(s(px + 4), s(py), s(pw - 8), s(8));
        _ctx.fillStyle = '#4488cc';
        _ctx.fillRect(s(px + 5), s(py + 2), s(pw - 10), s(4));
    }

    const o2Color = oxygen > 50 ? '#0f0' : (oxygen > 25 ? '#ff0' : '#f00');
    _ctx.fillStyle = o2Color;
    _ctx.fillRect(s(px + pw / 2 - 1), s(py + 8), s(2), s(2));

    _ctx.globalAlpha = 1;
}
