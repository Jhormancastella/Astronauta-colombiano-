// --- AUDIO MANAGER ---
// Audio cargado desde Cloudinary (URLs externas, sin archivos locales).
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

// Solo crear AudioContext tras gesto del usuario (llamado desde resumeCtx)
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
        let arrayBuffer;
        if ('caches' in window) {
            const cache = await caches.open(CACHE_NAME);
            let cached = await cache.match(src);
            if (!cached) {
                const res = await fetch(src);
                if (!res.ok) return;
                await cache.put(src, res.clone());
                cached = res;
            }
            arrayBuffer = await cached.arrayBuffer();
        } else {
            const res = await fetch(src);
            if (!res.ok) return;
            arrayBuffer = await res.arrayBuffer();
        }
        // Decodificar solo si ya hay contexto (tras gesto del usuario)
        if (ctx) {
            buffers[key] = await ctx.decodeAudioData(arrayBuffer);
        } else {
            // Guardar el buffer crudo para decodificar después
            buffers[`_raw_${key}`] = arrayBuffer;
        }
    } catch (_) { /* silently skip */ }
}

// Decodifica buffers crudos pendientes tras crear el contexto
async function _decodePending() {
    for (const k of Object.keys(buffers)) {
        if (!k.startsWith('_raw_')) continue;
        const key = k.slice(5);
        try {
            buffers[key] = await ctx.decodeAudioData(buffers[k]);
        } catch (_) {}
        delete buffers[k];
    }
}

export async function loadAllSounds() {
    const BASE = 'https://res.cloudinary.com/dcqnjn6fe/video/upload/q_auto/f_auto';
    const sounds = {
        hit:       `${BASE}/v1775041096/hit_qqxyif.wav`,
        pickup:    `${BASE}/v1775041096/pickup_gqsh0p.ogg`,
        explosion: `${BASE}/v1775041097/explosion_chqjzp.wav`,
        shoot:     `${BASE}/v1775041098/shoot_dnb6qq.wav`,
        gameover:  `${BASE}/v1775041169/gameover_wjj88y.wav`,
        gameplay:  `${BASE}/v1775041237/gameplay_czeqyn.mp3`,
    };
    await Promise.all(
        Object.entries(sounds).map(([k, url]) => loadSound(k, url))
    );
}

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

export async function resumeCtx() {
    if (!ctx) {
        initCtx();
        await _decodePending();
    }
    if (ctx.state === 'suspended') await ctx.resume();
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
