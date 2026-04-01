// --- MENU SYSTEM ---
import { s, BASE_W, BASE_H, isMobile, sprites, getTextureCells } from './utils.js';
import { getSFXVolume, getMusicVolume, setSFXVolume, setMusicVolume, isMuted, toggleMute } from './audio.js';

let _ctx = null;
export function initMenu(ctx) { _ctx = ctx; }

// ---- ESTADO ----
export const MENU = { MAIN: 'main', NEW_GAME: 'newgame', OPTIONS: 'options', CREDITS: 'credits' };
let menuState   = MENU.MAIN;
let selectedIndex = 0;
let optionsTab  = 0; // 0=Audio 1=Dificultad 2=Gráficos 3=Controles

// Configuración persistente
let _diff    = parseInt(localStorage.getItem('difficulty')  ?? '1');
let _quality = parseInt(localStorage.getItem('gfxQuality') ?? '1'); // 0=Bajo 1=Medio 2=Alto
let _shake   = localStorage.getItem('screenShake') !== 'false';
let _vignette= localStorage.getItem('vignette')    !== 'false';
let _particles = parseInt(localStorage.getItem('particles') ?? '1'); // 0=Pocas 1=Normal 2=Muchas

export function getSelectedDifficulty() { return _diff; }
export function getGfxQuality()         { return _quality; }
export function getScreenShake()        { return _shake; }
export function getVignette()           { return _vignette; }
export function getParticleLevel()      { return _particles; }

let _callbacks = {};
export function onMenuAction(actions) { _callbacks = actions; }

// ---- ITEMS ----
const MAIN_ITEMS = [
    { label: 'NUEVA PARTIDA', action: 'newGame'  },
    { label: 'OPCIONES',      action: 'options'  },
    { label: 'CRÉDITOS',      action: 'credits'  },
];
const NEWGAME_ITEMS = [
    { label: '▶  VER HISTORIA + JUGAR', action: 'storyThenPlay' },
    { label: '▶▶ INICIAR DIRECTO',       action: 'playDirect'    },
    { label: '◀  VOLVER',                action: 'back'          },
];
const OPT_TABS    = ['AUDIO', 'DIFICULTAD', 'GRÁFICOS', 'CONTROLES'];
const DIFF_LABELS = ['FÁCIL', 'NORMAL', 'DIFÍCIL'];
const DIFF_COLORS = ['#44dd66', '#e8c840', '#ff4444'];
const DIFF_DESC   = [
    'Menos fragmentos · Más oxígeno · Ideal para aprender',
    'Experiencia balanceada · Dificultad progresiva',
    'Fragmentos rápidos · Oxígeno escaso · Para expertos',
];
const QUALITY_LABELS = ['BAJO', 'MEDIO', 'ALTO'];
const QUALITY_COLORS = ['#888', '#e8c840', '#44aaff'];
const PARTICLE_LABELS = ['POCAS', 'NORMAL', 'MUCHAS'];

// ---- NAVEGACIÓN ----
export function menuUp() {
    const items = menuState === MENU.NEW_GAME ? NEWGAME_ITEMS : MAIN_ITEMS;
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
}
export function menuDown() {
    const items = menuState === MENU.NEW_GAME ? NEWGAME_ITEMS : MAIN_ITEMS;
    selectedIndex = (selectedIndex + 1) % items.length;
}
export function menuConfirm() {
    if (menuState === MENU.MAIN) {
        const a = MAIN_ITEMS[selectedIndex].action;
        if (a === 'newGame') { menuState = MENU.NEW_GAME; selectedIndex = 0; return; }
        if (a === 'options') { menuState = MENU.OPTIONS;  optionsTab = 0;    return; }
        if (a === 'credits') { menuState = MENU.CREDITS;  return; }
    } else if (menuState === MENU.NEW_GAME) {
        const a = NEWGAME_ITEMS[selectedIndex].action;
        if (a === 'back') { menuState = MENU.MAIN; selectedIndex = 0; return; }
        if (_callbacks[a]) _callbacks[a]();
    } else {
        menuState = MENU.MAIN; selectedIndex = 0;
    }
}
export function menuBack() {
    if (menuState !== MENU.MAIN) { menuState = MENU.MAIN; selectedIndex = 0; }
}
export function getMenuState() { return menuState; }
export function setMenuState(st) { menuState = st; selectedIndex = 0; }

// ---- CLICK / TAP ----
export function menuClick(cx, cy) {
    if      (menuState === MENU.MAIN)     _clickMain(cx, cy);
    else if (menuState === MENU.NEW_GAME) _clickNewGame(cx, cy);
    else if (menuState === MENU.OPTIONS)  _clickOptions(cx, cy);
    else if (menuState === MENU.CREDITS)  { menuState = MENU.MAIN; selectedIndex = 0; }
}

function _clickMain(cx, cy) {
    const startY = 355, itemH = 44;
    for (let i = 0; i < MAIN_ITEMS.length; i++) {
        const iy = startY + i * itemH;
        if (cy >= iy - 20 && cy <= iy + 20 && cx >= 40 && cx <= BASE_W - 40) {
            selectedIndex = i; menuConfirm(); return;
        }
    }
}
function _clickNewGame(cx, cy) {
    const startY = 300, itemH = 56;
    for (let i = 0; i < NEWGAME_ITEMS.length; i++) {
        const iy = startY + i * itemH;
        if (cy >= iy - 20 && cy <= iy + 20 && cx >= 40 && cx <= BASE_W - 40) {
            selectedIndex = i; menuConfirm(); return;
        }
    }
}
function _clickOptions(cx, cy) {
    // ---- TABS (dibujadas en y=128, h=28) ----
    const tabW = BASE_W / OPT_TABS.length;
    if (cy >= 128 && cy <= 156) {
        const t = Math.floor(cx / tabW);
        if (t >= 0 && t < OPT_TABS.length) { optionsTab = t; return; }
    }

    // contentY = 175 (igual que en _drawOptions)
    const Y = 175;
    const L = 30, R = BASE_W - 30, barW = R - L;
    const bw3 = (barW - 8) / 3; // ancho de cada botón en grupos de 3

    if (optionsTab === 0) { // ---- AUDIO ----
        // _slider dibuja label en Y, barra en Y+8 con h=8
        if (cy >= Y + 6 && cy <= Y + 22 && cx >= L && cx <= R) {
            setSFXVolume(Math.max(0, Math.min(1, (cx - L) / barW))); return;
        }
        // Segunda barra en Y+60, barra en Y+68
        if (cy >= Y + 66 && cy <= Y + 82 && cx >= L && cx <= R) {
            setMusicVolume(Math.max(0, Math.min(1, (cx - L) / barW))); return;
        }
        // _toggle en Y+130: el toggle rect está en y-13 a y+5 → Y+117 a Y+135
        if (cy >= Y + 115 && cy <= Y + 138) { toggleMute(); return; }
    }

    if (optionsTab === 1) { // ---- DIFICULTAD ----
        // _multiBtn(DIFF_LABELS, DIFF_COLORS, _diff, Y+12, 36)
        // → rect en Y+12, altura 36 → Y+12 a Y+48
        for (let i = 0; i < 3; i++) {
            const bx = L + i * (bw3 + 4);
            if (cy >= Y + 12 && cy <= Y + 48 && cx >= bx && cx <= bx + bw3) {
                _diff = i; localStorage.setItem('difficulty', i); return;
            }
        }
    }

    if (optionsTab === 2) { // ---- GRÁFICOS ----
        // Calidad: _multiBtn en Y+12, h=34 → Y+12 a Y+46
        for (let i = 0; i < 3; i++) {
            const bx = L + i * (bw3 + 4);
            if (cy >= Y + 12 && cy <= Y + 46 && cx >= bx && cx <= bx + bw3) {
                _quality = i; localStorage.setItem('gfxQuality', i); return;
            }
        }
        // Partículas: _multiBtn en Y+80, h=34 → Y+80 a Y+114
        for (let i = 0; i < 3; i++) {
            const bx = L + i * (bw3 + 4);
            if (cy >= Y + 80 && cy <= Y + 114 && cx >= bx && cx <= bx + bw3) {
                _particles = i; localStorage.setItem('particles', i); return;
            }
        }
        // Shake toggle: _toggle en Y+148 → rect en Y+135 a Y+153
        if (cy >= Y + 133 && cy <= Y + 155) {
            _shake = !_shake; localStorage.setItem('screenShake', _shake); return;
        }
        // Vignette toggle: _toggle en Y+178 → rect en Y+163 a Y+183
        if (cy >= Y + 163 && cy <= Y + 185) {
            _vignette = !_vignette; localStorage.setItem('vignette', _vignette); return;
        }
    }

    // ---- VOLVER (dibujado en BASE_H - 52) ----
    if (cy >= BASE_H - 68 && cy <= BASE_H - 36) {
        menuState = MENU.MAIN; selectedIndex = 0;
    }
}

// ======================================================
// ---- DRAW ----
// ======================================================
export function drawMenu(time, stars, highScore) {
    _drawBg(time, stars);
    if      (menuState === MENU.MAIN)     _drawMain(time, highScore);
    else if (menuState === MENU.NEW_GAME) _drawNewGame(time);
    else if (menuState === MENU.OPTIONS)  _drawOptions(time);
    else if (menuState === MENU.CREDITS)  _drawCredits(time);
}

// ---- Fondo compartido ----
function _drawBg(time, stars) {
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

// ---- Título de sección ----
function _sectionTitle(text, y) {
    _ctx.textAlign = 'center';
    _ctx.fillStyle = '#e8c840';
    _ctx.font = `bold ${s(16)}px Courier New`;
    _ctx.fillText(text, s(BASE_W / 2), s(y));
    _ctx.strokeStyle = 'rgba(232,200,64,0.2)';
    _ctx.lineWidth = s(1);
    _ctx.beginPath();
    _ctx.moveTo(s(40), s(y + 10)); _ctx.lineTo(s(BASE_W - 40), s(y + 10));
    _ctx.stroke();
}

// ---- Etiqueta + valor alineados ----
function _row(label, value, y, valueColor = '#fff') {
    const L = 30;
    _ctx.textAlign = 'left';
    _ctx.fillStyle = '#888';
    _ctx.font = `${s(8.5)}px Courier New`;
    _ctx.fillText(label, s(L), s(y));
    _ctx.textAlign = 'right';
    _ctx.fillStyle = valueColor;
    _ctx.font = `bold ${s(8.5)}px Courier New`;
    _ctx.fillText(value, s(BASE_W - L), s(y));
}

// ---- Slider ----
function _slider(label, value, y, color) {
    const L = 30, R = BASE_W - 30, barH = 8;
    const barW = R - L;
    const by = y + 12;

    _ctx.textAlign = 'left';
    _ctx.fillStyle = '#aaa';
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.fillText(label, s(L), s(y));

    _ctx.textAlign = 'right';
    _ctx.fillStyle = color;
    _ctx.font = `bold ${s(8)}px Courier New`;
    _ctx.fillText(`${Math.round(value * 100)}%`, s(R), s(y));

    // Track
    _ctx.fillStyle = '#1a1a2e';
    _ctx.fillRect(s(L), s(by), s(barW), s(barH));
    // Fill
    _ctx.fillStyle = color;
    _ctx.fillRect(s(L), s(by), s(barW * value), s(barH));
    // Thumb
    _ctx.fillStyle = '#fff';
    _ctx.beginPath();
    _ctx.arc(s(L + barW * value), s(by + barH / 2), s(6), 0, Math.PI * 2);
    _ctx.fill();
    // Border
    _ctx.strokeStyle = '#2a2a3e';
    _ctx.lineWidth = s(0.5);
    _ctx.strokeRect(s(L), s(by), s(barW), s(barH));
}

// ---- Toggle ----
function _toggle(label, active, y, colorOn = '#44dd66') {
    const L = 30, R = BASE_W - 30;
    _ctx.textAlign = 'left';
    _ctx.fillStyle = '#aaa';
    _ctx.font = `${s(8.5)}px Courier New`;
    _ctx.fillText(label, s(L), s(y));

    const tw = 36, th = 18, tx = R - tw;
    const ty = y - 13;
    // Track
    _ctx.fillStyle = active ? colorOn + '44' : '#1a1a2e';
    _ctx.fillRect(s(tx), s(ty), s(tw), s(th));
    _ctx.strokeStyle = active ? colorOn : '#333';
    _ctx.lineWidth = s(1);
    _ctx.strokeRect(s(tx), s(ty), s(tw), s(th));
    // Knob
    const kx = active ? tx + tw - 10 : tx + 4;
    _ctx.fillStyle = active ? colorOn : '#444';
    _ctx.beginPath();
    _ctx.arc(s(kx + 5), s(ty + th / 2), s(6), 0, Math.PI * 2);
    _ctx.fill();
    // Label estado
    _ctx.textAlign = 'right';
    _ctx.fillStyle = active ? colorOn : '#444';
    _ctx.font = `bold ${s(7)}px Courier New`;
    _ctx.fillText(active ? 'ON' : 'OFF', s(tx - 6), s(y));
}

// ---- Botones de selección múltiple ----
function _multiBtn(labels, colors, active, startY, btnH = 34) {
    const L = 30, R = BASE_W - 30;
    const total = R - L;
    const gap = 4;
    const bw = (total - gap * (labels.length - 1)) / labels.length;
    for (let i = 0; i < labels.length; i++) {
        const bx = L + i * (bw + gap);
        const isActive = i === active;
        const col = colors[i] ?? '#888';
        _ctx.fillStyle = isActive ? col + '22' : 'rgba(255,255,255,0.02)';
        _ctx.fillRect(s(bx), s(startY), s(bw), s(btnH));
        _ctx.strokeStyle = isActive ? col : '#2a2a3e';
        _ctx.lineWidth = s(isActive ? 1.5 : 0.5);
        _ctx.strokeRect(s(bx), s(startY), s(bw), s(btnH));
        _ctx.fillStyle = isActive ? col : '#555';
        _ctx.font = `bold ${s(isActive ? 9 : 8)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(labels[i], s(bx + bw / 2), s(startY + btnH / 2 + 3));
    }
}

// ======================================================
// ---- PANTALLAS ----
// ======================================================

function _drawMain(time, highScore) {
    _ctx.textAlign = 'center';
    _ctx.fillStyle = '#fff';
    _ctx.font = `bold ${s(26)}px Courier New`;
    _ctx.fillText('ASTRONAUTA', s(BASE_W / 2), s(118));
    _ctx.fillStyle = '#e8c840';
    _ctx.fillText('COLOMBIANO', s(BASE_W / 2), s(152));
    _ctx.fillStyle = '#333';
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.fillText('Astronauta Colombiano', s(BASE_W / 2), s(174));

    const floatY = 200 + Math.sin(time * 2) * 6;
    const spW = 38, spH = 46;
    if (sprites.player) {
        _ctx.drawImage(sprites.player, s(BASE_W / 2 - spW / 2), s(floatY), s(spW), s(spH));
    } else {
        _ctx.fillStyle = '#e8c840';
        _ctx.fillRect(s(BASE_W / 2 - 10), s(floatY), s(20), s(24));
    }

    const cells = sprites.textures ? getTextureCells() : null;
    for (let i = 0; i < 3; i++) {
        const fx = BASE_W / 2 + Math.sin(time + i * 2.1) * 70;
        const fy = floatY + 16 + Math.cos(time * 0.8 + i * 2.1) * 30;
        _ctx.save();
        _ctx.translate(s(fx), s(fy));
        _ctx.rotate(time * (i + 1) * 0.5);
        if (cells) {
            const c = cells[i * 3];
            _ctx.drawImage(sprites.textures, c.sx, c.sy, c.sw, c.sh, s(-7), s(-7), s(14), s(14));
        } else {
            _ctx.fillStyle = '#555';
            _ctx.fillRect(s(-6), s(-6), s(12), s(12));
        }
        _ctx.restore();
    }

    _drawItems(MAIN_ITEMS, 355, 44, time);

    if (highScore > 0) {
        _ctx.fillStyle = '#e8c840';
        _ctx.font = `${s(9)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(`★ MEJOR: ${highScore}`, s(BASE_W / 2), s(BASE_H - 46));
    }
    _ctx.fillStyle = '#282828';
    _ctx.font = `${s(7)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(isMobile ? 'Toca para seleccionar' : '↑↓ Navegar  ·  Enter Confirmar', s(BASE_W / 2), s(BASE_H - 26));
    _ctx.fillStyle = '#1e1e1e';
    _ctx.font = `${s(6)}px Courier New`;
    _ctx.fillText('v2.0', s(BASE_W / 2), s(BASE_H - 12));
}

function _drawNewGame(time) {
    _sectionTitle('NUEVA PARTIDA', 105);
    const floatY = 148 + Math.sin(time * 1.8) * 7;
    const spW = 56, spH = 68;
    if (sprites.player) {
        _ctx.drawImage(sprites.player, s(BASE_W / 2 - spW / 2), s(floatY), s(spW), s(spH));
    } else {
        _ctx.fillStyle = '#e8c840';
        _ctx.fillRect(s(BASE_W / 2 - 14), s(floatY + 8), s(28), s(spH - 14));
    }
    _drawItems(NEWGAME_ITEMS, 300, 56, time);
    _ctx.fillStyle = '#282828';
    _ctx.font = `${s(7)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(isMobile ? 'Toca para seleccionar' : '↑↓ Navegar  ·  Enter  ·  Esc Volver', s(BASE_W / 2), s(BASE_H - 26));
}

// ---- OPCIONES con tabs ----
function _drawOptions(time) {
    _sectionTitle('OPCIONES', 105);

    // ---- TABS ----
    const tabW = BASE_W / OPT_TABS.length;
    for (let i = 0; i < OPT_TABS.length; i++) {
        const tx = i * tabW;
        const active = i === optionsTab;
        _ctx.fillStyle = active ? 'rgba(232,200,64,0.12)' : 'rgba(255,255,255,0.02)';
        _ctx.fillRect(s(tx), s(128), s(tabW), s(28));
        _ctx.strokeStyle = active ? '#e8c840' : '#222';
        _ctx.lineWidth = s(active ? 1.5 : 0.5);
        _ctx.strokeRect(s(tx), s(128), s(tabW), s(28));
        _ctx.fillStyle = active ? '#e8c840' : '#555';
        _ctx.font = `bold ${s(active ? 8 : 7.5)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(OPT_TABS[i], s(tx + tabW / 2), s(146));
    }

    // ---- CONTENIDO POR TAB ----
    const contentY = 175;
    if (optionsTab === 0) _drawTabAudio(contentY);
    if (optionsTab === 1) _drawTabDifficulty(contentY);
    if (optionsTab === 2) _drawTabGraphics(contentY);
    if (optionsTab === 3) _drawTabControls(contentY);

    // ---- VOLVER ----
    _drawPulseBtn('◀  VOLVER', BASE_W / 2, BASE_H - 52, time);
}

function _drawTabAudio(y) {
    // SFX
    _slider('Efectos de sonido', getSFXVolume(), y, '#4488ff');
    // Música
    _slider('Música', getMusicVolume(), y + 60, '#44dd66');
    // Mute
    const muted = isMuted();
    _toggle('Silenciar todo', !muted, y + 130, '#44dd66');

    // Separador
    _ctx.strokeStyle = '#1a1a2e';
    _ctx.lineWidth = s(1);
    _ctx.beginPath();
    _ctx.moveTo(s(30), s(y + 148)); _ctx.lineTo(s(BASE_W - 30), s(y + 148));
    _ctx.stroke();

    // Info
    _ctx.fillStyle = '#333';
    _ctx.font = `${s(7.5)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText('Coloca archivos .ogg en audio/sfx/ y audio/music/', s(BASE_W / 2), s(y + 165));
    _ctx.fillText('El juego funciona sin audio (modo silencioso)', s(BASE_W / 2), s(y + 180));
}

function _drawTabDifficulty(y) {
    _ctx.fillStyle = '#888';
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText('Nivel de dificultad', s(30), s(y));

    _multiBtn(DIFF_LABELS, DIFF_COLORS, _diff, y + 12, 36);

    // Descripción activa
    _ctx.fillStyle = DIFF_COLORS[_diff];
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(DIFF_DESC[_diff], s(BASE_W / 2), s(y + 68));

    // Tabla de efectos
    const rows = [
        ['Velocidad fragmentos', ['Normal', 'Normal', 'Rápida']],
        ['Frecuencia spawn',     ['Baja',   'Media',  'Alta']],
        ['Drenaje de oxígeno',   ['Lento',  'Normal', 'Rápido']],
        ['Drops de items',       ['Más',    'Normal', 'Menos']],
        ['Mejora de arma',       ['45s/90s','30s/60s','21s/42s']],
    ];
    const col = _diff;
    rows.forEach(([label, vals], i) => {
        const ry = y + 95 + i * 28;
        _ctx.fillStyle = '#333';
        _ctx.fillRect(s(30), s(ry - 10), s(BASE_W - 60), s(24));
        _ctx.fillStyle = '#666';
        _ctx.font = `${s(7.5)}px Courier New`;
        _ctx.textAlign = 'left';
        _ctx.fillText(label, s(36), s(ry + 4));
        _ctx.fillStyle = DIFF_COLORS[col];
        _ctx.font = `bold ${s(7.5)}px Courier New`;
        _ctx.textAlign = 'right';
        _ctx.fillText(vals[col], s(BASE_W - 36), s(ry + 4));
    });
}

function _drawTabGraphics(y) {
    // Calidad
    _ctx.fillStyle = '#888';
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText('Calidad visual', s(30), s(y));
    _multiBtn(QUALITY_LABELS, QUALITY_COLORS, _quality, y + 12, 34);

    // Partículas
    _ctx.fillStyle = '#888';
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText('Cantidad de partículas', s(30), s(y + 68));
    _multiBtn(PARTICLE_LABELS, ['#888', '#e8c840', '#ff8800'], _particles, y + 80, 34);

    // Toggles
    _toggle('Vibración de pantalla', _shake,    y + 148, '#e8c840');
    _toggle('Efecto viñeta',         _vignette, y + 178, '#aa66ff');

    // Info calidad
    const qDesc = [
        'Sin partículas · Sin viñeta · Máximo rendimiento',
        'Configuración balanceada recomendada',
        'Todos los efectos activos · Requiere GPU decente',
    ];
    _ctx.fillStyle = QUALITY_COLORS[_quality];
    _ctx.font = `${s(7)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(qDesc[_quality], s(BASE_W / 2), s(y + 56));
}

function _drawTabControls(y) {
    const pairs = isMobile
        ? [
            ['Mover',    'Joystick izquierdo'],
            ['Disparar', 'Botón derecho (FIRE)'],
            ['Pausa',    'No disponible en móvil'],
          ]
        : [
            ['Mover',    'WASD  /  Flechas'],
            ['Disparar', 'Espacio'],
            ['Pausa',    'P  /  Esc'],
            ['Silenciar','M'],
            ['Menú',     'Esc (en pausa)'],
          ];

    pairs.forEach(([action, key], i) => {
        const ry = y + i * 36;
        // Fondo alternado
        _ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        _ctx.fillRect(s(30), s(ry - 8), s(BASE_W - 60), s(30));
        // Acción
        _ctx.fillStyle = '#888';
        _ctx.font = `${s(8.5)}px Courier New`;
        _ctx.textAlign = 'left';
        _ctx.fillText(action, s(38), s(ry + 8));
        // Tecla — caja
        const kw = key.length * 5.5 + 16;
        const kx = BASE_W - 38 - kw;
        _ctx.fillStyle = '#1a1a2e';
        _ctx.fillRect(s(kx), s(ry - 2), s(kw), s(20));
        _ctx.strokeStyle = '#333';
        _ctx.lineWidth = s(0.8);
        _ctx.strokeRect(s(kx), s(ry - 2), s(kw), s(20));
        _ctx.fillStyle = '#e8c840';
        _ctx.font = `bold ${s(8)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(key, s(kx + kw / 2), s(ry + 10));
    });

    // Armas info
    const wY = y + pairs.length * 36 + 16;
    _ctx.strokeStyle = '#1a1a2e';
    _ctx.lineWidth = s(1);
    _ctx.beginPath();
    _ctx.moveTo(s(30), s(wY)); _ctx.lineTo(s(BASE_W - 30), s(wY));
    _ctx.stroke();
    _ctx.fillStyle = '#555';
    _ctx.font = `bold ${s(7.5)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText('Mejoras de arma automáticas:', s(30), s(wY + 14));
    const wInfo = ['Simple → Doble → Triple → Láser'];
    _ctx.fillStyle = '#444';
    _ctx.font = `${s(7.5)}px Courier New`;
    _ctx.fillText(wInfo[0], s(30), s(wY + 28));
}

// ---- CRÉDITOS ----
function _drawCredits(time) {
    _sectionTitle('CRÉDITOS', 105);

    const sections = [
        { title: 'Desarrollador',  lines: ['Tu Nombre', 'tu@email.com'] },
        { title: 'Arte & Sprites', lines: ['Ast.png — Astronauta', 'Astexp.png — Explosión', 'texpreview.png — Asteroides'] },
        { title: 'Motor',          lines: ['HTML5 Canvas API', 'JavaScript ES Modules', 'Web Audio API'] },
        { title: 'Herramientas',   lines: ['VS Code · Live Server', 'Python / Pillow'] },
        { title: 'Versión',        lines: ['2.0  —  Astronauta Colombiano  —  2026'] },
    ];

    let y = 140;
    for (const sec of sections) {
        _ctx.fillStyle = '#e8c840';
        _ctx.font = `bold ${s(8)}px Courier New`;
        _ctx.textAlign = 'left';
        _ctx.fillText(sec.title, s(30), s(y));
        y += 13;
        for (const line of sec.lines) {
            _ctx.fillStyle = '#555';
            _ctx.font = `${s(7.5)}px Courier New`;
            _ctx.fillText(line, s(38), s(y));
            y += 12;
        }
        y += 6;
    }

    _drawPulseBtn('◀  VOLVER', BASE_W / 2, BASE_H - 52, time);
}

// ---- HELPERS ----
function _drawItems(items, startY, itemH, time) {
    for (let i = 0; i < items.length; i++) {
        const iy = startY + i * itemH;
        const sel = i === selectedIndex;
        if (sel) {
            _ctx.fillStyle = 'rgba(232,200,64,0.07)';
            _ctx.fillRect(s(40), s(iy - 18), s(BASE_W - 80), s(36));
            _ctx.strokeStyle = 'rgba(232,200,64,0.28)';
            _ctx.lineWidth = s(1);
            _ctx.strokeRect(s(40), s(iy - 18), s(BASE_W - 80), s(36));
            const pulse = 0.5 + 0.5 * Math.sin(time * 6);
            _ctx.globalAlpha = pulse;
            _ctx.fillStyle = '#e8c840';
            _ctx.font = `${s(9)}px Courier New`;
            _ctx.textAlign = 'left';
            _ctx.fillText('▶', s(48), s(iy + 3));
            _ctx.globalAlpha = 1;
        }
        _ctx.fillStyle = sel ? '#e8c840' : '#666';
        _ctx.font = `bold ${s(sel ? 11 : 10)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(items[i].label, s(BASE_W / 2), s(iy + 3));
    }
}

function _drawPulseBtn(label, x, y, time) {
    _ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 3);
    _ctx.fillStyle = '#e8c840';
    _ctx.font = `bold ${s(10)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(label, s(x), s(y));
    _ctx.globalAlpha = 1;
}
