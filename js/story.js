// --- STORY / CUTSCENE ---
// 5 slides con efecto typewriter. Avanzar: Space/tap. Saltar: ESC.
import { s, sprites } from './utils.js';
import * as Utils from './utils.js';

let _ctx = null;
export function initStory(ctx) { _ctx = ctx; }

// Las posiciones usan fracciones de BASE_W/BASE_H para ser dinámicas
const SLIDES = [
    {
        bg: ['#020208', '#050518'],
        spriteXR: 0.5, spriteYR: 0.55, spriteFloat: true,
        text: "Año 2157. La estación orbital KEPLER-9\nha sido destruida por una lluvia\nde meteoritos.",
        accent: '#4488ff',
    },
    {
        bg: ['#080205', '#180505'],
        spriteXR: 0.25, spriteYR: 0.5, spriteFloat: false,
        text: "Eres el único sobreviviente.\nTu traje tiene oxígeno\npara pocos minutos.",
        accent: '#ff4444',
    },
    {
        bg: ['#020808', '#051808'],
        spriteXR: 0.75, spriteYR: 0.52, spriteFloat: true,
        text: "Los escombros de la estación\ncaen sin control.\nDebes esquivarlos y sobrevivir.",
        accent: '#44dd66',
    },
    {
        bg: ['#050510', '#0a0a20'],
        spriteXR: 0.5, spriteYR: 0.48, spriteFloat: true,
        text: "Recoge oxígeno, combustible\ny kits médicos para mantenerte\nvivo en el vacío.",
        accent: '#e8c840',
    },
    {
        bg: ['#050510', '#0a0a20'],
        spriteXR: 0.5, spriteYR: 0.5, spriteFloat: true,
        text: "Buena suerte, astronauta.\nEl universo no perdona\na los que dudan.",
        accent: '#ffffff',
    },
];

const TYPEWRITER_SPEED = 0.03; // segundos por carácter

let slideIndex    = 0;
let slideTime     = 0;
let typewriterPos = 0;
let typewriterTimer = 0;
let onDone = null;

export function startStory(callback) {
    slideIndex = 0;
    slideTime  = 0;
    typewriterPos   = 0;
    typewriterTimer = 0;
    onDone = callback;
}

export function storyAdvance() {
    if (slideIndex >= SLIDES.length) return;
    const totalChars = SLIDES[slideIndex].text.replace(/\n/g, '').length;
    // Si el texto no terminó, completarlo primero
    if (typewriterPos < totalChars) {
        typewriterPos = totalChars;
        return;
    }
    slideIndex++;
    slideTime = typewriterPos = typewriterTimer = 0;
    if (slideIndex >= SLIDES.length && onDone) onDone();
}

export function storySkip() {
    if (onDone) onDone();
}

export function updateStory(dt) {
    if (slideIndex >= SLIDES.length) return;
    slideTime += dt;
    const totalChars = SLIDES[slideIndex].text.replace(/\n/g, '').length;
    if (typewriterPos < totalChars) {
        typewriterTimer += dt;
        while (typewriterTimer >= TYPEWRITER_SPEED && typewriterPos < totalChars) {
            typewriterTimer -= TYPEWRITER_SPEED;
            typewriterPos++;
        }
    }
}

export function drawStory(time) {
    if (slideIndex >= SLIDES.length) return;
    const slide = SLIDES[slideIndex];
    const BW = Utils.BASE_W, BH = Utils.BASE_H;

    // Fondo
    const grad = _ctx.createLinearGradient(0, 0, 0, _ctx.canvas.height);
    grad.addColorStop(0, slide.bg[0]);
    grad.addColorStop(1, slide.bg[1]);
    _ctx.fillStyle = grad;
    _ctx.fillRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);

    // Estrellas simples
    for (let i = 0; i < 40; i++) {
        const sx = (i * 137.5 + slideIndex * 50) % BW;
        const sy = (i * 97.3  + slideIndex * 30) % BH;
        const ss = 0.5 + (i % 3) * 0.5;
        _ctx.globalAlpha = 0.4 + 0.4 * Math.sin(time * (1 + i % 4) + i);
        _ctx.fillStyle = '#fff';
        _ctx.fillRect(s(sx), s(sy), s(ss), s(ss));
    }
    _ctx.globalAlpha = 1;

    // Sprite astronauta
    const spW = 48, spH = 58;
    const spX = slide.spriteXR * BW - spW / 2;
    const spY = slide.spriteYR * BH - spH / 2 + (slide.spriteFloat ? Math.sin(time * 1.5) * 8 : 0);

    if (sprites.player) {
        _ctx.drawImage(sprites.player, s(spX), s(spY), s(spW), s(spH));
    } else {
        _ctx.fillStyle = '#e8c840';
        _ctx.fillRect(s(spX + 4), s(spY + 10), s(spW - 8), s(spH - 14));
        _ctx.fillStyle = '#fff';
        _ctx.fillRect(s(spX + 8), s(spY), s(spW - 16), s(14));
        _ctx.fillStyle = '#4488cc';
        _ctx.fillRect(s(spX + 10), s(spY + 3), s(spW - 20), s(7));
    }

    // Caja de texto
    const boxX = 20, boxY = BH * 0.62, boxW = BW - 40, boxH = 110;
    _ctx.fillStyle = 'rgba(0,0,0,0.75)';
    _ctx.fillRect(s(boxX), s(boxY), s(boxW), s(boxH));
    _ctx.strokeStyle = slide.accent;
    _ctx.lineWidth = s(1.5);
    _ctx.strokeRect(s(boxX), s(boxY), s(boxW), s(boxH));

    // Texto typewriter — recorre líneas contando caracteres correctamente
    _ctx.fillStyle = '#fff';
    _ctx.font = `${s(9)}px Courier New`;
    _ctx.textAlign = 'left';
    _ctx.textBaseline = 'top';
    const lines = slide.text.split('\n');
    let shown = 0;
    for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        const visible = line.slice(0, Math.max(0, typewriterPos - shown));
        shown += line.length;
        _ctx.fillText(visible, s(boxX + 10), s(boxY + 12 + li * 14));
    }

    // Indicador de avance
    const totalChars = slide.text.replace(/\n/g, '').length;
    if (typewriterPos >= totalChars && Math.sin(time * 4) > 0) {
        _ctx.fillStyle = slide.accent;
        _ctx.font = `${s(8)}px Courier New`;
        _ctx.textAlign = 'right';
        _ctx.fillText('▶ continuar', s(boxX + boxW - 8), s(boxY + boxH - 14));
    }

    // Pie de página
    _ctx.textBaseline = 'alphabetic';
    _ctx.fillStyle = 'rgba(255,255,255,0.3)';
    _ctx.font = `${s(7)}px Courier New`;
    _ctx.textAlign = 'center';
    _ctx.fillText(`${slideIndex + 1} / ${SLIDES.length}`, s(BW / 2), s(BH - 20));
    _ctx.fillStyle = 'rgba(255,255,255,0.2)';
    _ctx.textAlign = 'right';
    _ctx.fillText('ESC = saltar', s(BW - 10), s(BH - 20));
}
