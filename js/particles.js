// --- PARTICLE SYSTEM ---
import { s, rand, clamp } from './utils.js';

let _ctx = null;
export function initParticles(ctx) { _ctx = ctx; }

export let particles = [];

export class Particle {
    constructor(x, y, color, vx, vy, life, size) {
        this.x = x; this.y = y;
        this.color = color;
        this.vx = vx; this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size || rand(1, 3);
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    draw() {
        const alpha = clamp(this.life / this.maxLife, 0, 1);
        _ctx.globalAlpha = alpha;
        _ctx.fillStyle = this.color;
        _ctx.fillRect(s(this.x), s(this.y), s(this.size), s(this.size));
        _ctx.globalAlpha = 1;
    }
}

export function spawnExplosion(x, y, color, count = 12, speed = 80) {
    for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2);
        const spd = rand(20, speed);
        particles.push(new Particle(x, y, color,
            Math.cos(angle) * spd, Math.sin(angle) * spd,
            rand(0.3, 0.8), rand(1, 3)));
    }
}

export function spawnTrail(x, y, color) {
    particles.push(new Particle(
        x + rand(-2, 2), y, color,
        rand(-10, 10), rand(20, 50),
        rand(0.1, 0.3), rand(1, 2)
    ));
}

export function updateParticles(dt) {
    for (const p of particles) p.update(dt);
    particles = particles.filter(p => p.life > 0);
}

export function drawParticles() {
    for (const p of particles) p.draw();
}

export function clearParticles() { particles = []; }
