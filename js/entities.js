// --- ENTITIES: Fragment, Bullet, Pickup, Warning, Star ---
import { s, rand, clamp, sprites, getTextureCells } from './utils.js';
import * as Utils from './utils.js';

// Acceso dinámico a BASE_W/BASE_H (cambian con el resize)
function BW() { return Utils.BASE_W; }
function BH() { return Utils.BASE_H; }

// Cache de celdas para no recalcular cada frame
let _texCells = null;
function getCell(index) {
    if (!_texCells) _texCells = getTextureCells();
    return _texCells[index % _texCells.length];
}

let _ctx = null;
export function initEntities(ctx) { _ctx = ctx; }

let _difficultyLevel = 1;
export function setDifficultyRef(ref) { _difficultyLevel = ref; }
export function getDifficultyLevel() { return _difficultyLevel; }

// ---- STAR FIELD ----
export class Star {
    constructor() { this.reset(); this.y = rand(0, BH()); }
    reset() {
        this.x = rand(0, BW());
        this.y = rand(-20, -5);
        this.speed = rand(30, 120);
        this.size = rand(0.5, 2);
        this.brightness = rand(0.3, 1);
        this.twinkleSpeed = rand(1, 4);
        this.twinkleOffset = rand(0, Math.PI * 2);
    }
    update(dt) {
        this.y += this.speed * dt;
        if (this.y > BH() + 5) this.reset();
    }
    draw(time) {
        const twinkle = 0.5 + 0.5 * Math.sin(time * this.twinkleSpeed + this.twinkleOffset);
        _ctx.globalAlpha = this.brightness * twinkle;
        _ctx.fillStyle = '#fff';
        _ctx.fillRect(s(this.x), s(this.y), s(this.size), s(this.size));
        _ctx.globalAlpha = 1;
    }
}

// ---- BULLET ----
export class Bullet {
    constructor(x, y, w = 3, h = 8, speed = -350, vx = 0, damage = 1, isLaser = false) {
        this.x = x; this.y = y;
        this.w = w; this.h = h;
        this.speed = speed;
        this.vx = vx;
        this.damage = damage;
        this.isLaser = isLaser;
        this.alive = true;
    }
    update(dt) {
        this.y += this.speed * dt;
        this.x += this.vx * dt;
        if (this.y < -20 || this.x < -10 || this.x > BW() + 10) this.alive = false;
    }
    draw() {
        if (this.isLaser) {
            // Láser: bala ancha con glow naranja
            _ctx.fillStyle = '#ff8800';
            _ctx.fillRect(s(this.x - 1), s(this.y - 2), s(this.w + 2), s(this.h + 4));
            _ctx.fillStyle = '#ffcc44';
            _ctx.fillRect(s(this.x), s(this.y), s(this.w), s(this.h));
            _ctx.fillStyle = 'rgba(255,180,0,0.3)';
            _ctx.fillRect(s(this.x - 3), s(this.y - 3), s(this.w + 6), s(this.h + 6));
        } else {
            _ctx.fillStyle = '#ff6';
            _ctx.fillRect(s(this.x - 0.5), s(this.y - 1), s(this.w + 1), s(this.h + 2));
            _ctx.fillStyle = '#fff';
            _ctx.fillRect(s(this.x), s(this.y), s(this.w), s(this.h));
        }
    }
}

// ---- FRAGMENT ----
export class Fragment {
    constructor() { this.reset(); }
    reset() {
        // Tamaño de fragmentos proporcional al ancho lógico actual
        const scale = Utils.BASE_W / 400;
        const minW = Math.round(12 * scale);
        const maxW = Math.round(30 * scale);
        this.w = rand(minW, maxW);
        this.h = rand(minW, maxW);
        this.x = rand(5, BW() - this.w - 5);
        this.y = rand(-80, -30);
        this.speed = rand(40, 80) + _difficultyLevel * 8;
        this.health = this.w > Math.round(22 * scale) ? 3 : (this.w > Math.round(16 * scale) ? 2 : 1);
        this.maxHealth = this.health;
        this.rotSpeed = rand(-2, 2);
        this.rot = rand(0, Math.PI * 2);
        this.alive = true;
        this.vx = rand(-15, 15);
        if (this.w > Math.round(22 * scale)) this.type = 1;
        else if (Math.random() < 0.15) this.type = 2;
        else this.type = 0;
        this.damage = this.type === 2 ? 20 : (this.type === 1 ? 15 : 10);
        this.spriteIndex = Math.floor(rand(0, 20));
    }
    update(dt) {
        this.y += this.speed * dt;
        this.x += this.vx * dt;
        this.rot += this.rotSpeed * dt;
        if (this.x < 0) { this.x = 0; this.vx = Math.abs(this.vx); }
        if (this.x + this.w > BW()) { this.x = BW() - this.w; this.vx = -Math.abs(this.vx); }
        if (this.y > BH() + 20) this.alive = false;
    }
    draw() {
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;
        _ctx.save();
        _ctx.translate(s(cx), s(cy));
        _ctx.rotate(this.rot);

        const hw = s(this.w / 2);
        const hh = s(this.h / 2);

        if (sprites.textures) {
            const cell = getCell(this.spriteIndex);

            // Tinte según tipo: normal=neutro, tough=azulado, explosive=rojizo
            if (this.type === 2) {
                // Tinte rojo para explosivos
                _ctx.globalCompositeOperation = 'source-over';
                _ctx.drawImage(sprites.textures, cell.sx, cell.sy, cell.sw, cell.sh,
                    -hw, -hh, hw * 2, hh * 2);
                _ctx.fillStyle = 'rgba(200,50,50,0.35)';
                _ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
            } else if (this.type === 1) {
                // Tinte azul oscuro para resistentes
                _ctx.drawImage(sprites.textures, cell.sx, cell.sy, cell.sw, cell.sh,
                    -hw, -hh, hw * 2, hh * 2);
                _ctx.fillStyle = 'rgba(40,60,120,0.3)';
                _ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
            } else {
                _ctx.drawImage(sprites.textures, cell.sx, cell.sy, cell.sw, cell.sh,
                    -hw, -hh, hw * 2, hh * 2);
            }

            // Overlay de daño
            if (this.health < this.maxHealth) {
                const dmgRatio = 1 - this.health / this.maxHealth;
                _ctx.fillStyle = `rgba(255,80,0,${dmgRatio * 0.5})`;
                _ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
                // Grietas simuladas con líneas
                _ctx.strokeStyle = `rgba(255,60,0,${dmgRatio * 0.7})`;
                _ctx.lineWidth = s(1);
                _ctx.beginPath();
                _ctx.moveTo(-hw * 0.3, -hh * 0.5);
                _ctx.lineTo(hw * 0.2, hh * 0.6);
                _ctx.stroke();
                if (dmgRatio > 0.5) {
                    _ctx.beginPath();
                    _ctx.moveTo(hw * 0.4, -hh * 0.3);
                    _ctx.lineTo(-hw * 0.1, hh * 0.4);
                    _ctx.stroke();
                }
            }

            // Borde brillante para explosivos
            if (this.type === 2) {
                _ctx.strokeStyle = 'rgba(255,100,50,0.6)';
                _ctx.lineWidth = s(1.5);
                _ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
            }
        } else {
            // Fallback sin spritesheet
            _ctx.fillStyle = 'rgba(0,0,0,0.3)';
            _ctx.fillRect(-hw + s(2), -hh + s(2), hw * 2, hh * 2);
            const color = this.type === 2 ? '#cc3333' : (this.type === 1 ? '#556' : '#888');
            _ctx.fillStyle = color;
            _ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
            if (this.health < this.maxHealth) {
                _ctx.fillStyle = 'rgba(255,100,0,0.4)';
                const dmgRatio = 1 - this.health / this.maxHealth;
                _ctx.fillRect(-hw, -hh, hw * 2 * dmgRatio, hh * 2);
            }
        }

        _ctx.restore();
    }
}

// ---- PICKUP ----
export class Pickup {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.r = 6;
        this.type = type;
        this.speed = rand(25, 40);
        this.alive = true;
        this.bobOffset = rand(0, Math.PI * 2);
        this.lifetime = 8;
    }
    update(dt) {
        this.y += this.speed * dt;
        this.lifetime -= dt;
        if (this.y > BH() + 10 || this.lifetime <= 0) this.alive = false;
    }
    draw(time) {
        const bob = Math.sin(time * 4 + this.bobOffset) * 2;
        const glowColor = this.type === 'oxygen' ? 'rgba(0,150,255,0.2)' :
                          this.type === 'fuel' ? 'rgba(0,255,100,0.2)' : 'rgba(255,50,50,0.2)';
        _ctx.beginPath();
        _ctx.arc(s(this.x), s(this.y + bob), s(this.r + 4), 0, Math.PI * 2);
        _ctx.fillStyle = glowColor;
        _ctx.fill();

        const mainColor = this.type === 'oxygen' ? '#4488ff' :
                          this.type === 'fuel' ? '#44dd66' : '#ff4466';
        _ctx.beginPath();
        _ctx.arc(s(this.x), s(this.y + bob), s(this.r), 0, Math.PI * 2);
        _ctx.fillStyle = mainColor;
        _ctx.fill();

        _ctx.beginPath();
        _ctx.arc(s(this.x - 1.5), s(this.y + bob - 1.5), s(this.r * 0.4), 0, Math.PI * 2);
        _ctx.fillStyle = 'rgba(255,255,255,0.5)';
        _ctx.fill();

        _ctx.fillStyle = '#fff';
        _ctx.font = `bold ${s(8)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillText(this.type === 'oxygen' ? 'O₂' : this.type === 'fuel' ? '⛽' : '+',
            s(this.x), s(this.y + bob + 0.5));

        if (this.lifetime < 2 && Math.sin(time * 12) > 0) {
            _ctx.beginPath();
            _ctx.arc(s(this.x), s(this.y + bob), s(this.r + 1), 0, Math.PI * 2);
            _ctx.strokeStyle = '#fff';
            _ctx.lineWidth = s(1);
            _ctx.stroke();
        }
    }
}

// ---- WARNING ----
export class Warning {
    constructor(x) { this.x = x; this.life = 1.5; this.maxLife = 1.5; }
    update(dt) { this.life -= dt; }
    draw(time) {
        _ctx.globalAlpha = 0.3 + 0.3 * Math.sin(time * 10);
        _ctx.fillStyle = '#ff0';
        _ctx.font = `bold ${s(14)}px Courier New`;
        _ctx.textAlign = 'center';
        _ctx.fillText('⚠', s(this.x), s(25));
        _ctx.globalAlpha = 1;
    }
}
