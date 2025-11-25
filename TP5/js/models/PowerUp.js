class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 25;
        this.height = 25;
        this.collected = false;
        this.shouldRemove = false;
        
        // Movement
        this.speed = 3;
        this.floatAmplitude = 15;
        this.animationTimer = 0;
        
        // Visual
        this.rotation = 0;
        this.pulseScale = 1;
        
        this.setType(type);
    }
    
    setType(type) {
        switch (type) {
            case 'shield':
                this.color = '#00ffff';
                this.symbol = '🛡️';
                break;
            case 'slowTime':
                this.color = '#ffff00';
                this.symbol = '⏰';
                break;
            case 'extraLife':
                this.color = '#ff0066';
                this.symbol = '❤️';
                break;
        }
    }
    
    update(deltaTime) {
        if (this.collected) {
            this.shouldRemove = true;
            return;
        }
        
        this.animationTimer += deltaTime;
        
        // Movement
        this.x -= this.speed;
        this.y += Math.sin(this.animationTimer * 0.005) * 0.3;
        
        // Rotation
        this.rotation += deltaTime * 0.002;
        
        // Pulse animation
        this.pulseScale = 1 + Math.sin(this.animationTimer * 0.008) * 0.2;
        
        // Remove if off screen
        if (this.x + this.width < 0) {
            this.shouldRemove = true;
        }
    }
    
    collect() {
        this.collected = true;
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class BonusItem {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.shouldRemove = false;
        this.value = 25;
        
        // Movement
        this.speed = 3;
        this.animationTimer = 0;
        
        // Visual
        this.color = '#ffaa00';
        this.glowIntensity = 0;
    }
    
    update(deltaTime) {
        if (this.collected) {
            this.shouldRemove = true;
            return;
        }
        
        this.animationTimer += deltaTime;
        
        // Movement
        this.x -= this.speed;
        
        // Bouncing animation
        this.y += Math.sin(this.animationTimer * 0.01) * 2;
        
        // Glow effect
        this.glowIntensity = Math.sin(this.animationTimer * 0.006) * 0.5 + 0.5;
        
        // Remove if off screen
        if (this.x + this.width < 0) {
            this.shouldRemove = true;
        }
    }
    
    collect() {
        this.collected = true;
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}
