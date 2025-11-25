class MenuView {
    constructor(gameController) {
        this.gameController = gameController;
        this.selectedShip = 'fighter';
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.menuViews = {
            main: document.getElementById('mainMenu'),
            gameOver: document.getElementById('gameOverView')
        };
        
        this.buttons = {
            start: document.getElementById('startGameBtn'),
            restart: document.getElementById('restartBtn'),
            backToMenu: document.getElementById('backToMenuBtn'),
            instructions: document.getElementById('instructionsBtn')
        };
        
        this.shipOptions = document.querySelectorAll('.ship-option');
        this.finalStats = {
            distance: document.getElementById('finalDistance'),
            crystals: document.getElementById('finalCrystals'),
            enemies: document.getElementById('finalEnemies')
        };
    }
    
    setupEventListeners() {
        // Start game
        this.buttons.start.addEventListener('click', () => {
            this.gameController.startGame(this.selectedShip);
        });
        
        // Restart game
        this.buttons.restart.addEventListener('click', () => {
            this.gameController.restartGame(this.selectedShip);
        });
        
        // Back to menu
        this.buttons.backToMenu.addEventListener('click', () => {
            this.gameController.backToMenu();
        });
        
        // Instructions
        this.buttons.instructions.addEventListener('click', () => {
            this.showInstructions();
        });
        
        // Ship selection
        this.shipOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectShip(option.dataset.ship);
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
    }
    
    selectShip(shipType) {
        this.selectedShip = shipType;
        
        // Update visual selection
        this.shipOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[data-ship="${shipType}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Add selection effect
        this.addShipSelectionEffect(selectedOption);
    }
    
    addShipSelectionEffect(element) {
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transform = '';
        }, 200);
    }
    
    showMenu() {
        this.hideAllViews();
        this.menuViews.main.classList.add('active');
        this.addMenuAnimation();
    }
    
    showGameOver(finalScore) {
        this.hideAllViews();
        
        // Update final stats
        this.finalStats.distance.textContent = Math.floor(finalScore.distance);
        this.finalStats.crystals.textContent = finalScore.crystals;
        this.finalStats.enemies.textContent = finalScore.enemiesDefeated;
        
        this.menuViews.gameOver.classList.add('active');
        this.addGameOverAnimation();
    }
    
    hideAllViews() {
        Object.values(this.menuViews).forEach(view => {
            view.classList.remove('active');
        });
    }
    
    addMenuAnimation() {
        const menuContent = this.menuViews.main.querySelector('.menu-content');
        menuContent.style.transform = 'translateY(50px) scale(0.8)';
        menuContent.style.opacity = '0';
        
        setTimeout(() => {
            menuContent.style.transform = '';
            menuContent.style.opacity = '';
            menuContent.style.transition = 'all 0.5s ease';
        }, 100);
    }
    
    addGameOverAnimation() {
        const gameOverContent = this.menuViews.gameOver.querySelector('.menu-content');
        gameOverContent.style.transform = 'translateY(-50px) scale(1.2)';
        gameOverContent.style.opacity = '0';
        
        setTimeout(() => {
            gameOverContent.style.transform = '';
            gameOverContent.style.opacity = '';
            gameOverContent.style.transition = 'all 0.5s ease';
        }, 100);
    }
    
    showInstructions() {
        const instructionText = `
        🚀 CONTROLES:
        • ESPACIO o CLICK - Impulso
        • SHIFT + ESPACIO - Turbo
        • ESC - Pausa
        
        🎯 OBJETIVO:
        • Vuela lo más lejos posible
        • Recolecta cristales de energía
        • Evita enemigos o usa el escudo
        • Consigue power-ups especiales
        
        💎 OBJETOS:
        • Cristales azules - Puntos
        • Esferas amarillas - Energía
        • Power-ups - Habilidades especiales
        
        ⚔️ ENEMIGOS:
        • Drones - Rápidos pero débiles
        • Interceptores - Agresivos
        • Bombarderos - Lentos pero peligrosos
        `;
        
        alert(instructionText);
    }
    
    handleKeyboardInput(e) {
        switch (e.key) {
            case 'Enter':
                if (this.menuViews.main.classList.contains('active')) {
                    this.gameController.startGame(this.selectedShip);
                } else if (this.menuViews.gameOver.classList.contains('active')) {
                    this.gameController.restartGame(this.selectedShip);
                }
                break;
                
            case 'Escape':
                if (this.menuViews.gameOver.classList.contains('active')) {
                    this.gameController.backToMenu();
                }
                break;
                
            case 'ArrowLeft':
            case 'ArrowRight':
                if (this.menuViews.main.classList.contains('active')) {
                    this.cycleShipSelection(e.key === 'ArrowRight');
                }
                break;
        }
    }
    
    cycleShipSelection(forward) {
        const ships = ['interceptor', 'fighter', 'cruiser'];
        const currentIndex = ships.indexOf(this.selectedShip);
        let newIndex;
        
        if (forward) {
            newIndex = (currentIndex + 1) % ships.length;
        } else {
            newIndex = (currentIndex - 1 + ships.length) % ships.length;
        }
        
        this.selectShip(ships[newIndex]);
    }
    
    updateShipPreview(shipType) {
        // Add visual updates to ship preview if needed
        const preview = document.querySelector(`[data-ship="${shipType}"] .ship-preview`);
        if (preview) {
            preview.style.animation = 'none';
            setTimeout(() => {
                preview.style.animation = '';
            }, 10);
        }
    }
    
    addNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}
