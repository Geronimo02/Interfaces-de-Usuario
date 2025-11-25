class GameModel {
    constructor() {
        this.gameState = 'menu'; // menu, playing, gameOver
        this.score = 0;
        this.lives = 3;
        this.player = null;
        this.pipes = [];
        this.collectibles = [];
        
        // Flappy Bird settings
        this.pipeSpawnTimer = 0;
        this.pipeSpawnRate = 1800; // 1.8 seconds
        this.gameSpeed = 3;
        this.worldBounds = { width: 1200, height: 700 };
        
        // Nuevos elementos de interacción
        this.powerUps = [];
        this.timeLimit = 120; // 2 minutos límite
        this.gameTimer = 0;
        this.bonusItems = [];
        
        this.observers = [];
    }
    
    // Observer pattern para comunicación con vistas
    addObserver(observer) {
        this.observers.push(observer);
    }
    
    notifyObservers(event, data) {
        this.observers.forEach(observer => {
            if (observer.onGameEvent) {
                observer.onGameEvent(event, data);
            }
        });
    }
    
    initializeGame(selectedShip) {
        this.player = new Player(150, 350, selectedShip);
        this.pipes = [];
        this.collectibles = [];
        this.score = 0;
        this.lives = 3;
        this.gameState = 'playing';
        this.pipeSpawnTimer = 0;
        
        this.notifyObservers('gameStarted', { ship: selectedShip });
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update timer
        this.gameTimer += deltaTime;
        
        // Check time limit
        if (this.gameTimer >= this.timeLimit * 1000) {
            this.gameOver();
            return;
        }
        
        // Update player
        this.player.update(deltaTime);
        
        // Check boundaries (game over if hit top/bottom)
        if (this.player.y < 0 || this.player.y + this.player.height > this.worldBounds.height) {
            this.gameOver();
            return;
        }
        
        // Spawn pipes
        this.pipeSpawnTimer += deltaTime;
        if (this.pipeSpawnTimer > this.pipeSpawnRate) {
            this.spawnPipePair();
            this.pipeSpawnTimer = 0;
        }
        
        // Update pipes
        this.pipes.forEach(pipe => pipe.update(deltaTime));
        this.pipes = this.pipes.filter(pipe => !pipe.shouldRemove);
        
        // Update collectibles
        this.collectibles.forEach(item => item.update(deltaTime));
        this.collectibles = this.collectibles.filter(item => !item.shouldRemove);
        
        // Update power-ups
        this.powerUps.forEach(powerUp => powerUp.update(deltaTime));
        this.powerUps = this.powerUps.filter(p => !p.shouldRemove);
        
        // Update bonus items
        this.bonusItems.forEach(item => item.update(deltaTime));
        this.bonusItems = this.bonusItems.filter(b => !b.shouldRemove);
        
        // Check collisions
        this.checkCollisions();
        
        this.notifyObservers('gameUpdate', {
            score: this.score,
            lives: this.lives,
            player: this.player
        });
    }
    
    spawnPipePair() {
        const gap = 200; // Gap size between pipes
        const minTopHeight = 80;
        const maxTopHeight = this.worldBounds.height - gap - 80;
        const topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;
        
        this.pipes.push(new SpacePipe(this.worldBounds.width, 0, topHeight, true)); // Top pipe
        this.pipes.push(new SpacePipe(this.worldBounds.width, topHeight + gap, this.worldBounds.height - (topHeight + gap), false)); // Bottom pipe
        
        // Sometimes spawn collectible in the gap
        if (Math.random() < 0.3) {
            this.collectibles.push(new Collectible(
                this.worldBounds.width + 50,
                topHeight + gap/2,
                'crystal'
            ));
        }
        
        // A veces spawear power-ups
        if (Math.random() < 0.15) {
            const powerUpTypes = ['shield', 'slowTime', 'extraLife'];
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            this.powerUps.push(new PowerUp(
                this.worldBounds.width + 60,
                topHeight + gap/2 + (Math.random() - 0.5) * 60,
                randomType
            ));
        }
        
        // Spawear bonus items ocasionalmente
        if (Math.random() < 0.2) {
            this.bonusItems.push(new BonusItem(
                this.worldBounds.width + 100,
                topHeight + gap/2,
                'energyBoost'
            ));
        }
    }
    
    checkCollisions() {
        // Check pipe collisions
        this.pipes.forEach(pipe => {
            if (this.player.collidesWith(pipe)) {
                this.handlePipeCollision();
            }
            
            // Score when passing pipe
            if (!pipe.scored && pipe.x + pipe.width < this.player.x) {
                pipe.scored = true;
                if (pipe.isTop) { // Only count once per pipe pair
                    this.score++;
                    this.notifyObservers('scored', { score: this.score });
                }
            }
        });
        
        // Check collectible collisions
        this.collectibles.forEach(item => {
            if (this.player.collidesWith(item) && !item.collected) {
                item.collect();
                this.score += 5;
                this.notifyObservers('collectiblePickup', { type: item.type });
            }
        });
        
        // Check power-up collisions
        this.powerUps.forEach(powerUp => {
            if (this.player.collidesWith(powerUp) && !powerUp.collected) {
                this.handlePowerUpCollection(powerUp);
            }
        });
        
        // Check bonus item collisions
        this.bonusItems.forEach(item => {
            if (this.player.collidesWith(item) && !item.collected) {
                this.handleBonusCollection(item);
            }
        });
    }
    
    handlePipeCollision() {
        this.player.explode();
        this.lives--;
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn after explosion
            setTimeout(() => {
                this.player = new Player(150, 350, this.player.shipType);
            }, 1500);
        }
    }
    
    handlePowerUpCollection(powerUp) {
        powerUp.collect();
        
        switch (powerUp.type) {
            case 'shield':
                this.player.activateShield(5000);
                break;
            case 'slowTime':
                this.activateSlowMotion(3000);
                break;
            case 'extraLife':
                this.lives++;
                break;
        }
        
        this.notifyObservers('powerUpCollected', { type: powerUp.type });
    }
    
    handleBonusCollection(item) {
        item.collect();
        this.score += item.value;
        this.notifyObservers('bonusCollected', { value: item.value });
    }
    
    getRemainingTime() {
        return Math.max(0, this.timeLimit - this.gameTimer / 1000);
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.notifyObservers('gameOver', { finalScore: this.score });
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.notifyObservers('gamePaused');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.notifyObservers('gameResumed');
        }
    }
    
    resetGame() {
        this.gameState = 'menu';
        this.player = null;
        this.pipes = [];
        this.collectibles = [];
        this.score = 0;
        this.lives = 3;
        this.pipeSpawnTimer = 0;
    }
}
