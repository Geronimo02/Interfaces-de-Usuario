/**
 * PARTICLE.JS - ENTIDAD DE PARTÍCULA
 * Clase que representa una partícula del sistema de partículas
 * Patrón: Entity Component
 */

class Particle {
    constructor(x, y, vx, vy, size, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.alpha = 1;
    }
    
    /**
     * Actualiza la partícula
     */
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.alpha = this.life / this.maxLife;
    }
    
    /**
     * Verifica si la partícula debe ser eliminada
     */
    isDead() {
        return this.life <= 0;
    }
}
