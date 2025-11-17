/**
 * STAR.JS - ENTIDAD DE ESTRELLA
 * Clase que representa una estrella coleccionable
 * Patrón: Entity Component
 */

class Star {
    constructor(x, y) {
        const config = GameConfig.STARS;
        this.x = x;
        this.y = y;
        this.size = config.SIZE;
        this.points = config.POINTS;
        this.rotation = 0;
        this.collected = false;
    }
    
    /**
     * Actualiza la estrella
     */
    update(speed, frameCount) {
        this.x -= speed;
        this.rotation = (this.rotation + 3) % 360;
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
        const dy = this.y - py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size + radius;
    }
}
