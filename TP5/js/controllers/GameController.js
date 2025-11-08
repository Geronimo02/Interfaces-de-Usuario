class GameController {
    constructor() {
        this.gameModel = new GameModel();
        this.canvas = document.getElementById('gameCanvas');
        this.gameView = new GameView(this.canvas, this.gameModel);
        this.menuView = new MenuView(this);
        this.inputController = new InputController(this);
        this.parallaxManager = new ParallaxManager();
        
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game state
        this.isPaused = false;
        
        this.initializeGame();
        this.startGameLoop();
    }
    
    initializeGame() {
        // Show initial menu
        this.menuView.showMenu();
        
        // Add game model observer
        this.gameModel.addObserver(this);
        
        // Initialize parallax
        this.parallaxManager.addDynamicElements();
        
        // Setup canvas
        this.setupCanvas();
    }
    
    setupCanvas() {
        // Handle canvas resizing if needed
        const resizeCanvas = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = 1200;
            this.canvas.height = 700;
        };
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    }
    
    startGame(selectedShip) {
        this.gameModel.initializeGame(selectedShip);
        this.menuView.hideAllViews();
        this.isRunning = true;
        this.isPaused = false;
        
        // Show HUD
        document.getElementById('gameHUD').style.display = 'block';
    }
    
    restartGame(selectedShip) {
        this.gameModel.resetGame();
        this.startGame(selectedShip);
    }
    
    backToMenu() {
        this.isRunning = false;
        this.gameModel.resetGame();
        this.menuView.showMenu();
        
        // Hide HUD
        document.getElementById('gameHUD').style.display = 'none';
    }
    
    pauseGame() {
        if (this.gameModel.gameState === 'playing') {
            this.isPaused = true;
            this.gameModel.pauseGame();
            this.showPauseMenu();
        }
    }
    
    resumeGame() {
        this.isPaused = false;
        this.gameModel.resumeGame();
        this.hidePauseMenu();
    }
    
    showPauseMenu() {
        // Create pause overlay
        const pauseOverlay = document.createElement('div');
        pauseOverlay.id = 'pauseOverlay';
        pauseOverlay.className = 'pause-overlay';
        
        pauseOverlay.innerHTML = `
            <div class="pause-content">
                <h2>JUEGO PAUSADO</h2>
                <p>Presiona ESC para continuar</p>
                <button class="pause-button primary" onclick="gameController.resumeGame()">CONTINUAR</button>
                <button class="pause-button secondary" onclick="gameController.backToMenu()">MENÚ PRINCIPAL</button>
            </div>
        `;
        
        document.body.appendChild(pauseOverlay);
    }
    
    hidePauseMenu() {
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) {
            pauseOverlay.remove();
        }
    }
    
    onGameEvent(event, data) {
        switch (event) {
            case 'gameOver':
                this.handleGameOver(data);
                break;
            case 'gamePaused':
                this.isPaused = true;
                break;
            case 'gameResumed':
                this.isPaused = false;
                break;
        }
    }
    
    handleGameOver(data) {
        this.isRunning = false;
        
        // Hide HUD
        document.getElementById('gameHUD').style.display = 'none';
        
        // Show game over screen after delay
        setTimeout(() => {
            this.menuView.showGameOver(data.finalScore);
        }, 1000);
    }
    
    startGameLoop() {
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game if running and not paused
        if (this.isRunning && !this.isPaused) {
            this.update(this.deltaTime);
        }
        
        // Always render (for pause screen, menus, etc.)
        this.render();
        
        // Continue game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update game model
        this.gameModel.update(deltaTime);
        
        // Update parallax
        this.parallaxManager.update(deltaTime, this.gameModel.gameSpeed);
        
        // Update input
        this.inputController.update(deltaTime);
    }
    
    render() {
        if (this.isRunning) {
            this.gameView.render();
        }
    }
    
    // Input handling methods - simplified for Flappy Bird
    handlePlayerFlap() {
        if (this.gameModel.player && this.gameModel.gameState === 'playing') {
            this.gameModel.player.flap();
            return true;
        }
        return false;
    }
    
    // Debug methods
    getGameState() {
        return {
            gameState: this.gameModel.gameState,
            score: this.gameModel.score,
            playerHealth: this.gameModel.player ? this.gameModel.player.health : 0,
            enemyCount: this.gameModel.enemies.length,
            collectibleCount: this.gameModel.collectibles.length
        };
    }
}
