// --- INPUT MANAGER ---
import * as Utils from './utils.js';

export const keys     = {};
export let   shooting = false;
export const joystick = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, id: -1 };

// En móvil: mitad izquierda = joystick, mitad derecha = disparo
// No hay botón FIRE visible — cualquier toque en la mitad derecha dispara
const _rightTouches = new Set(); // ids de toques activos en zona derecha

const listeners = { onAction: null };
export function onAction(fn) { listeners.onAction = fn; }
function fireAction(name) { if (listeners.onAction) listeners.onAction(name); }

function getCanvasPos(canvas, tx, ty) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = Utils.BASE_W / rect.width;
    const scaleY = Utils.BASE_H / rect.height;
    return {
        x: (tx - rect.left) * scaleX,
        y: (ty - rect.top)  * scaleY,
    };
}

function _updateShooting() {
    shooting = _rightTouches.size > 0;
}

export function initInput(canvas) {
    // ---- TECLADO ----
    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'Space')  { e.preventDefault(); shooting = true; }
        if (e.code === 'Enter'  || e.code === 'Space') fireAction('confirm');
        if (e.code === 'KeyP')    fireAction('pause');
        if (e.code === 'Escape')  fireAction('escape');
        if (e.code === 'KeyO')    fireAction('options');
        if (e.code === 'KeyQ')    fireAction('escape');
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

            // Siempre notificar para menús / game over / pausa
            fireAction({ type: 'touch', pos, id: touch.identifier });

            // Mitad izquierda → joystick
            if (pos.x < Utils.BASE_W * 0.5) {
                if (joystick.id === -1) {
                    Object.assign(joystick, {
                        active: true, id: touch.identifier,
                        startX: pos.x, startY: pos.y, dx: 0, dy: 0,
                    });
                }
            } else {
                // Mitad derecha → disparo
                _rightTouches.add(touch.identifier);
                _updateShooting();
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

    const _endTouch = (e) => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (touch.identifier === joystick.id) {
                Object.assign(joystick, { active: false, id: -1, dx: 0, dy: 0 });
            }
            _rightTouches.delete(touch.identifier);
        }
        _updateShooting();
    };

    canvas.addEventListener('touchend',    _endTouch, { passive: false });
    canvas.addEventListener('touchcancel', _endTouch, { passive: false });

    // ---- MOUSE (desktop) ----
    canvas.addEventListener('mousedown', e => {
        const pos = getCanvasPos(canvas, e.clientX, e.clientY);
        fireAction({ type: 'click', pos });
    });

    if (!Utils.isMobile) canvas.style.cursor = 'crosshair';
}

export function getJoystickRadius() {
    return Math.max(50, Math.round(Utils.BASE_W * 0.12));
}
