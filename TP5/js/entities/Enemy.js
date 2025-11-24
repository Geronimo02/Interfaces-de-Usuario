/**
 * ENEMY.JS - ENTIDAD DE ENEMIGO
 * Clase que representa enemigos voladores con diferentes comportamientos
 * Tipos: 'drone', 'meteor', 'alien'
 */

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'drone', 'meteor', 'alien'
        this.width = 40;
        this.height = 40;
        this.destroyed = false;
        
        // Configuración según tipo
        this.setupByType();
    }
    
    /**
     * Configura propiedades según el tipo de enemigo
     */
    setupByType() {
        const config = GameConfig.ENEMIES;
        
        switch(this.type) {
            case 'drone':
                // Drone: se mueve recto, rápido
                this.speed = config.DRONE_SPEED;
                this.size = config.DRONE_SIZE;
                this.health = 1;
                this.movePattern = 'straight';
                this.damage = 1;
                this.points = config.DRONE_POINTS;
                break;
                
            case 'meteor':
                // Meteoro: se mueve rápido y rota
                this.speed = config.METEOR_SPEED;
                this.size = config.METEOR_SIZE;
                this.health = 2;
                this.movePattern = 'straight';
                this.rotation = Math.random() * 360;
                this.rotationSpeed = 5;
                this.damage = 2;
                this.points = config.METEOR_POINTS;
                break;
                
            case 'alien':
                // Alien: se mueve en onda
                this.speed = config.ALIEN_SPEED;
                this.size = config.ALIEN_SIZE;
                this.health = 1;
                this.movePattern = 'wave';
                this.waveAmplitude = 50;
                this.waveFrequency = 0.05;
                this.waveOffset = Math.random() * Math.PI * 2;
                this.damage = 1;
                this.points = config.ALIEN_POINTS;
                break;
        }
        
        this.width = this.size;
        this.height = this.size;
        this.initialY = this.y;
    }
    
    /**
     * Actualiza el enemigo
     */
    update(frameCount) {
        // Movimiento horizontal
        this.x -= this.speed;
        
        // Patrón de movimiento específico
        switch(this.movePattern) {
            case 'straight':
                // Sin movimiento vertical
                if (this.type === 'meteor') {
                    this.rotation = (this.rotation + this.rotationSpeed) % 360;
                }
                break;
                
            case 'wave':
                // Movimiento ondulatorio
                this.y = this.initialY + Math.sin(frameCount * this.waveFrequency + this.waveOffset) * this.waveAmplitude;
                break;
        }
    }
    
    /**
     * Verifica si está fuera de la pantalla
     */
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    /**
     * Verifica colisión circular
     */
    checkCollision(px, py, radius) {
        const dx = (this.x + this.width / 2) - px;
        const dy = (this.y + this.height / 2) - py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.size / 2) + radius;
    }
    
    /**
     * Recibe daño
     */
    takeDamage(amount = 1) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroyed = true;
        }
        return this.destroyed;
    }
    
    /**
     * Obtiene el centro del enemigo
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}
