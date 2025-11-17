/**
 * PowerUp.js
 * Tipos: shield (invulnerabilidad), slow (ralentiza juego temporalmente)
 */
class PowerUp {
    constructor(x, y, kind) {
        const cfg = GameConfig.POWERUPS[kind];
        this.kind = kind;
        this.x = x;
        this.y = y;
        this.size = cfg.SIZE;
        this.duration = cfg.DURATION; // frames efecto
        this.active = false; // recogido y en curso
        this.collected = false;
        this.id = Math.random();
        this.floatOffset = 0;
    }

    update(speed, frameCount) {
        this.x -= speed;
        this.floatOffset = Math.sin(frameCount * 0.05 + this.id) * 10;
    }

    isOffScreen() { return this.x + this.size < 0; }

    getDisplayY() { return this.y + this.floatOffset; }

    checkCollision(px, py, radius) {
        const dx = this.x - px;
        const dy = this.getDisplayY() - py;
        const dist = Math.sqrt(dx*dx + dy*dy);
        return dist < this.size + radius;
    }
}
