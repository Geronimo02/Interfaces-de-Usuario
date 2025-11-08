class InputController {
    constructor(gameController) {
        this.gameController = gameController;
        this.keys = {};
        this.mouseDown = false;
        this.touchActive = false;
        
        // Input state
        this.thrustPressed = false;
        this.lastThrustTime = 0;
        this.thrustCooldown = 100; // Minimum time between thrusts
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Touch events for mobile (with passive option to fix the warning)
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Focus handling
        window.addEventListener('blur', () => this.handleWindowBlur());
        window.addEventListener('focus', () => this.handleWindowFocus());
    }
    
    handleKeyDown(e) {
        if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
            e.preventDefault();
            this.handleFlap();
        }
        
        if (e.code === 'Escape') {
            this.gameController.handlePauseToggle();
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
        // Remove thrust release handling - not needed for Flappy Bird
    }
    
    handleMouseDown(e) {
        if (e.button === 0) { // Left click
            this.handleFlap();
        }
    }
    
    handleMouseUp(e) {
        this.mouseDown = false;
        // Remove thrust release handling - not needed for Flappy Bird
    }
    
    handleTouchStart(e) {
        if (e.target.closest('.game-container')) {
            e.preventDefault();
        }
        this.handleFlap();
    }
    
    handleTouchEnd(e) {
        if (e.target.closest('.game-container')) {
            e.preventDefault();
        }
        this.touchActive = false;
        // Remove thrust release handling - not needed for Flappy Bird
    }
    
    handleFlap() {
        if (this.gameController.gameModel.gameState === 'playing' && this.gameController.gameModel.player) {
            this.gameController.handlePlayerFlap();
        }
    }
    
    handleWindowBlur() {
        // Pause game when window loses focus
        if (this.gameController.gameModel.gameState === 'playing') {
            this.gameController.pauseGame();
        }
        
        // Clear all input states
        this.keys = {};
        this.mouseDown = false;
        this.touchActive = false;
        this.thrustPressed = false;
    }
    
    handleWindowFocus() {
        // Resume game if it was paused due to focus loss
        // Note: This is optional, player might want manual resume
    }
    
    update(deltaTime) {
        // Handle continuous input
        this.handleContinuousInput();
        
        // Update input timers
        this.updateInputTimers(deltaTime);
    }
    
    handleContinuousInput() {
        // Continuous thrust if space is held
        if (this.keys['Space'] || this.mouseDown || this.touchActive) {
            if (!this.thrustPressed) {
                this.handleThrustInput(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
            }
        }
        
        // Handle other continuous inputs
        if (this.keys['ArrowUp']) {
            // Alternative thrust method
        }
        
        if (this.keys['ArrowDown']) {
            // Quick descent (if implemented)
        }
    }
    
    updateInputTimers(deltaTime) {
        // Update any input-related timers here
    }
    
    addInputFeedback(type) {
        // Visual/haptic feedback for input
        switch (type) {
            case 'thrust':
                this.addScreenPulse('#00ffff');
                break;
            case 'boost':
                this.addScreenPulse('#ffff00');
                this.vibrate(50); // Mobile vibration
                break;
        }
    }
    
    addScreenPulse(color) {
        // Add a subtle screen pulse effect
        const pulse = document.createElement('div');
        pulse.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            opacity: 0.1;
            pointer-events: none;
            z-index: 9999;
            animation: pulse 0.2s ease-out;
        `;
        
        // Add pulse animation keyframe if not exists
        if (!document.querySelector('#pulseKeyframes')) {
            const style = document.createElement('style');
            style.id = 'pulseKeyframes';
            style.textContent = `
                @keyframes pulse {
                    0% { opacity: 0.2; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(pulse);
        
        // Remove after animation
        setTimeout(() => {
            pulse.remove();
        }, 200);
    }
    
    vibrate(duration) {
        // Mobile haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }
    
    // Utility methods
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    isAnyThrustPressed() {
        return this.keys['Space'] || this.mouseDown || this.touchActive;
    }
    
    isBoostPressed() {
        return (this.keys['Space'] && (this.keys['ShiftLeft'] || this.keys['ShiftRight'])) ||
               (this.mouseDown && this.keys['ShiftLeft']) ||
               this.touchActive; // Multi-touch boost
    }
    
    // Debug methods
    getInputState() {
        return {
            keys: {...this.keys},
            mouseDown: this.mouseDown,
            touchActive: this.touchActive,
            thrustPressed: this.thrustPressed
        };
    }
}
