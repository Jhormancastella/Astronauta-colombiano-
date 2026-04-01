// --- INPUT MANAGER ---
import * as Utils from './utils.js';

export const keys        = {};
export let   shooting    = false;
export const joystick    = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, id: -1 };
export const shootButton = { active: false, id: -1 };

// Radio del joystick: 12% del ancho lógico, mínimo 50 unidades
export function getJoystickRadius() {
    return Math.max(50, Math.round(Utils.BASE_W * 0.12));
}

// Zona del botón FIRE (coordenadas lógicas, sincronizado con renderer.js)
export function getFireButtonCenter() {
    return { x: Utils.BASE_W - 55, y: Utils.BASE_H - 75 };
}
export const FIRE_BTN_RADIUS = 38; // zona de toque más grande que el visual (30)

const listeners = { onAction: null };
export function onAction(fn) { listeners.onAction = fn; }
function fireAction(name) { if (listeners.onAction) listeners.onAction(name); }

function getCanvasPos(canvas, tx, ty) {
    const rect = canvas.getBoundingClientRect();
    // Convertir de píxeles de pantalla a coordenadas lógicas del juego
    const scaleX = Utils.BASE_W / rect.width;
    const scaleY = Utils.BASE_H / rect.height;
    return {
        x: (tx - rect.left) * scaleX,
        y: (ty - rect.top)  * scaleY,
    };
}

export function initInput(canvas) {
    // ---- TECLADO ----
    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'Space')  { e.preventDefault(); shooting = true; }
        if (e.code === 'Enter'  || e.code === 'Space') fireAction('confirm');
        if (e.code === 'KeyP')    fireAction('pause');
        if (e.code === 'Escape')  fireAction('escape');
        if (e.code === 'ArrowUp'   || e.code === 'KeyW') fireAction('menuUp');
        if (e.code === 'ArrowDown' || e.code === 'KeyS') fireAction('menuDown');
        if (e.code === 'KeyM')    fireAction('mute');
    });

    document.addEventListener('keyup', e => {
        keys[e.code] = false;
        if (e.code === 'Space') shooting = false;
    });

    // ---- TOUCH ----
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            const pos = getCanvasPos(canvas, touch.clientX, touch.clientY);

            // Siempre disparar acción de toque (para menús, game over, etc.)
            fireAction({ type: 'touch', pos, id: touch.identifier });

            // Solo asignar controles de juego si no hay joystick activo en lado izquierdo
            const fireBtn = getFireButtonCenter();
            const distFire = Math.hypot(pos.x - fireBtn.x, pos.y - fireBtn.y);

            if (distFire <= FIRE_BTN_RADIUS) {
                // Toque en zona FIRE
                shootButton.active = true;
                shootButton.id = touch.identifier;
                shooting = true;
            } else if (pos.x < Utils.BASE_W * 0.6 && joystick.id === -1) {
                // Toque en zona izquierda → joystick
                Object.assign(joystick, {
                    active: true, id: touch.identifier,
                    startX: pos.x, startY: pos.y, dx: 0, dy: 0,
                });
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (touch.identifier !== joystick.id) continue;
            const pos = getCanvasPos(canvas, touch.clientX, touch.clientY);
            let dx = pos.x - joystick.startX;
            let dy = pos.y - joystick.startY;
            const d = Math.hypot(dx, dy);
            const maxR = getJoystickRadius();
            if (d > maxR) { dx = (dx / d) * maxR; dy = (dy / d) * maxR; }
            joystick.dx = dx;
            joystick.dy = dy;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystick.id) {
                Object.assign(joystick, { active: false, id: -1, dx: 0, dy: 0 });
            }
            if (touch.identifier === shootButton.id) {
                shootButton.active = false;
                shootButton.id = -1;
                shooting = false;
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchcancel', e => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystick.id) {
                Object.assign(joystick, { active: false, id: -1, dx: 0, dy: 0 });
            }
            if (touch.identifier === shootButton.id) {
                shootButton.active = false;
                shootButton.id = -1;
                shooting = false;
            }
        }
    }, { passive: false });

    // ---- MOUSE (desktop) ----
    canvas.addEventListener('mousedown', e => {
        const pos = getCanvasPos(canvas, e.clientX, e.clientY);
        fireAction({ type: 'click', pos, x: e.clientX, y: e.clientY });
    });

    if (!Utils.isMobile) canvas.style.cursor = 'crosshair';
}
