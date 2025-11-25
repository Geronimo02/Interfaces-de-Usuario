class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.shouldRemove = false;
        
        // Movement
        this.speed = 3;
        this.floatAmplitude = 10;
        this.animationTimer = 0;
        
        // Visual
        this.rotation = 0;
        this.scale = 1;
        this.glowIntensity = 0;
        
        // Effects
        this.collectEffect = [];
        
        this.setType(type);
    }
    
    setType(type) {
        switch (type) {
            case 'crystal':
                this.color = '#00ffff';
                this.value = 5;
                break;
            case 'energy':
                this.color = '#ffff00';
                this.value = 10;
                break;
        }
    }
    
    update(deltaTime) {
        if (this.collected) {
            this.updateCollectEffect(deltaTime);
            return;
        }
        
        this.animationTimer += deltaTime;
        
        // Move left
        this.x -= this.speed;
        
        // Float animation
        this.y += Math.sin(this.animationTimer * 0.005) * 0.5;
        
        // Rotation
        this.rotation += deltaTime * 0.003;
        
        // Scale pulsing
        this.scale = 1 + Math.sin(this.animationTimer * 0.008) * 0.1;
        
        // Remove if off screen
        if (this.x + this.width < 0) {
            this.shouldRemove = true;
        }
    }
    
    collect() {
        this.collected = true;
        this.createCollectEffect();
    }
    
    createCollectEffect() {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.collectEffect.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                velocityX: Math.cos(angle) * 3,
                velocityY: Math.sin(angle) * 3,
                life: 500,
                maxLife: 500,
                size: 3,
                color: this.color
            });
        }
    }
    
    updateCollectEffect(deltaTime) {
        this.collectEffect.forEach(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.life -= deltaTime;
        });
        
        this.collectEffect = this.collectEffect.filter(p => p.life > 0);
        
        if (this.collectEffect.length === 0) {
            this.shouldRemove = true;
        }
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}
