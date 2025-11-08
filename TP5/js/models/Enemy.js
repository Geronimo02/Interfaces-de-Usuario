class Enemy {
    constructor(x, y, type, difficulty = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.difficulty = difficulty;
        this.destroyed = false;
        this.shouldRemove = false;
        
        this.setEnemyStats(type);
        
        // Movement
        this.velocityX = -this.speed;
        this.velocityY = 0;
        this.patrolAmplitude = 50;
        this.patrolFrequency = 0.002;
        this.initialY = y;
        
        // Visual effects
        this.rotation = 0;
        this.animationTimer = 0;
        this.explosionParticles = [];
        
        // AI behavior
        this.behaviorTimer = 0;
        this.targetY = y;
    }
    
    setEnemyStats(type) {
        switch (type) {
            case 'drone':
                this.width = 30;
                this.height = 20;
                this.health = 20;
                this.damage = 15;
                this.speed = 3;
                this.color = '#ff6b35';
                break;
            case 'interceptor':
                this.width = 40;
                this.height = 25;
                this.health = 40;
                this.damage = 25;
                this.speed = 4;
                this.color = '#dc2626';
                break;
            case 'bomber':
                this.width = 50;
                this.height = 35;
                this.health = 60;
                this.damage = 40;
                this.speed = 2;
                this.color = '#7c2d12';
                break;
        }
        
        // Scale with difficulty
        this.health *= this.difficulty;
        this.speed += this.difficulty * 0.5;
    }
    
    update(deltaTime) {
        if (this.destroyed) {
            this.updateExplosion(deltaTime);
            return;
        }
        
        this.animationTimer += deltaTime;
        this.behaviorTimer += deltaTime;
        
        // Update AI behavior
        this.updateBehavior(deltaTime);
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Update rotation for visual effect
        this.rotation += deltaTime * 0.001;
        
        // Remove if off screen
        if (this.x + this.width < 0) {
            this.shouldRemove = true;
        }
        
        // Check explosion completion
        if (this.destroyed && this.explosionParticles.length === 0) {
            this.shouldRemove = true;
        }
    }
    
    updateBehavior(deltaTime) {
        switch (this.type) {
            case 'drone':
                this.updateDroneBehavior(deltaTime);
                break;
            case 'interceptor':
                this.updateInterceptorBehavior(deltaTime);
                break;
            case 'bomber':
                this.updateBomberBehavior(deltaTime);
                break;
        }
    }
    
    updateDroneBehavior(deltaTime) {
        // Simple patrol pattern
        this.y = this.initialY + Math.sin(this.x * this.patrolFrequency) * this.patrolAmplitude;
    }
    
    updateInterceptorBehavior(deltaTime) {
        // Aggressive zigzag pattern
        if (this.behaviorTimer > 1000) {
            this.targetY = this.initialY + (Math.random() - 0.5) * 200;
            this.behaviorTimer = 0;
        }
        
        const deltaY = this.targetY - this.y;
        this.velocityY = deltaY * 0.002;
    }
    
    updateBomberBehavior(deltaTime) {
        // Slow, steady movement with slight wobble
        this.y = this.initialY + Math.sin(this.animationTimer * 0.001) * 20;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        this.destroyed = true;
        this.createExplosionParticles();
    }
    
    createExplosionParticles() {
        const particleCount = this.type === 'bomber' ? 15 : 10;
        
        for (let i = 0; i < particleCount; i++) {
            this.explosionParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                velocityX: (Math.random() - 0.5) * 8,
                velocityY: (Math.random() - 0.5) * 8,
                life: 1000 + Math.random() * 500,
                maxLife: 1000,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#ff6600' : '#ffaa00'
            });
        }
    }
    
    updateExplosion(deltaTime) {
        this.explosionParticles.forEach(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityX *= 0.98;
            particle.velocityY *= 0.98;
            particle.life -= deltaTime;
            particle.size *= 0.995;
        });
        
        this.explosionParticles = this.explosionParticles.filter(p => p.life > 0 && p.size > 0.5);
    }
}

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.shouldRemove = false;
        
        switch (type) {
            case 'explosion':
                this.velocityX = (Math.random() - 0.5) * 10;
                this.velocityY = (Math.random() - 0.5) * 10;
                this.life = 800;
                this.color = '#ff6600';
                this.size = 3;
                break;
            case 'thruster':
                this.velocityX = -5 - Math.random() * 3;
                this.velocityY = (Math.random() - 0.5) * 2;
                this.life = 300;
                this.color = '#00aaff';
                this.size = 2;
                break;
        }
        
        this.maxLife = this.life;
    }
    
    update(deltaTime) {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.life -= deltaTime;
        this.size *= 0.98;
        
        if (this.life <= 0 || this.size < 0.5) {
            this.shouldRemove = true;
        }
    }
}

class SpacePipeObstacle {
    constructor(x, topHeight, gap, difficulty = 1) {
        this.x = x;
        this.topHeight = topHeight;
        this.gap = gap;
        this.difficulty = difficulty;
        this.type = 'pipe';
        this.width = 80;
        this.speed = 3 + difficulty * 0.5;
        this.destroyed = false;
        this.shouldRemove = false;
        this.scored = false;
        
        // Create collision rectangles
        this.topPart = {
            x: this.x,
            y: 0,
            width: this.width,
            height: this.topHeight
        };
        
        this.bottomPart = {
            x: this.x,
            y: this.topHeight + this.gap,
            width: this.width,
            height: 700 - (this.topHeight + this.gap)
        };
        
        // Visual effects
        this.animationTimer = 0;
        this.energyPulse = 0;
        this.sparks = [];
        
        // Create initial sparks
        this.createSparks();
    }
    
    update(deltaTime) {
        this.animationTimer += deltaTime;
        this.energyPulse = Math.sin(this.animationTimer * 0.003) * 0.5 + 0.5;
        
        // Move obstacle
        this.x -= this.speed;
        this.topPart.x = this.x;
        this.bottomPart.x = this.x;
        
        // Update sparks
        this.updateSparks(deltaTime);
        
        // Create new sparks occasionally
        if (this.animationTimer % 500 < deltaTime) {
            this.createSparks();
        }
        
        // Remove if off screen
        if (this.x + this.width < -100) {
            this.shouldRemove = true;
        }
    }
    
    createSparks() {
        // Sparks at the gap edges
        const sparkPositions = [
            { x: this.x + this.width/2, y: this.topHeight },
            { x: this.x + this.width/2, y: this.topHeight + this.gap }
        ];
        
        sparkPositions.forEach(pos => {
            for (let i = 0; i < 3; i++) {
                this.sparks.push({
                    x: pos.x + (Math.random() - 0.5) * 20,
                    y: pos.y + (Math.random() - 0.5) * 10,
                    velocityX: (Math.random() - 0.5) * 2,
                    velocityY: (Math.random() - 0.5) * 2,
                    life: 800 + Math.random() * 400,
                    maxLife: 1000,
                    size: 2 + Math.random() * 2,
                    color: Math.random() > 0.5 ? '#00ffff' : '#ffff00'
                });
            }
        });
    }
    
    updateSparks(deltaTime) {
        this.sparks.forEach(spark => {
            spark.x += spark.velocityX;
            spark.y += spark.velocityY;
            spark.life -= deltaTime;
            spark.size *= 0.998;
        });
        
        this.sparks = this.sparks.filter(s => s.life > 0 && s.size > 0.5);
    }
}

class SpaceDebris extends Enemy {
    constructor(x, y, difficulty = 1) {
        super(x, y, 'debris', difficulty);
        this.width = 25;
        this.height = 25;
        this.health = 10;
        this.damage = 10;
        this.speed = 2 + difficulty;
        this.color = '#666';
        
        // Spinning movement
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
        this.wobbleAmplitude = 30;
        this.wobbleFrequency = 0.002;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Add wobbling movement
        this.y = this.initialY + Math.sin(this.x * this.wobbleFrequency) * this.wobbleAmplitude;
        this.rotation += this.rotationSpeed * deltaTime;
    }
}
