/**
 * GEM.JS - ENTIDAD DE GEMA
 * Clase que representa una gema coleccionable (da vidas)
 * Patrón: Entity Component
 */

class Gem {
    constructor(x, y) {
        const config = GameConfig.GEMS;
        this.x = x;
        this.y = y;
        this.size = config.SIZE;
        this.points = config.POINTS;
        this.floatOffset = 0;
        this.id = Math.random();
        this.collected = false;
    }
    
    /**
     * Actualiza la gema
     */
    update(speed, frameCount) {
        this.x -= speed;
        const config = GameConfig.GEMS;
        this.floatOffset = Math.sin(frameCount * config.FLOAT_SPEED + this.id) * config.FLOAT_AMPLITUDE;
    }
    
    /**
     * Verifica si está fuera de la pantalla
     */
    isOffScreen() {
        return this.x + this.size < 0;
    }
    
    /**
     * Verifica colisión circular
     */
    checkCollision(px, py, radius) {
        const dx = this.x - px;
        const dy = (this.y + this.floatOffset) - py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size + radius;
    }
    
    /**
     * Obtiene la posición Y con el offset de flotación
     */
    getDisplayY() {
        return this.y + this.floatOffset;
    }
}
