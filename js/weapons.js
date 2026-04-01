// --- WEAPON SYSTEM ---
// Niveles desbloqueados por tiempo de juego:
//   0 = Simple  (0s)    — 1 bala
//   1 = Doble   (30s)   — 2 balas paralelas
//   2 = Triple  (60s)   — 3 balas en abanico
//   3 = Láser   (120s)  — bala ancha, daño x2
//
// Multiplicadores de tiempo por dificultad (deben coincidir con game.js):
//   Fácil=0  → x1.5   Difícil=2 → x0.7
import { rand } from './utils.js';
import { particles, Particle } from './particles.js';

export const WEAPON = { SINGLE: 0, DOUBLE: 1, TRIPLE: 2, LASER: 3 };

const WEAPON_NAMES  = ['SIMPLE', 'DOBLE', 'TRIPLE', 'LÁSER'];
const WEAPON_COLORS = ['#fff', '#44aaff', '#44ffaa', '#ff8800'];
const UNLOCK_TIMES  = [0, 30, 60, 120]; // segundos en Normal
const DIFF_MULT     = [1.5, 1.0, 0.7];  // Fácil, Normal, Difícil

export let currentWeapon = WEAPON.SINGLE;
let _notifyUpgrade = null;

export function onWeaponUpgrade(fn) { _notifyUpgrade = fn; }
export function resetWeapon()       { currentWeapon = WEAPON.SINGLE; }

export function updateWeapon(gameTime, difficulty) {
    const mult = DIFF_MULT[difficulty] ?? 1.0;
    let newLevel = WEAPON.SINGLE;
    for (let i = UNLOCK_TIMES.length - 1; i >= 0; i--) {
        if (gameTime >= UNLOCK_TIMES[i] * mult) { newLevel = i; break; }
    }
    if (newLevel > currentWeapon) {
        currentWeapon = newLevel;
        if (_notifyUpgrade) _notifyUpgrade(currentWeapon);
    }
}

export function getBullets(px, py, pw) {
    const cx = px + pw / 2;
    switch (currentWeapon) {
        case WEAPON.DOUBLE:
            return [
                { x: cx - 5,  y: py - 6,  w: 3, h: 8,  speed: -360, damage: 1 },
                { x: cx + 2,  y: py - 6,  w: 3, h: 8,  speed: -360, damage: 1 },
            ];
        case WEAPON.TRIPLE:
            return [
                { x: cx - 1,  y: py - 8,  w: 3, h: 8,  speed: -370, vx:   0, damage: 1 },
                { x: cx - 6,  y: py - 4,  w: 3, h: 8,  speed: -340, vx: -18, damage: 1 },
                { x: cx + 3,  y: py - 4,  w: 3, h: 8,  speed: -340, vx:  18, damage: 1 },
            ];
        case WEAPON.LASER:
            return [
                { x: cx - 2,  y: py - 10, w: 5, h: 14, speed: -500, damage: 2, isLaser: true },
            ];
        default:
            return [
                { x: cx - 1.5, y: py - 6, w: 3, h: 8,  speed: -350, damage: 1 },
            ];
    }
}

export function spawnMuzzleFlash(px, py, pw) {
    const cx    = px + pw / 2;
    const color = WEAPON_COLORS[currentWeapon];
    const count = currentWeapon === WEAPON.LASER ? 6 : 3;
    const size  = currentWeapon === WEAPON.LASER ? 2 : 1;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(cx, py - 2, color,
            rand(-20, 20), rand(-70, -30), rand(0.05, 0.18), size));
    }
}

export function getWeaponName()  { return WEAPON_NAMES[currentWeapon]; }
export function getWeaponColor() { return WEAPON_COLORS[currentWeapon]; }

export function getUnlockTimes(difficulty) {
    const mult = DIFF_MULT[difficulty] ?? 1.0;
    return UNLOCK_TIMES.map(t => Math.round(t * mult));
}
