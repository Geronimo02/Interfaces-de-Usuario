class Player {
    constructor(x, y, shipType) {
        this.x = x;
        this.y = y;
        this.shipType = shipType;
        this.width = 50;
        this.height = 35;
        
        // Flappy Bird physics
        this.velocityY = 0;
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.maxFallSpeed = 10;
        
        // Visual
        this.rotation = 0;
        this.flapAnimation = 0;
        this.thrusterParticles = [];
        this.animationTimer = 0;
        
        // Animation states
        this.animationState = 'normal'; // normal, flapping, exploding
        this.isExploding = false;
        this.explosionTimer = 0;
        this.explosionDuration = 1000;
    }
    
    update(deltaTime) {
        this.animationTimer += deltaTime;
        
        // Apply gravity
        this.velocityY += this.gravity;
        if (this.velocityY > this.maxFallSpeed) {
            this.velocityY = this.maxFallSpeed;
        }
        
        // Update position
        this.y += this.velocityY;
        
        // Update rotation based on velocity (Flappy Bird style)
        this.rotation = Math.max(-25, Math.min(90, this.velocityY * 3));
        
        // Update flap animation
        if (this.flapAnimation > 0) {
            this.flapAnimation -= deltaTime;
        }
        
        // Update thruster particles
        this.updateThrusterParticles(deltaTime);
        
        if (this.isExploding) {
            this.explosionTimer += deltaTime;
            if (this.explosionTimer >= this.explosionDuration) {
                // Explosion finished
                return false;
            }
        }
        
        // Reset animation state
        if (this.flapAnimation <= 0 && this.animationState === 'flapping') {
            this.animationState = 'normal';
        }
        
        return true;
    }
    
    flap() {
        this.velocityY = this.jumpForce;
        this.flapAnimation = 300;
        this.animationState = 'flapping';
        this.createThrusterParticles();
        
        // Trigger CSS animation
        this.triggerFlapAnimation();
    }
    
    triggerFlapAnimation() {
        if (this.shipElement) {
            this.shipElement.style.animation = 'none';
            setTimeout(() => {
                this.shipElement.style.animation = 'shipFlap 0.3s ease-out';
            }, 10);
        }
    }
    
    explode() {
        this.isExploding = true;
        this.animationState = 'exploding';
        this.explosionTimer = 0;
        this.createExplosionParticles();
        this.triggerExplosionAnimation();
    }
    
    triggerExplosionAnimation() {
        if (this.shipElement) {
            this.shipElement.style.animation = 'shipExplosion 1s ease-out forwards';
        }
    }
    
    activateShield(duration) {
        this.hasShield = true;
        this.shieldTimer = duration;
    }
    
    createExplosionParticles() {
        for (let i = 0; i < 20; i++) {
            this.thrusterParticles.push({
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                velocityX: (Math.random() - 0.5) * 10,
                velocityY: (Math.random() - 0.5) * 10,
                life: 800,
                maxLife: 800,
                size: Math.random() * 6 + 2,
                color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00'
            });
        }
    }
    
    updateThrusterParticles(deltaTime) {
        this.thrusterParticles.forEach(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.life -= deltaTime;
        });
        
        this.thrusterParticles = this.thrusterParticles.filter(p => p.life > 0);
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}
