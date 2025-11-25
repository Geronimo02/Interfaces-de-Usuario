class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, gameOver
        
        // Game objects
        this.bird = new Bird(100, 300);
        this.pipes = [];
        this.bonusItems = [];
        this.animatedElements = [];
        
        // Game variables
        this.score = 0;
        this.gameSpeed = 2;
        this.lastTime = 0;
        this.pipeSpawnTimer = 0;
        this.bonusSpawnTimer = 0;
        
        this.initializeEventListeners();
        this.createAnimatedElements();
        this.gameLoop();
    }
    
    initializeEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });
        
        // Mouse/touch controls
        this.canvas.addEventListener('click', () => this.handleInput());
        
        // Menu buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    }
    
    handleInput() {
        if (this.gameState === 'playing') {
            this.bird.flap();
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('gameMenu').style.display = 'none';
        this.resetGame();
    }
    
    restartGame() {
        this.gameState = 'playing';
        document.getElementById('gameOver').style.display = 'none';
        this.resetGame();
    }
    
    resetGame() {
        this.bird = new Bird(100, 300);
        this.pipes = [];
        this.bonusItems = [];
        this.score = 0;
        this.pipeSpawnTimer = 0;
        this.bonusSpawnTimer = 0;
        this.updateScore();
    }
    
    createAnimatedElements() {
        // Create animated background elements (clouds, birds, etc.)
        for (let i = 0; i < 5; i++) {
            this.animatedElements.push(new AnimatedCloud(Math.random() * 800, Math.random() * 200));
        }
        
        for (let i = 0; i < 3; i++) {
            this.animatedElements.push(new AnimatedBird(Math.random() * 800, Math.random() * 300));
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update bird
        this.bird.update(deltaTime);
        
        // Spawn pipes
        this.pipeSpawnTimer += deltaTime;
        if (this.pipeSpawnTimer > 1500) {
            this.spawnPipe();
            this.pipeSpawnTimer = 0;
        }
        
        // Spawn bonus items
        this.bonusSpawnTimer += deltaTime;
        if (this.bonusSpawnTimer > 3000) {
            this.spawnBonusItem();
            this.bonusSpawnTimer = 0;
        }
        
        // Update pipes
        this.pipes.forEach(pipe => pipe.update(deltaTime));
        this.pipes = this.pipes.filter(pipe => !pipe.shouldRemove);
        
        // Update bonus items
        this.bonusItems.forEach(item => item.update(deltaTime));
        this.bonusItems = this.bonusItems.filter(item => !item.shouldRemove);
        
        // Update animated elements
        this.animatedElements.forEach(element => element.update(deltaTime));
        
        // Check collisions
        this.checkCollisions();
        
        // Check if bird is out of bounds
        if (this.bird.y > this.canvas.height || this.bird.y < 0) {
            this.gameOver();
        }
    }
    
    spawnPipe() {
        const gap = 150;
        const minHeight = 50;
        const maxHeight = this.canvas.height - gap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push(new Pipe(this.canvas.width, topHeight, gap));
    }
    
    spawnBonusItem() {
        this.bonusItems.push(new BonusItem(
            this.canvas.width,
            Math.random() * (this.canvas.height - 100) + 50
        ));
    }
    
    checkCollisions() {
        // Check pipe collisions
        this.pipes.forEach(pipe => {
            if (this.bird.collidesWith(pipe.topRect) || this.bird.collidesWith(pipe.bottomRect)) {
                this.bird.explode();
                this.gameOver();
            }
            
            // Score when passing pipe
            if (!pipe.scored && pipe.x + pipe.width < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.updateScore();
            }
        });
        
        // Check bonus item collisions
        this.bonusItems.forEach(item => {
            if (this.bird.collidesWith(item)) {
                item.collect();
                this.score += 5;
                this.updateScore();
            }
        });
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render animated elements
        this.animatedElements.forEach(element => element.render(this.ctx));
        
        // Render pipes
        this.pipes.forEach(pipe => pipe.render(this.ctx));
        
        // Render bonus items
        this.bonusItems.forEach(item => item.render(this.ctx));
        
        // Render bird
        this.bird.render(this.ctx);
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

class Bird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.gravity = 0.5;
        this.jumpForce = -10;
        this.width = 30;
        this.height = 25;
        this.angle = 0;
        this.isExploding = false;
        this.flapAnimation = 0;
    }
    
    update(deltaTime) {
        if (this.isExploding) return;
        
        this.velocity += this.gravity;
        this.y += this.velocity;
        
        // Update angle based on velocity
        this.angle = Math.min(Math.max(this.velocity * 3, -30), 90);
        
        // Update flap animation
        this.flapAnimation = Math.max(0, this.flapAnimation - deltaTime);
    }
    
    flap() {
        if (this.isExploding) return;
        
        this.velocity = this.jumpForce;
        this.flapAnimation = 300; // Animation duration in ms
    }
    
    explode() {
        this.isExploding = true;
    }
    
    collidesWith(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.angle * Math.PI / 180);
        
        if (this.isExploding) {
            // Explosion effect
            ctx.fillStyle = '#ff6b6b';
            ctx.globalAlpha = 0.7;
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                const x = Math.cos(angle) * 15;
                const y = Math.sin(angle) * 15;
                ctx.fillRect(x, y, 5, 5);
            }
        } else {
            // Draw bird with flap animation
            const scale = this.flapAnimation > 0 ? 1.1 : 1;
            ctx.scale(scale, scale);
            
            // Bird body
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            
            // Wing animation
            if (this.flapAnimation > 150) {
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(-this.width/3, -this.height/3, this.width/2, this.height/3);
            }
            
            // Eye
            ctx.fillStyle = 'black';
            ctx.fillRect(this.width/4 - this.width/2, -this.height/4, 4, 4);
        }
        
        ctx.restore();
    }
}

class Pipe {
    constructor(x, topHeight, gap) {
        this.x = x;
        this.topHeight = topHeight;
        this.gap = gap;
        this.width = 50;
        this.speed = 2;
        this.shouldRemove = false;
        this.scored = false;
        
        this.topRect = {
            x: this.x,
            y: 0,
            width: this.width,
            height: this.topHeight
        };
        
        this.bottomRect = {
            x: this.x,
            y: this.topHeight + this.gap,
            width: this.width,
            height: 600 - (this.topHeight + this.gap)
        };
    }
    
    update(deltaTime) {
        this.x -= this.speed;
        this.topRect.x = this.x;
        this.bottomRect.x = this.x;
        
        if (this.x + this.width < 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        // Top pipe
        ctx.fillStyle = '#228B22';
        ctx.fillRect(this.topRect.x, this.topRect.y, this.topRect.width, this.topRect.height);
        
        // Bottom pipe
        ctx.fillRect(this.bottomRect.x, this.bottomRect.y, this.bottomRect.width, this.bottomRect.height);
        
        // Pipe caps
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(this.x - 5, this.topHeight - 20, this.width + 10, 20);
        ctx.fillRect(this.x - 5, this.topHeight + this.gap, this.width + 10, 20);
    }
}

class BonusItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.shouldRemove = false;
        this.collected = false;
        this.rotation = 0;
        this.floatOffset = 0;
    }
    
    update(deltaTime) {
        this.x -= this.speed;
        this.rotation += deltaTime * 0.005;
        this.floatOffset += deltaTime * 0.003;
        
        if (this.x + this.width < 0) {
            this.shouldRemove = true;
        }
        
        if (this.collected) {
            this.shouldRemove = true;
        }
    }
    
    collect() {
        this.collected = true;
    }
    
    render(ctx) {
        if (this.collected) return;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2 + Math.sin(this.floatOffset) * 5);
        ctx.rotate(this.rotation);
        
        // Draw star-shaped bonus
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            const innerAngle = ((i + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
            const innerX = Math.cos(innerAngle) * 5;
            const innerY = Math.sin(innerAngle) * 5;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

class AnimatedCloud {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 0.5 + Math.random() * 0.5;
        this.scale = 0.5 + Math.random() * 0.5;
    }
    
    update(deltaTime) {
        this.x -= this.speed;
        if (this.x < -100) {
            this.x = 900;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = 'white';
        ctx.scale(this.scale, this.scale);
        
        // Simple cloud shape
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        ctx.arc(this.x + 20, this.y, 25, 0, Math.PI * 2);
        ctx.arc(this.x + 40, this.y, 20, 0, Math.PI * 2);
        ctx.arc(this.x + 20, this.y - 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class AnimatedBird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 1 + Math.random();
        this.wingFlap = 0;
        this.amplitude = 20 + Math.random() * 20;
        this.frequency = 0.002 + Math.random() * 0.003;
    }
    
    update(deltaTime) {
        this.x -= this.speed;
        this.wingFlap += deltaTime * 0.01;
        
        if (this.x < -50) {
            this.x = 850;
            this.y = Math.random() * 300;
        }
    }
    
    render(ctx) {
        const currentY = this.y + Math.sin(this.x * this.frequency) * this.amplitude;
        
        ctx.save();
        ctx.fillStyle = '#8B4513';
        ctx.globalAlpha = 0.8;
        
        // Bird body
        ctx.fillRect(this.x, currentY, 15, 8);
        
        // Wing animation
        const wingOffset = Math.sin(this.wingFlap) * 3;
        ctx.fillRect(this.x + 3, currentY - 2 + wingOffset, 8, 4);
        
        ctx.restore();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new FlappyBirdGame();
});
