class GameView {
    constructor(canvas, gameModel) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameModel = gameModel;
        
        // Simplified UI elements for Flappy Bird
        this.hudElements = {
            distance: document.getElementById('distance'),
            lives: document.getElementById('lives')
        };
        
        // Visual effects
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.backgroundStars = this.generateBackgroundStars();
        
        // Add observer to game model
        this.gameModel.addObserver(this);
    }
    
    generateBackgroundStars() {
        const stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.8 + 0.2
            });
        }
        return stars;
    }
    
    onGameEvent(event, data) {
        switch (event) {
            case 'gameUpdate':
                this.updateHUD(data);
                break;
            case 'scored':
                this.addScreenShake(3);
                this.createScoreEffect();
                break;
            case 'collectiblePickup':
                this.createPickupEffect(data.type);
                break;
        }
    }
    
    updateHUD(data) {
        if (data.score !== undefined && this.hudElements.distance) {
            this.hudElements.distance.textContent = data.score;
        }
        
        if (data.lives !== undefined && this.hudElements.lives) {
            this.hudElements.lives.textContent = data.lives;
        }
    }
    
    addScreenShake(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }
    
    updateScreenShake() {
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= 0.9;
            
            if (this.screenShake.intensity < 0.1) {
                this.screenShake.intensity = 0;
                this.screenShake.x = 0;
                this.screenShake.y = 0;
            }
        }
    }
    
    render() {
        // Apply screen shake
        this.updateScreenShake();
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        // Clear canvas with space background
        this.renderBackground();
        
        // Render all game objects
        this.renderGameObjects();
        
        // Render UI overlays
        this.renderUIOverlays();
        
        this.ctx.restore();
    }
    
    renderBackground() {
        // Dark space gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(1, '#000811');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render moving background stars
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.backgroundStars.forEach(star => {
            this.ctx.globalAlpha = star.brightness;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
            
            // Move stars
            star.x -= 0.5;
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
        });
        this.ctx.globalAlpha = 1;
    }
    
    renderGameObjects() {
        // Render pipes
        this.gameModel.pipes.forEach(pipe => this.renderSpacePipe(pipe));
        
        // Render collectibles with CSS animation
        this.gameModel.collectibles.forEach(collectible => this.renderCollectible(collectible));
        
        // Render power-ups
        this.gameModel.powerUps.forEach(powerUp => this.renderPowerUp(powerUp));
        
        // Render bonus items
        this.gameModel.bonusItems.forEach(item => this.renderBonusItem(item));
        
        // Render player
        if (this.gameModel.player) {
            this.renderPlayer(this.gameModel.player);
        }
    }
    
    renderPlayer(player) {
        this.ctx.save();
        
        // Apply rotation and position
        this.ctx.translate(player.x + player.width/2, player.y + player.height/2);
        this.ctx.rotate(player.rotation * Math.PI / 180);
        
        // Ship scaling during flap
        const scale = player.flapAnimation > 0 ? 1.1 : 1;
        this.ctx.scale(scale, scale);
        
        // Draw ship based on type
        this.drawSpaceship(player);
        
        this.ctx.restore();
        
        // Render thruster particles
        player.thrusterParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawSpaceship(player) {
        // Ship body
        const gradient = this.ctx.createLinearGradient(-player.width/2, 0, player.width/2, 0);
        
        switch (player.shipType) {
            case 'interceptor':
                gradient.addColorStop(0, '#ff6b35');
                gradient.addColorStop(1, '#f7931e');
                break;
            case 'cruiser':
                gradient.addColorStop(0, '#004e89');
                gradient.addColorStop(1, '#00a8cc');
                break;
            default: // fighter
                gradient.addColorStop(0, '#7209b7');
                gradient.addColorStop(1, '#a663cc');
        }
        
        this.ctx.fillStyle = gradient;
        
        // Main body (triangle-like spaceship)
        this.ctx.beginPath();
        this.ctx.moveTo(player.width/2, 0);
        this.ctx.lineTo(-player.width/2, -player.height/2);
        this.ctx.lineTo(-player.width/3, 0);
        this.ctx.lineTo(-player.width/2, player.height/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Cockpit
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillRect(player.width/4, -5, 8, 10);
        
        // Wing details
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-player.width/2, -2, player.width/3, 4);
    }
    
    renderSpacePipe(pipe) {
        // Main pipe structure
        const gradient = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        gradient.addColorStop(0, '#2a2a2a');
        gradient.addColorStop(0.5, '#4a4a4a');
        gradient.addColorStop(1, '#2a2a2a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
        
        // Pipe cap
        const capHeight = 30;
        const capWidth = pipe.width + 20;
        const capX = pipe.x - 10;
        let capY = pipe.isTop ? pipe.y + pipe.height - capHeight : pipe.y;
        
        this.ctx.fillStyle = '#1a4a6b';
        this.ctx.fillRect(capX, capY, capWidth, capHeight);
        
        // Energy lights
        this.ctx.fillStyle = `rgba(0, 255, 255, ${pipe.energyPulse})`;
        for (let i = 0; i < 3; i++) {
            const lightX = pipe.x + 15 + i * 20;
            const lightY = pipe.isTop ? pipe.y + pipe.height - 60 : pipe.y + 10;
            const lightHeight = 50;
            
            if (lightY >= pipe.y && lightY + lightHeight <= pipe.y + pipe.height) {
                this.ctx.fillRect(lightX, lightY, 4, lightHeight);
            }
        }
        
        // Warning stripes
        this.ctx.fillStyle = '#ff6600';
        for (let i = 0; i < pipe.height; i += 40) {
            this.ctx.fillRect(pipe.x + 5, pipe.y + i, pipe.width - 10, 8);
        }
    }
    
    renderCollectible(collectible) {
        if (collectible.collected) {
            // Render collect effect
            collectible.collectEffect.forEach(particle => {
                this.ctx.fillStyle = particle.color;
                this.ctx.globalAlpha = particle.life / particle.maxLife;
                this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            });
            this.ctx.globalAlpha = 1;
            return;
        }
        
        this.ctx.save();
        this.ctx.translate(collectible.x + collectible.width / 2, collectible.y + collectible.height / 2);
        this.ctx.rotate(collectible.rotation);
        this.ctx.scale(collectible.scale, collectible.scale);
        
        // Simple crystal shape
        this.ctx.fillStyle = collectible.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -collectible.height/2);
        this.ctx.lineTo(collectible.width/3, -collectible.height/4);
        this.ctx.lineTo(collectible.width/2, collectible.height/4);
        this.ctx.lineTo(0, collectible.height/2);
        this.ctx.lineTo(-collectible.width/2, collectible.height/4);
        this.ctx.lineTo(-collectible.width/3, -collectible.height/4);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    renderPowerUp(powerUp) {
        this.ctx.save();
        this.ctx.translate(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
        this.ctx.rotate(powerUp.rotation);
        this.ctx.scale(powerUp.pulseScale, powerUp.pulseScale);
        
        // Glow effect
        this.ctx.shadowColor = powerUp.color;
        this.ctx.shadowBlur = 15;
        
        // Main body
        this.ctx.fillStyle = powerUp.color;
        this.ctx.fillRect(-powerUp.width/2, -powerUp.height/2, powerUp.width, powerUp.height);
        
        // Symbol
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(powerUp.symbol, 0, 5);
        
        this.ctx.restore();
    }
    
    renderBonusItem(item) {
        this.ctx.save();
        this.ctx.translate(item.x + item.width/2, item.y + item.height/2);
        
        // Glow effect
        this.ctx.shadowColor = item.color;
        this.ctx.shadowBlur = 10 + item.glowIntensity * 10;
        
        // Diamond shape
        this.ctx.fillStyle = item.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -item.height/2);
        this.ctx.lineTo(item.width/2, 0);
        this.ctx.lineTo(0, item.height/2);
        this.ctx.lineTo(-item.width/2, 0);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    renderUIOverlays() {
        // Score display
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(this.gameModel.score, this.canvas.width/2, 80);
        this.ctx.fillText(this.gameModel.score, this.canvas.width/2, 80);
        
        // Timer
        this.ctx.textAlign = 'right';
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#ffff00';
        const timeLeft = Math.ceil(this.gameModel.getRemainingTime());
        this.ctx.fillText(`Tiempo: ${timeLeft}s`, this.canvas.width - 20, 40);
    }
    
    createScoreEffect() {
        console.log('Score!');
    }
    
    createPickupEffect(type) {
        console.log(`Picked up ${type}!`);
    }
}
