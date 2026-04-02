// --- MENU SYSTEM ---
import { s, BASE_W, BASE_H, isMobile, sprites, getTextureCells } from './utils.js';
import { getSFXVolume, getMusicVolume, setSFXVolume, setMusicVolume, isMuted, toggleMute } from './audio.js';
import { t, getLang, setLang, LANGS } from './i18n.js';

let _ctx = null;
export function initMenu(ctx) { _ctx = ctx; }

export const MENU = { MAIN: 'main', NEW_GAME: 'newgame', OPTIONS: 'options', CREDITS: 'credits', GALLERY: 'gallery' };
let menuState     = MENU.MAIN;
let selectedIndex = 0;
let optionsTab    = 0; // 0=Audio 1=Dificultad 2=Gráficos 3=Controles 4=Idioma
let galleryPage   = 0;
let creditsScroll = 0;

const GALLERY_IMAGES = [
    { url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099142/background-1_f7fgfn.png', id: 'bg1', level: 1 },
    { url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099143/background-2_mrsyij.png', id: 'bg2', level: 5 },
    { url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099139/background-3_njmh3b.png', id: 'bg3', level: 10 },
    { url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099140/background-4_lrtcry.png', id: 'bg4', level: 15 },
    { url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099139/background-5_hy8grj.png', id: 'bg5', level: 20 },
    { url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099145/background-6_c5vxzj.png', id: 'bg6', level: 25 },
    { url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099144/background-7_xhvhti.png', id: 'bg7', level: 30 },
    { url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099136/background-8_lvlwnq.png', id: 'bg8', level: 40 },
    { url: 'https://res.cloudinary.com/dcqnjn6fe/image/upload/q_auto/f_auto/v1775099139/background-9_jhrux2.png', id: 'bg9', level: 50 },
];

let _diff      = parseInt(localStorage.getItem('difficulty')  ?? '1');
let _quality   = parseInt(localStorage.getItem('gfxQuality') ?? '1');
let _shake     = localStorage.getItem('screenShake') !== 'false';
let _vignette  = localStorage.getItem('vignette')    !== 'false';
let _particles = parseInt(localStorage.getItem('particles')  ?? '1');

export function getSelectedDifficulty() { return _diff; }
export function getGfxQuality()         { return _quality; }
export function getScreenShake()        { return _shake; }
export function getVignette()           { return _vignette; }
export function getParticleLevel()      { return _particles; }

let _callbacks = {};
export function onMenuAction(actions) { _callbacks = actions; }

let _returnToPause = false;
export function setReturnToPause(val) { _returnToPause = val; }
export function isReturningToPause()  { return _returnToPause; }

const MAIN_ITEMS = [
    { labelKey: 'newGame', action: 'newGame'  },
    { labelKey: 'gallery', action: 'gallery'  },
    { labelKey: 'options', action: 'options'  },
    { labelKey: 'credits', action: 'credits'  },
];
const NEWGAME_ITEMS = [
    { labelKey: 'continueGame', action: 'continue', checkSave: true },
    { labelKey: 'storyPlay',    action: 'story'     },
    { labelKey: 'playDirect',   action: 'play'      },
    { labelKey: 'back',         action: 'back'      },
];

function _getNewGameItems() {
    const hasSave = localStorage.getItem('astronautaColombiano_Checkpoint') !== null;
    return NEWGAME_ITEMS.filter(item => !item.checkSave || hasSave);
}
// Ancho máximo del contenido del menú — centrado en pantallas anchas
// El juego usa BASE_W completo, el menú usa hasta 500 unidades lógicas centradas
function mW() { return Math.min(BASE_W, 500); }
function mX() { return (BASE_W - mW()) / 2; } // offset X para centrar
const OPT_TABS_KEYS  = ['tabAudio', 'tabDiff', 'tabGfx', 'tabControls', 'tabLang'];
const DIFF_COLORS    = ['#44dd66', '#e8c840', '#ff4444'];
const QUALITY_COLORS = ['#888', '#e8c840', '#44aaff'];

// ---- NAVEGACIÓN ----
export function menuUp() {
    if (menuState === MENU.GALLERY) {
        galleryPage = (galleryPage - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
        return;
    }
    const items = menuState === MENU.NEW_GAME ? _getNewGameItems() : MAIN_ITEMS;
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
}
export function menuDown() {
    if (menuState === MENU.GALLERY) {
        galleryPage = (galleryPage + 1) % GALLERY_IMAGES.length;
        return;
    }
    const items = menuState === MENU.NEW_GAME ? _getNewGameItems() : MAIN_ITEMS;
    selectedIndex = (selectedIndex + 1) % items.length;
}
export function menuConfirm() {
    if (menuState === MENU.MAIN) {
        const a = MAIN_ITEMS[selectedIndex].action;
        if (a === 'newGame') { menuState = MENU.NEW_GAME; selectedIndex = 0; return; }
        if (a === 'gallery') { menuState = MENU.GALLERY;  galleryPage = 0;   return; }
        if (a === 'options') { menuState = MENU.OPTIONS;  optionsTab = 0;    return; }
        if (a === 'credits') { menuState = MENU.CREDITS;  creditsScroll = 0; return; }
    } else if (menuState === MENU.NEW_GAME) {
        const items = _getNewGameItems();
        const a = items[selectedIndex].action;
        if (a === 'back') { menuState = MENU.MAIN; selectedIndex = 0; return; }
        if (_callbacks[a]) _callbacks[a]();
    } else {
        menuState = MENU.MAIN; selectedIndex = 0;
    }
}
export function menuBack() {
    if (menuState !== MENU.MAIN) {
        if (menuState === MENU.OPTIONS && _returnToPause) {
            if (_callbacks.backToPause) _callbacks.backToPause();
            return;
        }
        menuState = MENU.MAIN; selectedIndex = 0;
    }
}
export function getMenuState()    { return menuState; }
export function setMenuState(st)  { menuState = st; selectedIndex = 0; }

// ---- CLICK / TAP ----
export function menuClick(cx, cy) {
    if      (menuState === MENU.MAIN)     _clickMain(cx, cy);
    else if (menuState === MENU.NEW_GAME) _clickNewGame(cx, cy);
    else if (menuState === MENU.OPTIONS)  _clickOptions(cx, cy);
    else if (menuState === MENU.GALLERY)  _clickGallery(cx, cy);
    else if (menuState === MENU.CREDITS)  { menuState = MENU.MAIN; selectedIndex = 0; }
}

function _clickGallery(cx, cy) {
    const ox = mX(), cw = mW();
    // Botones de navegación lateral
    if (cy >= 200 && cy <= 500) {
        if (cx >= ox && cx <= ox + 60) { galleryPage = (galleryPage - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length; return; }
        if (cx >= ox + cw - 60 && cx <= ox + cw) { galleryPage = (galleryPage + 1) % GALLERY_IMAGES.length; return; }
    }
    // Botón volver
    if (cy >= BASE_H - 72 && cy <= BASE_H - 32) { menuState = MENU.MAIN; selectedIndex = 1; }
}

function _clickMain(cx, cy) {
    const ox = mX();
    const startY = 355, itemH = 44;
    for (let i = 0; i < MAIN_ITEMS.length; i++) {
        const iy = startY + i * itemH;
        if (cy >= iy - 22 && cy <= iy + 22 && cx >= ox && cx <= ox + mW()) {
            selectedIndex = i; menuConfirm(); return;
        }
    }
}

function _clickNewGame(cx, cy) {
    const ox = mX();
    const items = _getNewGameItems();
    const startY = 300, itemH = 56;
    for (let i = 0; i < items.length; i++) {
        const iy = startY + i * itemH;
        if (cy >= iy - 26 && cy <= iy + 26 && cx >= ox && cx <= ox + mW()) {
            selectedIndex = i; menuConfirm(); return;
        }
    }
}

function _clickOptions(cx, cy) {
    const ox = mX(), cw = mW();
    // TABS dentro del área centrada
    const tabW = cw / OPT_TABS_KEYS.length;
    if (cy >= 120 && cy <= 164) {
        const t2 = Math.floor((cx - ox) / tabW);
        if (t2 >= 0 && t2 < OPT_TABS_KEYS.length) { optionsTab = t2; return; }
    }

    const Y = 175;
    const L = ox + 30, R = ox + cw - 30;
    const barW = R - L;
    const bw3  = (barW - 8) / 3;
    const btnW = 28;

    if (optionsTab === 0) {
        if (cy >= Y + 4 && cy <= Y + 28) {
            if (cx >= L && cx <= L + btnW)       { setSFXVolume(Math.max(0, getSFXVolume() - 0.1)); return; }
            if (cx >= R - btnW && cx <= R)        { setSFXVolume(Math.min(1, getSFXVolume() + 0.1)); return; }
            if (cx >= L + btnW + 4 && cx <= R - btnW - 4) {
                setSFXVolume(Math.max(0, Math.min(1, (cx - L - btnW - 4) / (barW - 2 * (btnW + 4))))); return;
            }
        }
        if (cy >= Y + 64 && cy <= Y + 88) {
            if (cx >= L && cx <= L + btnW)        { setMusicVolume(Math.max(0, getMusicVolume() - 0.1)); return; }
            if (cx >= R - btnW && cx <= R)         { setMusicVolume(Math.min(1, getMusicVolume() + 0.1)); return; }
            if (cx >= L + btnW + 4 && cx <= R - btnW - 4) {
                setMusicVolume(Math.max(0, Math.min(1, (cx - L - btnW - 4) / (barW - 2 * (btnW + 4))))); return;
            }
        }
        if (cy >= Y + 110 && cy <= Y + 145) { toggleMute(); return; }
    }

    if (optionsTab === 1) {
        for (let i = 0; i < 3; i++) {
            const bx = L + i * (bw3 + 4);
            if (cy >= Y + 8 && cy <= Y + 52 && cx >= bx && cx <= bx + bw3) {
                _diff = i; localStorage.setItem('difficulty', i); return;
            }
        }
    }

    if (optionsTab === 2) {
        for (let i = 0; i < 3; i++) {
            const bx = L + i * (bw3 + 4);
            if (cy >= Y + 8  && cy <= Y + 50  && cx >= bx && cx <= bx + bw3) { _quality   = i; localStorage.setItem('gfxQuality', i); return; }
            if (cy >= Y + 76 && cy <= Y + 118 && cx >= bx && cx <= bx + bw3) { _particles = i; localStorage.setItem('particles',  i); return; }
        }
        if (cy >= Y + 130 && cy <= Y + 160) { _shake    = !_shake;    localStorage.setItem('screenShake', _shake);    return; }
        if (cy >= Y + 160 && cy <= Y + 192) { _vignette = !_vignette; localStorage.setItem('vignette',    _vignette); return; }
    }

    if (optionsTab === 4) {
        const bw2 = (barW - 8) / 2;
        for (let i = 0; i < LANGS.length; i++) {
            const bx = L + i * (bw2 + 8);
            if (cy >= Y + 30 && cy <= Y + 80 && cx >= bx && cx <= bx + bw2) {
                setLang(LANGS[i]); return;
            }
        }
    }

    if (cy >= BASE_H - 72 && cy <= BASE_H - 32) {
        if (menuState === MENU.OPTIONS && _returnToPause) {
            if (_callbacks.backToPause) _callbacks.backToPause();
            return;
        }
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
    else if (menuState === MENU.GALLERY)  _drawGallery(time, highScore);
    else if (menuState === MENU.CREDITS)  _drawCredits(time);
}

function _drawGallery(time, highScore) {
    const ox = mX(), cw = mW(), BH = BASE_H;
    _sectionTitle(t('galTitle'), 60);

    const imgData = GALLERY_IMAGES[galleryPage];
    const isUnlocked = highScore >= imgData.level * 1000; // Por ejemplo, 1000 puntos por nivel
    
    // Contenedor imagen
    const iw = cw - 80, ih = iw * 0.6;
    const ix = ox + 40, iy = 150;
    
    _ctx.fillStyle = '#000';
    _ctx.fillRect(s(ix), s(iy), s(iw), s(ih));
    _ctx.strokeStyle = isUnlocked ? '#e8c840' : '#444';
    _ctx.strokeRect(s(ix), s(iy), s(iw), s(ih));

    if (isUnlocked) {
        const img = sprites[imgData.id];
        if (img) {
            _ctx.drawImage(img, s(ix), s(iy), s(iw), s(ih));
        } else {
            // Fallback si no carga
            _ctx.fillStyle = '#222';
            _ctx.fillRect(s(ix), s(iy), s(iw), s(ih));
        }
    } else {
        _ctx.fillStyle = '#222';
        _ctx.fillRect(s(ix), s(iy), s(iw), s(ih));
        _ctx.textAlign = 'center';
        _ctx.fillStyle = '#666';
        _ctx.font = `bold ${s(20)}px Courier New`;
        _ctx.fillText('🔒', s(ix + iw / 2), s(iy + ih / 2));
        _ctx.font = `${s(10)}px Courier New`;
        _ctx.fillText(t('galLocked'), s(ix + iw / 2), s(iy + ih / 2 + 30));
    }

    // Info nivel
    _ctx.textAlign = 'center';
    _ctx.fillStyle = isUnlocked ? '#fff' : '#888';
    _ctx.font = `bold ${s(14)}px Courier New`;
    _ctx.fillText(`${t('galLevel')} ${imgData.level}`, s(ox + cw / 2), s(iy + ih + 40));
    
    _ctx.font = `${s(10)}px Courier New`;
    _ctx.fillStyle = '#aaa';
    _ctx.fillText(`${t('galUnlock')} ${imgData.level * 1000} pts`, s(ox + cw / 2), s(iy + ih + 65));

    // Flechas navegación
    const bounce = Math.sin(time * 5) * 5;
    _ctx.fillStyle = '#e8c840';
    _ctx.font = `bold ${s(24)}px Courier New`;
    _ctx.fillText('◀', s(ox + 20 - (galleryPage > 0 ? bounce : 0)), s(iy + ih / 2));
    _ctx.fillText('▶', s(ox + cw - 20 + (galleryPage < GALLERY_IMAGES.length - 1 ? bounce : 0)), s(iy + ih / 2));

    // Indicador de página
    for (let i = 0; i < GALLERY_IMAGES.length; i++) {
        _ctx.fillStyle = i === galleryPage ? '#e8c840' : '#444';
        _ctx.beginPath();
        _ctx.arc(s(ox + cw / 2 - (GALLERY_IMAGES.length * 10) / 2 + i * 10), s(iy + ih + 90), s(3), 0, Math.PI * 2);
        _ctx.fill();
    }

    // Botón Volver
    const isBack = true;
    _ctx.fillStyle = '#1a1a2e';
    _ctx.fillRect(s(ox + 40), s(BH - 72), s(cw - 80), s(40));
    _ctx.strokeStyle = '#e8c840';
    _ctx.strokeRect(s(ox + 40), s(BH - 72), s(cw - 80), s(40));
    _ctx.textAlign = 'center';
    _ctx.fillStyle = '#fff';
    _ctx.font = `bold ${s(12)}px Courier New`;
    _ctx.fillText(t('back'), s(ox + cw / 2), s(BH - 48));
}

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

function _sectionTitle(text, y) {
    _ctx.textAlign = 'center';
    _ctx.fillStyle = '#e8c840';
    _ctx.font = `bold ${s(16)}px Courier New`;
    _ctx.fillText(text, s(BASE_W / 2), s(y));
    _ctx.strokeStyle = 'rgba(232,200,64,0.2)';
    _ctx.lineWidth = s(1);
    _ctx.beginPath();
    _ctx.moveTo(s(mX() + 40), s(y + 10)); _ctx.lineTo(s(mX() + mW() - 40), s(y + 10));
    _ctx.stroke();
}

// Slider con botones - y + a los lados
function _sliderBtns(label, value, y, color) {
    const L = mX() + 30, R = mX() + mW() - 30;
    const btnW = 28, btnH = 20;
    const barW = R - L - 2 * (btnW + 4);
    const barX = L + btnW + 4;
    const barH = 8, barY = y + 12;

    _ctx.textAlign = 'left';
    _ctx.fillStyle = '#aaa';
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.fillText(label, s(L), s(y));
    _ctx.textAlign = 'right';
    _ctx.fillStyle = color;
    _ctx.font = `bold ${s(8)}px Courier New`;
    _ctx.fillText(`${Math.round(value * 100)}%`, s(R), s(y));

    // Botón -
    _ctx.fillStyle = '#1a1a2e';
    _ctx.fillRect(s(L), s(barY - 6), s(btnW), s(btnH));
    _ctx.strokeStyle = '#444';
    _ctx.lineWidth = s(0.8);
    _ctx.strokeRect(s(L), s(barY - 6), s(btnW), s(btnH));
    _ctx.fillStyle = '#aaa';
    _ctx.font = `bold ${s(10)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText('−', s(L + btnW / 2), s(barY + 5));

    // Botón +
    _ctx.fillStyle = '#1a1a2e';
    _ctx.fillRect(s(R - btnW), s(barY - 6), s(btnW), s(btnH));
    _ctx.strokeStyle = '#444';
    _ctx.lineWidth = s(0.8);
    _ctx.strokeRect(s(R - btnW), s(barY - 6), s(btnW), s(btnH));
    _ctx.fillStyle = color;
    _ctx.font = `bold ${s(10)}px Courier New`;
    _ctx.fillText('+', s(R - btnW / 2), s(barY + 5));

    // Barra
    _ctx.fillStyle = '#1a1a2e';
    _ctx.fillRect(s(barX), s(barY), s(barW), s(barH));
    _ctx.fillStyle = color;
    _ctx.fillRect(s(barX), s(barY), s(barW * value), s(barH));
    _ctx.fillStyle = '#fff';
    _ctx.beginPath();
    _ctx.arc(s(barX + barW * value), s(barY + barH / 2), s(6), 0, Math.PI * 2);
    _ctx.fill();
    _ctx.strokeStyle = '#2a2a3e';
    _ctx.lineWidth = s(0.5);
    _ctx.strokeRect(s(barX), s(barY), s(barW), s(barH));
}

function _toggle(label, active, y, colorOn = '#44dd66') {
    const L = mX() + 30, R = mX() + mW() - 30;
    _ctx.textAlign = 'left';
    _ctx.fillStyle = '#aaa';
    _ctx.font = `${s(8.5)}px Courier New`;
    _ctx.fillText(label, s(L), s(y));
    const tw = 36, th = 18, tx = R - tw, ty = y - 13;
    _ctx.fillStyle = active ? colorOn + '44' : '#1a1a2e';
    _ctx.fillRect(s(tx), s(ty), s(tw), s(th));
    _ctx.strokeStyle = active ? colorOn : '#333';
    _ctx.lineWidth = s(1);
    _ctx.strokeRect(s(tx), s(ty), s(tw), s(th));
    const kx = active ? tx + tw - 10 : tx + 4;
    _ctx.fillStyle = active ? colorOn : '#444';
    _ctx.beginPath();
    _ctx.arc(s(kx + 5), s(ty + th / 2), s(6), 0, Math.PI * 2);
    _ctx.fill();
    _ctx.textAlign = 'right';
    _ctx.fillStyle = active ? colorOn : '#444';
    _ctx.font = `bold ${s(7)}px Courier New`;
    _ctx.fillText(active ? 'ON' : 'OFF', s(tx - 6), s(y));
}

function _multiBtn(labels, colors, active, startY, btnH = 34) {
    const L = mX() + 30, R = mX() + mW() - 30;
    const total = R - L, gap = 4;
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

// ---- PANTALLAS ----
function _drawMain(time, highScore) {
    _ctx.textAlign = 'center';
    _ctx.fillStyle = '#fff';
    _ctx.font = `bold ${s(26)}px Courier New`;
    _ctx.fillText('ASTRONAUTA', s(BASE_W / 2), s(118));
    _ctx.fillStyle = '#e8c840';
    _ctx.fillText('COLOMBIANO', s(BASE_W / 2), s(152));
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

    // Items con fondo resaltado al seleccionar
    _drawItems(MAIN_ITEMS, 355, 44, time);

    if (highScore > 0) {
        _ctx.fillStyle = '#e8c840';
        _ctx.font = `${s(9)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(`${t('best')}: ${highScore}`, s(BASE_W / 2), s(BASE_H - 46));
    }
    _ctx.fillStyle = '#333';
    _ctx.font = `${s(7)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(isMobile ? t('tapSelect') : t('navHint'), s(BASE_W / 2), s(BASE_H - 26));
    _ctx.fillStyle = '#222';
    _ctx.font = `${s(6)}px Courier New`;
    _ctx.fillText('v2.0', s(BASE_W / 2), s(BASE_H - 12));
}

function _drawNewGame(time) {
    _sectionTitle(t('newGameTitle'), 105);
    const floatY = 148 + Math.sin(time * 1.8) * 7;
    const spW = 56, spH = 68;
    if (sprites.player) {
        _ctx.drawImage(sprites.player, s(BASE_W / 2 - spW / 2), s(floatY), s(spW), s(spH));
    } else {
        _ctx.fillStyle = '#e8c840';
        _ctx.fillRect(s(BASE_W / 2 - 14), s(floatY + 8), s(28), s(spH - 14));
    }
    _drawItems(_getNewGameItems(), 300, 56, time);
    _ctx.fillStyle = '#333';
    _ctx.font = `${s(7)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(isMobile ? t('tapSelect') : t('navHint2'), s(BASE_W / 2), s(BASE_H - 26));
}

function _drawOptions(time) {
    _sectionTitle(t('optTitle'), 105);
    const ox = mX(), cw = mW();
    const tabW = cw / OPT_TABS_KEYS.length;
    for (let i = 0; i < OPT_TABS_KEYS.length; i++) {
        const tx = ox + i * tabW;
        const active = i === optionsTab;
        _ctx.fillStyle = active ? 'rgba(232,200,64,0.15)' : 'rgba(255,255,255,0.02)';
        _ctx.fillRect(s(tx), s(128), s(tabW), s(28));
        _ctx.strokeStyle = active ? '#e8c840' : '#222';
        _ctx.lineWidth = s(active ? 1.5 : 0.5);
        _ctx.strokeRect(s(tx), s(128), s(tabW), s(28));
        _ctx.fillStyle = active ? '#e8c840' : '#555';
        _ctx.font = `bold ${s(active ? 7.5 : 7)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(t(OPT_TABS_KEYS[i]), s(tx + tabW / 2), s(146));
    }
    const contentY = 175;
    if (optionsTab === 0) _drawTabAudio(contentY);
    if (optionsTab === 1) _drawTabDifficulty(contentY);
    if (optionsTab === 2) _drawTabGraphics(contentY);
    if (optionsTab === 3) _drawTabControls(contentY);
    if (optionsTab === 4) _drawTabLang(contentY);
    _drawPulseBtn(t('back2'), BASE_W / 2, BASE_H - 52, time);
}

function _drawTabAudio(y) {
    _sliderBtns(t('sfxLabel'),   getSFXVolume(),   y,      '#4488ff');
    _sliderBtns(t('musicLabel'), getMusicVolume(), y + 60, '#44dd66');
    _toggle(t('muteLabel'), !isMuted(), y + 130, '#44dd66');
    const L = mX() + 30, R = mX() + mW() - 30;
    _ctx.strokeStyle = '#1a1a2e';
    _ctx.lineWidth = s(1);
    _ctx.beginPath();
    _ctx.moveTo(s(L), s(y + 148)); _ctx.lineTo(s(R), s(y + 148));
    _ctx.stroke();
    _ctx.fillStyle = '#333';
    _ctx.font = `${s(7.5)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(t('audioInfo'),  s(BASE_W / 2), s(y + 165));
    _ctx.fillText(t('audioInfo2'), s(BASE_W / 2), s(y + 180));
}

function _drawTabDifficulty(y) {
    const diffLabels = [t('diffEasy'), t('diffNormal'), t('diffHard')];
    const diffDescs  = [t('diffDescE'), t('diffDescN'), t('diffDescH')];
    const L = mX() + 30;
    _ctx.fillStyle = '#888';
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText(t('diffTitle'), s(L), s(y));
    _multiBtn(diffLabels, DIFF_COLORS, _diff, y + 12, 36);
    _ctx.fillStyle = DIFF_COLORS[_diff];
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(diffDescs[_diff], s(BASE_W / 2), s(y + 68));
    const rows = [
        [t('rowSpeed'),  [t('valNormal'), t('valNormal'), t('valFast')]],
        [t('rowSpawn'),  [t('valLow'),    t('valMed'),    t('valHigh')]],
        [t('rowOxy'),    [t('valSlow'),   t('valNormal'), t('valFast')]],
        [t('rowDrops'),  [t('valMore'),   t('valNormal'), t('valLess')]],
        [t('rowWeapon'), ['45s/90s',      '30s/60s',      '21s/42s'  ]],
    ];
    rows.forEach(([label, vals], i) => {
        const ry = y + 95 + i * 28;
        const ox = mX();
        const cw = mW();
        _ctx.fillStyle = '#333';
        _ctx.fillRect(s(ox + 30), s(ry - 10), s(cw - 60), s(24));
        _ctx.fillStyle = '#666';
        _ctx.font = `${s(7.5)}px Courier New`;
        _ctx.textAlign = 'left';
        _ctx.fillText(label, s(ox + 36), s(ry + 4));
        _ctx.fillStyle = DIFF_COLORS[_diff];
        _ctx.font = `bold ${s(7.5)}px Courier New`;
        _ctx.textAlign = 'right';
        _ctx.fillText(vals[_diff], s(ox + cw - 36), s(ry + 4));
    });
}

function _drawTabGraphics(y) {
    const gfxLabels  = [t('gfxLow'), t('gfxMed'), t('gfxHigh')];
    const partLabels = [t('partFew'), t('partNorm'), t('partMany')];
    const gfxDescs   = [t('gfxDescL'), t('gfxDescM'), t('gfxDescH')];
    const L = mX() + 30;
    _ctx.fillStyle = '#888';
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText(t('gfxTitle'), s(L), s(y));
    _multiBtn(gfxLabels, QUALITY_COLORS, _quality, y + 12, 34);
    _ctx.fillStyle = QUALITY_COLORS[_quality];
    _ctx.font = `${s(7)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(gfxDescs[_quality], s(BASE_W / 2), s(y + 56));
    _ctx.fillStyle = '#888';
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText(t('partTitle'), s(L), s(y + 68));
    _multiBtn(partLabels, ['#888', '#e8c840', '#ff8800'], _particles, y + 80, 34);
    _toggle(t('shakeLabel'), _shake,    y + 148, '#e8c840');
    _toggle(t('vigLabel'),   _vignette, y + 178, '#aa66ff');
}

function _drawTabControls(y) {
    const pairs = isMobile
        ? [[t('ctrlMove'), t('ctrlMoveM')], [t('ctrlShoot'), t('ctrlShootM')], [t('ctrlPause'), t('ctrlPauseM')]]
        : [[t('ctrlMove'), 'WASD / Arrows'], [t('ctrlShoot'), 'Space'], [t('ctrlPause'), 'P'], [t('ctrlMenu'), 'Esc'], [t('ctrlMute'), 'M']];

    const ox = mX(), cw = mW();
    pairs.forEach(([action, key], i) => {
        const ry = y + i * 36;
        _ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        _ctx.fillRect(s(ox + 30), s(ry - 8), s(cw - 60), s(30));
        _ctx.fillStyle = '#888';
        _ctx.font = `${s(8.5)}px Courier New`;
        _ctx.textAlign = 'left';
        _ctx.fillText(action, s(ox + 38), s(ry + 8));
        const kw = key.length * 5.2 + 16;
        const kx = ox + cw - 38 - kw;
        _ctx.fillStyle = '#1a1a2e';
        _ctx.fillRect(s(kx), s(ry - 2), s(kw), s(20));
        _ctx.strokeStyle = '#333';
        _ctx.lineWidth = s(0.8);
        _ctx.strokeRect(s(kx), s(ry - 2), s(kw), s(20));
        _ctx.fillStyle = '#e8c840';
        _ctx.font = `bold ${s(7.5)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(key, s(kx + kw / 2), s(ry + 10));
    });
    const wY = y + pairs.length * 36 + 16;
    _ctx.strokeStyle = '#1a1a2e';
    _ctx.lineWidth = s(1);
    _ctx.beginPath();
    _ctx.moveTo(s(ox + 30), s(wY)); _ctx.lineTo(s(ox + cw - 30), s(wY));
    _ctx.stroke();
    _ctx.fillStyle = '#555';
    _ctx.font = `bold ${s(7.5)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.fillText(t('weaponInfo'), s(ox + 30), s(wY + 14));
    _ctx.fillStyle = '#444';
    _ctx.font = `${s(7.5)}px Courier New`;
    _ctx.fillText(t('weaponChain'), s(ox + 30), s(wY + 28));
}

function _drawTabLang(y) {
    _ctx.fillStyle = '#aaa';
    _ctx.font = `${s(9)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(t('langTitle'), s(BASE_W / 2), s(y + 16));
    _ctx.fillStyle = '#555';
    _ctx.font = `${s(8)}px Courier New`;
    _ctx.fillText(t('langHint'), s(BASE_W / 2), s(y + 32));
    const L = mX() + 30, R = mX() + mW() - 30;
    const bw2 = (R - L - 8) / 2;
    const curLang = getLang();
    for (let i = 0; i < LANGS.length; i++) {
        const bx = L + i * (bw2 + 8);
        const isActive = LANGS[i] === curLang;
        _ctx.fillStyle = isActive ? 'rgba(232,200,64,0.18)' : 'rgba(255,255,255,0.03)';
        _ctx.fillRect(s(bx), s(y + 50), s(bw2), s(60));
        _ctx.strokeStyle = isActive ? '#e8c840' : '#333';
        _ctx.lineWidth = s(isActive ? 2 : 0.5);
        _ctx.strokeRect(s(bx), s(y + 50), s(bw2), s(60));
        _ctx.fillStyle = isActive ? '#e8c840' : '#666';
        _ctx.font = `bold ${s(isActive ? 18 : 15)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(LANGS[i] === 'ES' ? 'ES' : 'EN', s(bx + bw2 / 2), s(y + 86));
        _ctx.fillStyle = isActive ? '#e8c840' : '#444';
        _ctx.font = `${s(7)}px Courier New`;
        _ctx.fillText(LANGS[i] === 'ES' ? 'Español' : 'English', s(bx + bw2 / 2), s(y + 100));
    }
}

function _drawCredits(time) {
    const ox = mX(), cw = mW(), BH = BASE_H;
    _sectionTitle(t('credTitle'), 60);

    const sections = [
        { titleKey: 'credDev',     lines: ['Jhorman Castellanos', 'github.com/Jhormancastella'] },
        { titleKey: 'credArt',     lines: ['Estilo: Pixel Art (64x64)', 'Astronauta, Asteroides', 'Explosiones y Efectos'] },
        { titleKey: 'credEngine',  lines: ['HTML5 Canvas API', 'JavaScript ES Modules', 'Web Audio API'] },
        { titleKey: 'credAudio',   lines: ['Cloudinary CDN'] },
        { titleKey: 'credThanks',  lines: ['Rosy (Beta Testing)'] },
        { titleKey: 'credVersion', lines: ['2.0  —  Astronauta colombiano  —  2026'] },
    ];

    // Contenedor de créditos con máscara
    _ctx.save();
    const clipY = 100, clipH = BH - 180;
    _ctx.beginPath();
    _ctx.rect(s(ox), s(clipY), s(cw), s(clipH));
    _ctx.clip();

    creditsScroll += 0.6; // Velocidad de desplazamiento
    let yBase = BH - creditsScroll;

    for (const sec of sections) {
        // Dibujar Título de Sección
        _drawStarWarsLine(t(sec.titleKey), yBase, true, time);
        yBase += 25;

        for (const line of sec.lines) {
            _drawStarWarsLine(line, yBase, false, time);
            yBase += 20;
        }
        yBase += 30;
    }

    _ctx.restore();

    // Si los créditos terminan, reiniciar o permitir bucle
    if (yBase < clipY) creditsScroll = -50;

    _drawPulseBtn(t('back2'), BASE_W / 2, BASE_H - 52, time);
}

function _drawStarWarsLine(text, y, isTitle, time) {
    const BH = BASE_H, BW = BASE_W;
    const centerY = BH / 2;
    
    // Solo dibujar si está dentro del rango visual
    if (y < 50 || y > BH + 50) return;

    // Calcular perspectiva
    // El texto se hace más pequeño y se mueve al centro a medida que sube
    const perspective = (y + 100) / (BH + 100); 
    const scale = Math.max(0.1, Math.pow(perspective, 1.5));
    const alpha = Math.min(1, (y - 100) / 100); // Fade in/out arriba

    _ctx.save();
    _ctx.globalAlpha = Math.max(0, alpha);
    _ctx.textAlign = 'center';
    
    const fontSize = isTitle ? 18 : 12;
    _ctx.font = `${isTitle ? 'bold' : ''} ${s(fontSize * scale)}px Courier New`;
    _ctx.fillStyle = isTitle ? '#e8c840' : '#aaa';
    
    // El eje X se mantiene en el centro, pero el tamaño de fuente escalado da el efecto
    _ctx.fillText(text, s(BW / 2), s(y));
    _ctx.restore();
}

function _drawItems(items, startY, itemH, time) {
    const ox = mX();
    const cw = mW();
    for (let i = 0; i < items.length; i++) {
        const iy = startY + i * itemH;
        const sel = i === selectedIndex;
        _ctx.fillStyle = sel ? 'rgba(232,200,64,0.10)' : 'rgba(255,255,255,0.02)';
        _ctx.fillRect(s(ox + 40), s(iy - 18), s(cw - 80), s(36));
        _ctx.strokeStyle = sel ? 'rgba(232,200,64,0.35)' : 'rgba(255,255,255,0.06)';
        _ctx.lineWidth = s(sel ? 1 : 0.5);
        _ctx.strokeRect(s(ox + 40), s(iy - 18), s(cw - 80), s(36));
        if (sel) {
            const pulse = 0.5 + 0.5 * Math.sin(time * 6);
            _ctx.globalAlpha = pulse;
            _ctx.fillStyle = '#e8c840';
            _ctx.font = `${s(9)}px Courier New`;
            _ctx.textAlign = 'left';
            _ctx.fillText('▶', s(ox + 48), s(iy + 3));
            _ctx.globalAlpha = 1;
        }
        _ctx.fillStyle = sel ? '#e8c840' : '#777';
        _ctx.font = `bold ${s(sel ? 11 : 10)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText(t(items[i].labelKey), s(BASE_W / 2), s(iy + 3));
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
