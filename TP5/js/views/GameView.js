/**
 * GAMEVIEW.JS - VISTA DEL JUEGO
 * Maneja todo el renderizado del juego en canvas
 * Incluye: nave, obstáculos, collectibles, partículas, spritesheets
 * Patrón MVC - Vista
 */

class GameView {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = GameConfig;
        
        // Configurar canvas
        this.setupCanvas();
        
        // Contador para animaciones
        this.animationCounter = 0;
    }
    
    /**
     * Configura el tamaño del canvas
     */
    setupCanvas() {
        // 1. Obtenemos el contenedor padre (el div #game-container)
        const container = this.canvas.parentElement;
        
        // 2. Ajustamos la resolución interna del canvas al tamaño real del contenedor
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight; // Esto tomará los 520px automáticamente

        // Opcional: Si el juego se ve borroso en pantallas retina/móviles, descomenta esto:
        // const dpr = window.devicePixelRatio || 1;
        // this.canvas.width = container.clientWidth * dpr;
        // this.canvas.height = container.clientHeight * dpr;
        // this.ctx.scale(dpr, dpr);
    }
    
    /**
     * Renderiza todo el juego
     */
    render(model) {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderizar elementos
        this.renderParticles(model.particles);
        this.renderCollectibles(model.stars, model.gems);
        this.renderObstacles(model.obstacles);
        this.renderEnemies(model.enemies);
        this.renderPowerUps(model.powerUps);
        this.renderPlayer(model.player, model);
        
        // Actualizar animaciones sprite
        this.updateSpriteAnimations();
    }
    
    /**
     * Renderiza el jugador (nave espacial)
     */
    renderPlayer(player, model) {
        this.ctx.save();
        
        // Trasladar al centro de la nave
        this.ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        
        // Rotar según velocidad
        this.ctx.rotate(player.rotation * Math.PI / 180);
        
        // Efecto de parpadeo si es invulnerable (por daño)
        if (player.invulnerable && player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 5) % 2 === 0) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // Dibujar escudo brillante si está activo
        if (model && model.activeEffects && model.activeEffects.shield > 0) {
            this.drawShieldEffect(0, 0, player.width * 0.8);
        }
        
        // Intentar dibujar sprite del jugador si cargó
        let drawnSprite = false;
        if (window.PlayerSprite && window.PlayerSprite.loaded) {
            drawnSprite = window.PlayerSprite.draw(
                this.ctx,
                -player.width / 2,
                -player.height / 2,
                player.width,
                player.height,
                0
            );
        }
        // Fallback a dibujo procedural
        if (!drawnSprite) {
            this.drawSpaceship(-player.width / 2, -player.height / 2, player.width, player.height, player.isFlapping);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Dibuja efecto visual del escudo
     */
    drawShieldEffect(x, y, radius) {
        const ctx = this.ctx;
        const pulseOffset = Math.sin(this.animationCounter * 0.15) * 3;
        const currentRadius = radius + pulseOffset;
        
        // Gradiente del escudo
        const gradient = ctx.createRadialGradient(x, y, currentRadius * 0.7, x, y, currentRadius);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.6)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde brillante
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 + Math.sin(this.animationCounter * 0.2) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Anillos internos para efecto tech
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, currentRadius * 0.85, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    /**
     * Dibuja la nave espacial
     */
    drawSpaceship(x, y, width, height, isFlapping) {
        const ctx = this.ctx;
        
        // Cuerpo principal (cono)
        ctx.fillStyle = '#4a90e2';
        ctx.beginPath();
        ctx.moveTo(x + width, y + height / 2);
        ctx.lineTo(x + width * 0.3, y);
        ctx.lineTo(x, y + height / 2);
        ctx.lineTo(x + width * 0.3, y + height);
        ctx.closePath();
        ctx.fill();
        
        // Borde metálico
        ctx.strokeStyle = '#2d5a8a';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Ventana de cabina
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(x + width * 0.65, y + height / 2, width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Brillo en ventana
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + width * 0.7, y + height * 0.4, width * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        // Alas
        ctx.fillStyle = '#357abd';
        // Ala superior
        ctx.beginPath();
        ctx.moveTo(x + width * 0.5, y + height * 0.2);
        ctx.lineTo(x + width * 0.3, y - height * 0.3);
        ctx.lineTo(x + width * 0.4, y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2d5a8a';
        ctx.stroke();
        
        // Ala inferior
        ctx.beginPath();
        ctx.moveTo(x + width * 0.5, y + height * 0.8);
        ctx.lineTo(x + width * 0.3, y + height * 1.3);
        ctx.lineTo(x + width * 0.4, y + height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Propulsores (animados si está impulsando)
        if (isFlapping) {
            // Llama principal
            const gradient = ctx.createLinearGradient(x, y + height / 2, x - 30, y + height / 2);
            gradient.addColorStop(0, '#00ffff');
            gradient.addColorStop(0.5, '#4a90e2');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(x + width * 0.1, y + height * 0.4);
            ctx.lineTo(x - 25, y + height / 2);
            ctx.lineTo(x + width * 0.1, y + height * 0.6);
            ctx.closePath();
            ctx.fill();
            
            // Núcleo brillante
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(x + width * 0.1, y + height * 0.45);
            ctx.lineTo(x - 15, y + height / 2);
            ctx.lineTo(x + width * 0.1, y + height * 0.55);
            ctx.closePath();
            ctx.fill();
        }
        
        // Detalles decorativos
        ctx.strokeStyle = '#6bb6ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.4, y + height * 0.3);
        ctx.lineTo(x + width * 0.7, y + height * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + width * 0.4, y + height * 0.7);
        ctx.lineTo(x + width * 0.7, y + height * 0.7);
        ctx.stroke();
    }
    
    /**
     * Renderiza obstáculos (tubos espaciales)
     */
    renderObstacles(obstacles) {
        for (const obstacle of obstacles) {
            this.drawPipe(obstacle);
        }
    }
    
    /**
     * Dibuja un tubo espacial (estilo Flappy Bird espacial)
     */
    drawPipe(obstacle) {
        const ctx = this.ctx;
        const config = GameConfig.OBSTACLES;
        
        // Gradiente del tubo (verde espacial)
        const gradient = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + obstacle.width, 0);
        gradient.addColorStop(0, config.COLOR_TOP);
        gradient.addColorStop(0.5, config.COLOR_BOTTOM);
        gradient.addColorStop(1, config.COLOR_TOP);
        
        // Cuerpo del tubo
        ctx.fillStyle = gradient;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Borde del tubo
        ctx.strokeStyle = config.COLOR_BORDER;
        ctx.lineWidth = 3;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Detalles decorativos (líneas verticales)
        ctx.strokeStyle = config.COLOR_HIGHLIGHT;
        ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
            const xPos = obstacle.x + (obstacle.width * i / 4);
            ctx.beginPath();
            ctx.moveTo(xPos, obstacle.y);
            ctx.lineTo(xPos, obstacle.y + obstacle.height);
            ctx.stroke();
        }
        
        // Detalles tecnológicos (puntos de luz)
        ctx.fillStyle = '#00ffff';
        const lightSpacing = 80;
        let currentY = obstacle.y + 20;
        while (currentY < obstacle.y + obstacle.height - 20) {
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width / 2, currentY, 3, 0, Math.PI * 2);
            ctx.fill();
            currentY += lightSpacing;
        }
        
        // Tapa del tubo (parte que sobresale)
        const capHeight = config.PIPE_CAP_HEIGHT;
        const capWidth = config.PIPE_CAP_WIDTH;
        const capX = obstacle.x - (capWidth - obstacle.width) / 2;
        
        if (obstacle.type === 'top') {
            // Tapa inferior para tubo superior
            const capY = obstacle.y + obstacle.height - capHeight / 2;
            
            // Gradiente de la tapa
            const capGradient = ctx.createLinearGradient(capX, capY, capX, capY + capHeight);
            capGradient.addColorStop(0, config.COLOR_BOTTOM);
            capGradient.addColorStop(1, config.COLOR_TOP);
            
            ctx.fillStyle = capGradient;
            ctx.fillRect(capX, capY, capWidth, capHeight);
            
            // Borde de la tapa
            ctx.strokeStyle = config.COLOR_BORDER;
            ctx.lineWidth = 3;
            ctx.strokeRect(capX, capY, capWidth, capHeight);
            
            // Banda decorativa
            ctx.fillStyle = config.COLOR_HIGHLIGHT;
            ctx.fillRect(capX, capY + capHeight / 3, capWidth, 3);
            ctx.fillRect(capX, capY + (capHeight * 2 / 3), capWidth, 3);
            
        } else {
            // Tapa superior para tubo inferior
            const capY = obstacle.y - capHeight / 2;
            
            // Gradiente de la tapa
            const capGradient = ctx.createLinearGradient(capX, capY, capX, capY + capHeight);
            capGradient.addColorStop(0, config.COLOR_TOP);
            capGradient.addColorStop(1, config.COLOR_BOTTOM);
            
            ctx.fillStyle = capGradient;
            ctx.fillRect(capX, capY, capWidth, capHeight);
            
            // Borde de la tapa
            ctx.strokeStyle = config.COLOR_BORDER;
            ctx.lineWidth = 3;
            ctx.strokeRect(capX, capY, capWidth, capHeight);
            
            // Banda decorativa
            ctx.fillStyle = config.COLOR_HIGHLIGHT;
            ctx.fillRect(capX, capY + capHeight / 3, capWidth, 3);
            ctx.fillRect(capX, capY + (capHeight * 2 / 3), capWidth, 3);
        }
    }
    
    /**
     * Renderiza collectibles (usando propiedades de las entidades)
     */
    renderCollectibles(stars, gems) {
        // Renderizar estrellas
        for (const star of stars) {
            this.ctx.save();
            this.ctx.translate(star.x, star.y);
            this.ctx.rotate(star.rotation * Math.PI / 180);
            this.drawStar(0, 0, star.size);
            this.ctx.restore();
        }
        
        // Renderizar gemas (usando método getDisplayY)
        for (const gem of gems) {
            this.ctx.save();
            this.ctx.translate(gem.x, gem.getDisplayY());
            this.drawGem(0, 0, gem.size);
            this.ctx.restore();
        }
    }
    
    /**
     * Dibuja una estrella
     */
    drawStar(x, y, size) {
        const ctx = this.ctx;
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        
        // Gradiente dorado
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, outerRadius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.4, '#ffd700');
        gradient.addColorStop(1, '#ffaa00');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / spikes;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Brillo
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Centro brillante
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, size / 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Dibuja una gema
     */
    drawGem(x, y, size) {
        const ctx = this.ctx;
        
        // Gradiente de gema
        const gradient = ctx.createLinearGradient(x - size / 2, y - size / 2, 
                                                 x + size / 2, y + size / 2);
        gradient.addColorStop(0, '#e83e8c');
        gradient.addColorStop(0.5, '#ba55d3');
        gradient.addColorStop(1, '#6b2d5c');
        
        ctx.fillStyle = gradient;
        
        // Forma de diamante
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x + size / 3, y);
        ctx.lineTo(x, y + size / 2);
        ctx.lineTo(x - size / 3, y);
        ctx.closePath();
        ctx.fill();
        
        // Borde brillante
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Facetas
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x, y + size / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - size / 3, y);
        ctx.lineTo(x + size / 3, y);
        ctx.stroke();
        
        // Brillo superior
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x + size / 6, y - size / 6);
        ctx.lineTo(x - size / 6, y - size / 6);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Renderiza enemigos
     */
    renderEnemies(enemies) {
        for (const enemy of enemies) {
            this.ctx.save();
            
            switch(enemy.type) {
                case 'drone':
                    this.drawDrone(enemy);
                    break;
                case 'meteor':
                    this.drawMeteor(enemy);
                    break;
                case 'alien':
                    this.drawAlien(enemy);
                    break;
            }
            
            this.ctx.restore();
        }
    }
    
    /**
     * Dibuja un drone enemigo
     */
    drawDrone(enemy) {
        const ctx = this.ctx;
        const config = GameConfig.ENEMIES;
        const x = enemy.x;
        const y = enemy.y;
        const size = enemy.size;
        
        // Cuerpo del drone (rombo)
        ctx.fillStyle = config.DRONE_COLOR_PRIMARY;
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size, y + size / 2);
        ctx.lineTo(x + size / 2, y + size);
        ctx.lineTo(x, y + size / 2);
        ctx.closePath();
        ctx.fill();
        
        // Borde
        ctx.strokeStyle = config.DRONE_COLOR_SECONDARY;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Ojo central
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupila
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Hélices (4 corners)
        ctx.strokeStyle = config.DRONE_COLOR_SECONDARY;
        ctx.lineWidth = 3;
        const propSize = size / 6;
        
        // Top left
        ctx.beginPath();
        ctx.arc(x + size / 4, y + size / 4, propSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Top right
        ctx.beginPath();
        ctx.arc(x + size * 3 / 4, y + size / 4, propSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Bottom left
        ctx.beginPath();
        ctx.arc(x + size / 4, y + size * 3 / 4, propSize, 0, Math.PI * 2);
        ctx.stroke();
        
        // Bottom right
        ctx.beginPath();
        ctx.arc(x + size * 3 / 4, y + size * 3 / 4, propSize, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    /**
     * Dibuja un meteoro enemigo
     */
    drawMeteor(enemy) {
        const ctx = this.ctx;
        const config = GameConfig.ENEMIES;
        const x = enemy.x;
        const y = enemy.y;
        const size = enemy.size;
        
        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(enemy.rotation * Math.PI / 180);
        
        // Gradiente del meteoro
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
        gradient.addColorStop(0, config.METEOR_COLOR_PRIMARY);
        gradient.addColorStop(0.7, config.METEOR_COLOR_SECONDARY);
        gradient.addColorStop(1, '#2c1608');
        
        ctx.fillStyle = gradient;
        
        // Forma irregular del meteoro
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (Math.PI * 2 * i) / points;
            const radius = (size / 2) * (0.8 + Math.sin(i * 2) * 0.2);
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Borde
        ctx.strokeStyle = '#1a0d04';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Cráteres
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 * i) / 3;
            const dist = size / 5;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, size / 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Estela de fuego
        const gradient2 = ctx.createLinearGradient(-size / 2, 0, -size, 0);
        gradient2.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
        gradient2.addColorStop(0.5, 'rgba(255, 50, 0, 0.3)');
        gradient2.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.moveTo(-size / 2, 0);
        ctx.lineTo(-size, -size / 4);
        ctx.lineTo(-size, size / 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * Dibuja un alien enemigo
     */
    drawAlien(enemy) {
        const ctx = this.ctx;
        const config = GameConfig.ENEMIES;
        const x = enemy.x;
        const y = enemy.y;
        const size = enemy.size;
        
        // Cuerpo del alien (forma de platillo)
        const gradient = ctx.createRadialGradient(x + size / 2, y + size / 2, 0,
                                                 x + size / 2, y + size / 2, size / 2);
        gradient.addColorStop(0, config.ALIEN_COLOR_PRIMARY);
        gradient.addColorStop(0.6, config.ALIEN_COLOR_SECONDARY);
        gradient.addColorStop(1, '#4a235a');
        
        ctx.fillStyle = gradient;
        
        // Parte superior (cúpula)
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size / 3, size / 3, size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde de cúpula
        ctx.strokeStyle = '#6c3483';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Parte inferior (base del platillo)
        ctx.fillStyle = config.ALIEN_COLOR_SECONDARY;
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size * 2 / 3, size / 2, size / 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Borde de base
        ctx.strokeStyle = '#4a235a';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Luces en la base (animadas)
        const lightCount = 5;
        for (let i = 0; i < lightCount; i++) {
            const angle = (Math.PI * 2 * i) / lightCount + (this.animationCounter * 0.1);
            const lightX = x + size / 2 + Math.cos(angle) * (size / 3);
            const lightY = y + size * 2 / 3 + Math.sin(angle) * (size / 8);
            
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(lightX, lightY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Ventana / ojo
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 3, size / 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Brillo en ventana
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + size / 2 + size / 12, y + size / 3 - size / 12, size / 12, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Renderiza partículas
     */
    renderParticles(particles) {
        for (const particle of particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    /**
     * Actualiza animaciones
     */
    updateSpriteAnimations() {
        this.animationCounter++;
        if (window.PlayerSprite) {
            // Estimar delta ~16ms a falta de cálculo real (se puede mejorar pasando delta)
            window.PlayerSprite.update(16);
        }
    }

    /**
     * Renderiza power-ups
     */
    renderPowerUps(powerUps) {
        const ctx = this.ctx;
        for (const p of powerUps) {
            ctx.save();
            ctx.translate(p.x, p.getDisplayY());
            if (p.kind === 'shield') {
                // Escudo: círculo con borde brillante
                const grad = ctx.createRadialGradient(0,0,0,0,0,p.size);
                grad.addColorStop(0,'rgba(0,255,255,0.8)');
                grad.addColorStop(1,'rgba(0,255,255,0.2)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0,0,p.size,0,Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (p.kind === 'slow') {
                // Reloj/Hourglass estilizado
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(-p.size/2,-p.size/2);
                ctx.lineTo(p.size/2,-p.size/2);
                ctx.lineTo(-p.size/2,p.size/2);
                ctx.lineTo(p.size/2,p.size/2);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#ffec8b';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Arena
                ctx.fillStyle = '#fffacd';
                ctx.beginPath();
                ctx.moveTo(-p.size/3,-p.size/2+4);
                ctx.lineTo(p.size/3,-p.size/2+4);
                ctx.lineTo(0,0);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }
    
    /**
     * Redimensiona el canvas
     */
    resize() {
        this.setupCanvas();
    }
}
