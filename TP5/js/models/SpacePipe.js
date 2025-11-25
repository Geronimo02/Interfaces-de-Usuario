class SpacePipe {
    constructor(x, y, height, isTop) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = height;
        this.isTop = isTop;
        this.speed = 3;
        this.shouldRemove = false;
        this.scored = false;
        
        // Visual effects
        this.energyPulse = 0;
        this.animationTimer = 0;
    }
    
    update(deltaTime) {
        this.animationTimer += deltaTime;
        this.energyPulse = Math.sin(this.animationTimer * 0.005) * 0.5 + 0.5;
        
        // Move pipe
        this.x -= this.speed;
        
        // Remove if off screen
        if (this.x + this.width < -100) {
            this.shouldRemove = true;
        }
    }
}
