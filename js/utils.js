// --- UTILS ---
// BASE_W y BASE_H son el espacio lógico del juego.
// Se calculan dinámicamente para llenar la pantalla sin franjas.
// SCALE convierte coordenadas lógicas a píxeles reales.

export let BASE_W = 400;
export let BASE_H = 700;

export let SCALE = 1;
export let W = BASE_W;
export let H = BASE_H;
export let isMobile = false;

// Recalcula BASE_W, BASE_H y SCALE para llenar la pantalla completa
// El jugador siempre ocupa ~8% del ancho de pantalla (visible y cómodo en cualquier dispositivo)
export const PLAYER_WIDTH_RATIO  = 0.08;  // 8% del ancho lógico
export const PLAYER_ASPECT       = 1.2;   // alto/ancho del sprite

export function recalcLayout(screenW, screenH) {
    W = screenW;
    H = screenH;
    SCALE = screenH / 700;
    BASE_H = 700;
    BASE_W = Math.round(screenW / SCALE);
    return { BASE_W, BASE_H, SCALE };
}

// Calcula el tamaño del jugador en unidades lógicas según el ancho actual
export function calcPlayerSize() {
    const pw = Math.round(BASE_W * PLAYER_WIDTH_RATIO);
    const ph = Math.round(pw * PLAYER_ASPECT);
    return { w: pw, h: ph };
}

export function setScale(v) { SCALE = v; }
export function setMobile(v) { isMobile = v; }
export function setSize(w, h) { W = w; H = h; }

export function s(val) { return val * SCALE; }
export function rand(min, max) { return Math.random() * (max - min) + min; }
export function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
export function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

export function detectMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
        || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
}

// Sprite loader
export const sprites = {};
export function loadSprite(key, src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => { sprites[key] = img; resolve(img); };
        img.onerror = () => { console.warn(`Sprite not found: ${src}`); resolve(null); };
        img.src = src;
    });
}

// ---- SPRITESHEET: texpreview.png ----
export function getTextureCells() {
    return [
        { sx: 6,   sy: 10,  sw: 90, sh: 89 },
        { sx: 115, sy: 10,  sw: 90, sh: 89 },
        { sx: 224, sy: 10,  sw: 89, sh: 89 },
        { sx: 333, sy: 10,  sw: 89, sh: 89 },
        { sx: 442, sy: 10,  sw: 89, sh: 89 },
        { sx: 6,   sy: 127, sw: 90, sh: 90 },
        { sx: 115, sy: 127, sw: 90, sh: 90 },
        { sx: 224, sy: 127, sw: 89, sh: 90 },
        { sx: 333, sy: 127, sw: 89, sh: 90 },
        { sx: 442, sy: 127, sw: 89, sh: 90 },
        { sx: 6,   sy: 244, sw: 90, sh: 89 },
        { sx: 115, sy: 244, sw: 90, sh: 89 },
        { sx: 224, sy: 244, sw: 89, sh: 89 },
        { sx: 333, sy: 244, sw: 89, sh: 89 },
        { sx: 442, sy: 244, sw: 89, sh: 89 },
        { sx: 6,   sy: 361, sw: 90, sh: 61 },
        { sx: 115, sy: 361, sw: 90, sh: 61 },
        { sx: 224, sy: 361, sw: 89, sh: 61 },
        { sx: 333, sy: 361, sw: 89, sh: 61 },
        { sx: 442, sy: 361, sw: 89, sh: 61 },
    ];
}