/**
 * OBSTACLE.JS - ENTIDAD DE OBSTÁCULO (TUBO)
 * Clase que representa un tubo espacial (obstáculo)
 * Patrón: Entity Component
 */

class Obstacle {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'top' o 'bottom'
        this.passed = false; // Para contar puntos solo una vez
    }
    
    /**
     * Actualiza la posición del obstáculo
     */
    update(speed) {
        this.x -= speed;
    }
    
    /**
     * Verifica si el obstáculo está fuera de la pantalla
     */
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    /**
     * Verifica colisión con un rectángulo
     */
    checkCollision(px, py, pw, ph) {
        return this.x < px + pw &&
               this.x + this.width > px &&
               this.y < py + ph &&
               this.y + this.height > py;
    }
    
    /**
     * Obtiene el centro X del tubo
     */
    getCenterX() {
        return this.x + this.width / 2;
    }
}
