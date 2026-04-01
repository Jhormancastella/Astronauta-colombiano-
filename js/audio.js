// --- AUDIO MANAGER ---
// Archivos en: audio/sfx/*.ogg  y  audio/music/*.ogg
// Usa Cache API para evitar re-descargas entre recargas de página.

// @ts-ignore — webkitAudioContext existe en Safari antiguo
const AC = window.AudioContext || window.webkitAudioContext;
let ctx = null;

const buffers = {};
const settings = {
    sfxVolume:   parseFloat(localStorage.getItem('sfxVolume')   ?? '0.7'),
    musicVolume: parseFloat(localStorage.getItem('musicVolume') ?? '0.4'),
    muted:       localStorage.getItem('muted') === 'true',
};

let musicSource = null;
let musicGain   = null;
let sfxGain     = null;
let masterGain  = null;

const CACHE_NAME = 'astronauta-colombiano-audio-v1';

function initCtx() {
    if (ctx) return;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = settings.sfxVolume;
    sfxGain.connect(masterGain);
    musicGain = ctx.createGain();
    musicGain.gain.value = settings.musicVolume;
    musicGain.connect(masterGain);
    if (settings.muted) masterGain.gain.value = 0;
}

async function loadSound(key, src) {
    try {
        initCtx();

        let arrayBuffer;

        // Intentar obtener desde Cache API primero
        if ('caches' in window) {
            const cache = await caches.open(CACHE_NAME);
            let cached = await cache.match(src);

            if (!cached) {
                // No está en caché — descargar y guardar
                const res = await fetch(src);
                if (!res.ok) return;
                await cache.put(src, res.clone());
                cached = res;
            }

            arrayBuffer = await cached.arrayBuffer();
        } else {
            // Fallback sin Cache API
            const res = await fetch(src);
            if (!res.ok) return;
            arrayBuffer = await res.arrayBuffer();
        }

        buffers[key] = await ctx.decodeAudioData(arrayBuffer);
    } catch (_) { /* silently skip */ }
}

export async function loadAllSounds() {
    const sfx   = ['shoot', 'explosion', 'pickup', 'hit', 'gameover'];
    const music = ['menu', 'gameplay'];
    await Promise.all([
        ...sfx.map(k   => loadSound(k, `audio/sfx/${k}.ogg`)),
        ...music.map(k => loadSound(k, `audio/music/${k}.ogg`)),
    ]);
}

// Limpia el caché de audio (útil si actualizas los archivos)
export async function clearAudioCache() {
    if ('caches' in window) await caches.delete(CACHE_NAME);
}

export function playSFX(key) {
    if (!ctx || !buffers[key]) return;
    const src = ctx.createBufferSource();
    src.buffer = buffers[key];
    src.connect(sfxGain);
    src.start();
}

export function playMusic(key, loop = true) {
    if (!ctx) return;
    stopMusic();
    if (!buffers[key]) return;
    musicSource = ctx.createBufferSource();
    musicSource.buffer = buffers[key];
    musicSource.loop = loop;
    musicSource.connect(musicGain);
    musicSource.start();
}

export function stopMusic() {
    if (musicSource) {
        try { musicSource.stop(); } catch (_) {}
        musicSource = null;
    }
}

export function resumeCtx() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function setSFXVolume(v) {
    settings.sfxVolume = v;
    if (sfxGain) sfxGain.gain.value = v;
    localStorage.setItem('sfxVolume', String(v));
}

export function setMusicVolume(v) {
    settings.musicVolume = v;
    if (musicGain) musicGain.gain.value = v;
    localStorage.setItem('musicVolume', String(v));
}

export function toggleMute() {
    settings.muted = !settings.muted;
    if (masterGain) masterGain.gain.value = settings.muted ? 0 : 1;
    localStorage.setItem('muted', String(settings.muted));
    return settings.muted;
}

export function isMuted()        { return settings.muted; }
export function getSFXVolume()   { return settings.sfxVolume; }
export function getMusicVolume() { return settings.musicVolume; }
