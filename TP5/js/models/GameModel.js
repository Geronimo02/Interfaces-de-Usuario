/**
 * GAMEMODEL.JS - MODELO DEL JUEGO
 * Maneja toda la lógica del juego: estado, física, colisiones, puntuación
 * Patrón MVC - Modelo
 * Usa GameConfig para configuración y clases Entity para objetos del juego
 */

class GameModel {
    constructor() {
        // Referencias a configuración
        this.config = GameConfig;
        
        // Estados del juego
        this.gameState = 'start'; // start, playing, paused, gameover
        
        // Configuración del canvas
        this.canvasWidth = this.config.CANVAS.WIDTH;
        this.canvasHeight = this.config.CANVAS.HEIGHT;
        
        // Jugador (nave espacial)
        this.player = {
            x: this.config.PLAYER.X,
            y: this.canvasHeight / 2,
            width: this.config.PLAYER.WIDTH,
            height: this.config.PLAYER.HEIGHT,
            velocity: 0,
            gravity: this.config.PLAYER.GRAVITY,
            jumpForce: this.config.PLAYER.JUMP_FORCE,
            rotation: 0,
            isFlapping: false,
            invulnerable: false,
            invulnerableTimer: 0
        };
        
        // Sistema de puntuación
        this.score = 0;
        this.bestScore = this.loadBestScore();
        
        // Sistema de vidas
        this.lives = this.config.GAME.INITIAL_LIVES;
        this.maxLives = this.config.GAME.MAX_LIVES;
        
        // Sistema de tiempo
        this.gameTime = 0;
        this.startTime = 0;
        
        // Velocidad del juego
        this.gameSpeed = this.config.GAME.INITIAL_SPEED;
        this.speedIncrement = this.config.GAME.SPEED_INCREMENT;
        
        // Obstáculos (tubos espaciales)
        this.obstacles = [];
        this.obstacleSpawnTimer = 0;
        this.obstacleSpawnInterval = this.config.OBSTACLES.SPAWN_INTERVAL;
        
        // Collectibles (usando clases Entity)
        this.stars = [];
        this.gems = [];
        this.collectibleSpawnTimer = 0;
        this.collectibleSpawnInterval = this.config.COLLECTIBLE_SPAWN_INTERVAL;
        
        // Enemigos (usando clase Enemy)
        this.enemies = [];
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = this.config.ENEMIES.SPAWN_INTERVAL;
        
        // Partículas (usando clase Entity)
        this.particles = [];
        
        // Frame counter
        this.frameCount = 0;
        
        // Guardar información de gaps de obstáculos para spawn de collectibles
        this.lastObstacleGap = null;

        // PowerUps y efectos
        this.powerUps = [];
        this.powerUpSpawnTimer = 0;
        this.powerUpSpawnInterval = this.config.POWERUPS.GLOBAL.SPAWN_INTERVAL;
        this.activeEffects = { shield: 0, slow: 0 };
        this.slowFactor = 1; // factor ralentización
    }
    
    /**
     * Reinicia el juego
     */
    reset() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = this.config.GAME.INITIAL_LIVES;
        this.gameTime = 0;
        this.startTime = Date.now();
        this.gameSpeed = this.config.GAME.INITIAL_SPEED;
        this.frameCount = 0;
        
        // Reset jugador
        this.player.y = this.canvasHeight / 2;
        this.player.velocity = 0;
        this.player.rotation = 0;
        this.player.isFlapping = false;
        this.player.invulnerable = false;
        this.player.invulnerableTimer = 0;
        
    // Limpiar arrays
    this.obstacles = [];
    this.stars = [];
    this.gems = [];
    this.enemies = [];
    this.particles = [];
    this.powerUps = [];
        
    // Reset timers
    this.obstacleSpawnTimer = 0;
    this.collectibleSpawnTimer = 0;
    this.enemySpawnTimer = 0;
    this.powerUpSpawnTimer = 0;
        
        // Reset gap info
        this.lastObstacleGap = null;
        
        // Reset efectos
        this.activeEffects.shield = 0;
        this.activeEffects.slow = 0;
        this.slowFactor = 1;
    }
    
    /**
     * Actualiza el estado del juego
     */
    update() {
        if (this.gameState !== 'playing') return;
        
        this.frameCount++;
        this.updateGameTime();
        this.updatePlayer();
        this.updateObstacles();
        this.updateCollectibles();
        this.updateEnemies();
        this.updateParticles();
        this.updatePowerUps();
        this.updateGameSpeed();
        this.spawnObstacles();
        this.spawnCollectibles();
        this.spawnEnemies();
        this.spawnPowerUps();
        this.updateActiveEffects();
        this.checkCollisions();
    }
    
    /**
     * Actualiza el tiempo de juego
     */
    updateGameTime() {
        this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    /**
     * Actualiza la física del jugador
     */
    updatePlayer() {
        // Aplicar gravedad
        this.player.velocity += this.player.gravity;
        this.player.y += this.player.velocity;
        
        // Calcular rotación basada en velocidad
        this.player.rotation = Math.min(Math.max(this.player.velocity * 2, -30), 30);
        
        // Limites del canvas
        if (this.player.y < 0) {
            this.player.y = 0;
            this.player.velocity = 0;
        }
        if (this.player.y > this.canvasHeight - this.player.height) {
            this.player.y = this.canvasHeight - this.player.height;
            this.player.velocity = 0;
            // Solo daño si no está ya invulnerable (evita daño repetitivo en suelo)
            if (!this.player.invulnerable && this.activeEffects.shield === 0) {
                this.takeDamage();
            }
        }
        
        // Update invulnerabilidad (solo si no es por escudo)
        if (this.player.invulnerable && this.activeEffects.shield === 0) {
            this.player.invulnerableTimer--;
            if (this.player.invulnerableTimer <= 0) {
                this.player.invulnerable = false;
            }
        }
        
        // Reset flapping animation flag
        if (this.player.isFlapping) {
            setTimeout(() => { this.player.isFlapping = false; }, 300);
        }
    }
    
    /**
     * Aplica impulso al jugador
     */
    applyJump() {
        if (this.gameState !== 'playing') return;
        
        this.player.velocity = this.player.jumpForce;
        this.player.isFlapping = true;
        this.createThrustParticles();
        if (window.SoundManager) window.SoundManager.play('jump');
    }
    
    /**
     * Actualiza obstáculos (usando clase Obstacle)
     */
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.update(this.gameSpeed * this.slowFactor);
            
            // Marcar como pasado y dar puntos (solo una vez por par)
            if (!obstacle.passed && obstacle.x + obstacle.width < this.player.x) {
                obstacle.passed = true;
                // Solo dar puntos una vez por par (cuando pasa el tubo superior)
                if (obstacle.type === 'top') {
                    this.score += this.config.SCORE.PASS_OBSTACLE;
                }
            }
            
            // Eliminar si sale de la pantalla
            if (obstacle.isOffScreen()) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    /**
     * Genera nuevos obstáculos (tubos espaciales)
     */
    spawnObstacles() {
        this.obstacleSpawnTimer++;
        
        if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
            this.obstacleSpawnTimer = 0;
            
            const obstacleConfig = this.config.OBSTACLES;
           
            const difficultyFactor = Math.min(1, this.frameCount / (60 * 90)); 

            
            const reductionAmount = 150;

            const dynamicMinGap = obstacleConfig.MIN_GAP - (difficultyFactor * reductionAmount);
            const dynamicMaxGap = obstacleConfig.MAX_GAP - (difficultyFactor * reductionAmount);
            
            // ------------------------------------------------
            
            const gap = dynamicMinGap + Math.random() * (dynamicMaxGap - dynamicMinGap);
            const topHeight = 50 + Math.random() * (this.canvasHeight - gap - 100);
            
            // Tubo superior (usando clase Obstacle)
            const topPipe = new Obstacle(
                this.canvasWidth,
                0,
                obstacleConfig.WIDTH,
                topHeight,
                'top'
            );
            
            // Tubo inferior (usando clase Obstacle)
            const bottomPipe = new Obstacle(
                this.canvasWidth,
                topHeight + gap,
                obstacleConfig.WIDTH,
                this.canvasHeight - (topHeight + gap),
                'bottom'
            );
            
            this.obstacles.push(topPipe, bottomPipe);
            
            // Guardar información del gap para spawn de collectibles
            this.lastObstacleGap = {
                x: this.canvasWidth,
                topY: topHeight,
                bottomY: topHeight + gap,
                gap: gap
            };
        }
    }
    
    /**
     * Actualiza collectibles (usando clases Star y Gem)
     */
    updateCollectibles() {
        // Actualizar estrellas
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star.update(this.gameSpeed * this.slowFactor, this.frameCount);
            
            if (star.isOffScreen()) {
                this.stars.splice(i, 1);
            }
        }
        
        // Actualizar gemas
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];
            gem.update(this.gameSpeed * this.slowFactor, this.frameCount);
            
            if (gem.isOffScreen()) {
                this.gems.splice(i, 1);
            }
        }
    }
    
    /**
     * Genera collectibles (usando clases Star y Gem)
     * Ahora aparecen dentro de los tubos
     */
    spawnCollectibles() {
        this.collectibleSpawnTimer++;
        
        if (this.collectibleSpawnTimer >= this.collectibleSpawnInterval) {
            this.collectibleSpawnTimer = 0;
            
            const starChance = this.config.STARS.SPAWN_CHANCE;
            let spawnX, spawnY;
            
            // Si hay un gap de obstáculo reciente y config activa, spawn dentro del gap
            if (this.config.COLLECTIBLE_IN_PIPES && this.lastObstacleGap) {
                // Posición X: un poco adelante del inicio del tubo
                spawnX = this.lastObstacleGap.x + 30;
                
                // Posición Y: dentro del gap, con margen de seguridad
                const gapMargin = 30;
                const minY = this.lastObstacleGap.topY + gapMargin;
                const maxY = this.lastObstacleGap.bottomY - gapMargin;
                spawnY = minY + Math.random() * (maxY - minY);
                
                // Limpiar el gap después de usarlo
                this.lastObstacleGap = null;
            } else {
                // Spawn normal (por si acaso)
                spawnX = this.canvasWidth;
                spawnY = 50 + Math.random() * (this.canvasHeight - 100);
            }
            
            // Spawn estrella o gema según probabilidad
            if (Math.random() < starChance) {
                const star = new Star(spawnX, spawnY);
                this.stars.push(star);
            } else {
                const gem = new Gem(spawnX, spawnY);
                this.gems.push(gem);
            }
        }
    }
    
    /**
     * Actualiza enemigos (usando clase Enemy)
     */
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.frameCount);
            
            // Eliminar si sale de pantalla o está destruido
            if (enemy.isOffScreen() || enemy.destroyed) {
                this.enemies.splice(i, 1);
            }
        }
    }
    
    /**
     * Genera enemigos (usando clase Enemy)
     */
    spawnEnemies() {
        this.enemySpawnTimer++;
        
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.enemySpawnTimer = 0;
            
            const enemyConfig = this.config.ENEMIES;
            
            // Elegir tipo de enemigo según probabilidades
            const rand = Math.random();
            let enemyType;
            
            if (rand < enemyConfig.DRONE_SPAWN_CHANCE) {
                enemyType = 'drone';
            } else if (rand < enemyConfig.DRONE_SPAWN_CHANCE + enemyConfig.METEOR_SPAWN_CHANCE) {
                enemyType = 'meteor';
            } else {
                enemyType = 'alien';
            }
            
            // Spawn enemigo
            const enemy = new Enemy(
                this.canvasWidth,
                enemyConfig.MIN_Y + Math.random() * (enemyConfig.MAX_Y - enemyConfig.MIN_Y),
                enemyType
            );
            
            this.enemies.push(enemy);
        }
    }
    
    /**
     * Actualiza partículas (usando clase Particle)
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * Crea partículas de impulso (usando clase Particle)
     */
    createThrustParticles() {
        const particleConfig = this.config.PARTICLES;
        
        for (let i = 0; i < particleConfig.THRUST_COUNT; i++) {
            const color = particleConfig.THRUST_COLORS[Math.floor(Math.random() * particleConfig.THRUST_COLORS.length)];
            
            const particle = new Particle(
                this.player.x,
                this.player.y + this.player.height / 2,
                particleConfig.THRUST_SPEED_MIN - Math.random() * 2,
                (Math.random() - 0.5) * 2,
                3 + Math.random() * 3,
                color,
                particleConfig.THRUST_LIFE
            );
            
            this.particles.push(particle);
        }
    }
    
    /**
     * Crea partículas de explosión (usando clase Particle)
     */
    createExplosionParticles(x, y) {
        const particleConfig = this.config.PARTICLES;
        
        for (let i = 0; i < particleConfig.EXPLOSION_COUNT; i++) {
            const angle = (Math.PI * 2 * i) / particleConfig.EXPLOSION_COUNT;
            const color = particleConfig.EXPLOSION_COLORS[Math.floor(Math.random() * particleConfig.EXPLOSION_COLORS.length)];
            
            const particle = new Particle(
                x,
                y,
                Math.cos(angle) * (2 + Math.random() * particleConfig.EXPLOSION_SPEED),
                Math.sin(angle) * (2 + Math.random() * particleConfig.EXPLOSION_SPEED),
                4 + Math.random() * 4,
                color,
                particleConfig.EXPLOSION_LIFE
            );
            
            this.particles.push(particle);
        }
    }
    
    /**
     * Crea partículas de recolección (usando clase Particle)
     */
    createCollectParticles(x, y, color) {
        const particleConfig = this.config.PARTICLES;
        
        for (let i = 0; i < particleConfig.COLLECT_COUNT; i++) {
            const angle = (Math.PI * 2 * i) / particleConfig.COLLECT_COUNT;
            
            const particle = new Particle(
                x,
                y,
                Math.cos(angle) * particleConfig.COLLECT_SPEED,
                Math.sin(angle) * particleConfig.COLLECT_SPEED,
                3,
                color,
                particleConfig.COLLECT_LIFE
            );
            
            this.particles.push(particle);
        }
    }
    
    /**
     * Verifica colisiones (usando métodos de las entidades)
     */
    checkCollisions() {
        // Jugador invulnerable aún puede recolectar; daño se ignora en takeDamage
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        // IMPORTANTE: Asegúrate de que en GameConfig.js el COLLISION_RADIUS sea aprox 25
        // o defínelo aquí manualmente si prefieres: const playerCollisionRadius = 25;
        const playerCollisionRadius = this.config.PLAYER.COLLISION_RADIUS;
        
        // --- AQUÍ ESTÁ EL CAMBIO CLAVE PARA LOS TUBOS ---
        // Definimos cuánto "aire" recortar. 
        // Si la nave es de 90px, quitamos 25px de cada lado.
        const hitPadding = 25; 

        // Colisión con obstáculos (usando método de Obstacle)
        for (const obstacle of this.obstacles) {
            if (obstacle.checkCollision(
                this.player.x + hitPadding,                 // X: movemos el borde hacia adentro
                this.player.y + hitPadding,                 // Y: bajamos el techo
                this.player.width - (hitPadding * 2),       // Ancho: reducimos el total (25 izq + 25 der = 50 menos)
                this.player.height - (hitPadding * 2)       // Alto: reducimos el total
            )) {
                const wasInvulnerable = this.player.invulnerable || this.activeEffects.shield > 0;
                this.takeDamage();
                if (!wasInvulnerable) {
                    this.createExplosionParticles(playerCenterX, playerCenterY);
                    return; // Solo salir si recibió daño real
                }
            }
        }
        
        // --- EL RESTO SIGUE IGUAL (Colisiones circulares) ---

        // Colisión con estrellas (usando método de Star)
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            if (star.checkCollision(playerCenterX, playerCenterY, playerCollisionRadius)) {
                this.score += this.config.SCORE.COLLECT_STAR;
                this.createCollectParticles(star.x, star.y, this.config.STARS.COLOR_MID);
                this.stars.splice(i, 1);
            }
        }
        
        // Colisión con gemas (usando método de Gem)
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];
            if (gem.checkCollision(playerCenterX, playerCenterY, playerCollisionRadius)) {
                if (this.lives < this.maxLives) {
                    this.lives++;
                }
                this.score += this.config.SCORE.COLLECT_GEM;
                this.createCollectParticles(gem.x, gem.getDisplayY(), this.config.GEMS.COLOR_MID);
                this.gems.splice(i, 1);
            }
        }
        
        // Colisión con powerUps
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];
            if (p.checkCollision(playerCenterX, playerCenterY, playerCollisionRadius)) {
                this.applyPowerUpEffect(p.kind);
                this.createCollectParticles(p.x, p.getDisplayY(), p.kind === 'shield' ? '#00ffff' : '#ffd700');
                if (window.SoundManager) window.SoundManager.play('collect');
                this.powerUps.splice(i,1);
            }
        }
        
        // Colisión con enemigos (usando método de Enemy)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.checkCollision(playerCenterX, playerCenterY, playerCollisionRadius)) {
                const wasInvulnerable = this.player.invulnerable || this.activeEffects.shield > 0;
                
                // Jugador recibe daño
                this.takeDamage();
                
                // Enemigo también recibe daño y puede ser destruido
                const destroyed = enemy.takeDamage(1);
                
                const center = enemy.getCenter();
                this.createExplosionParticles(center.x, center.y);
                if (window.SoundManager) window.SoundManager.play('explosion');
                
                if (destroyed) {
                    // Dar puntos según tipo de enemigo
                    switch(enemy.type) {
                        case 'drone':
                            this.score += this.config.SCORE.DESTROY_DRONE;
                            break;
                        case 'meteor':
                            this.score += this.config.SCORE.DESTROY_METEOR;
                            break;
                        case 'alien':
                            this.score += this.config.SCORE.DESTROY_ALIEN;
                            break;
                    }
                }
                
                // Solo salir si recibió daño real (no invulnerable)
                if (!wasInvulnerable) {
                    return;
                }
            }
        }
    }
    
    /**
     * Recibe daño
     */
    takeDamage() {
        //evitar dano si el juego ya terminó

        if(this.gameState === 'gameover') return;
        if (this.player.invulnerable || this.activeEffects.shield > 0) {
            console.log('🛡️ Daño bloqueado - Invulnerable:', this.player.invulnerable, 'Shield:', this.activeEffects.shield);
            return;
        }
        
        this.lives--;
        console.log('💔 Daño recibido! Vidas restantes:', this.lives);
        this.player.invulnerable = true;
        this.player.invulnerableTimer = 60; // 1 segundo de invulnerabilidad
        if (window.SoundManager) window.SoundManager.play('damage');
        
        if (this.lives <= 0) {
            console.log('💀 GAME OVER - Sin vidas');
            this.gameOver();
        }
    }
    
    /**
     * Incrementa velocidad del juego
     */
    updateGameSpeed() {
        this.gameSpeed += this.speedIncrement;
        this.gameSpeed = Math.min(this.gameSpeed, this.config.GAME.MAX_SPEED);
    }

    // ===== POWER UPS =====
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];
            p.update(this.gameSpeed * this.slowFactor, this.frameCount);
            if (p.isOffScreen()) this.powerUps.splice(i,1);
        }
    }

    spawnPowerUps() {
        this.powerUpSpawnTimer++;
        if (this.powerUpSpawnTimer < this.powerUpSpawnInterval) return;
        this.powerUpSpawnTimer = 0;
        if (Math.random() < 0.5) {
            const rand = Math.random();
            const shieldChance = this.config.POWERUPS.shield.SPAWN_CHANCE;
            const kind = rand < shieldChance ? 'shield' : 'slow';
            const y = 80 + Math.random() * (this.canvasHeight - 160);
            const x = this.canvasWidth + 50;
            this.powerUps.push(new PowerUp(x, y, kind));
        }
    }

    updateActiveEffects() {
        if (this.activeEffects.shield > 0) {
            this.activeEffects.shield--;
            if (this.activeEffects.shield === 0) {
                // Solo desactivar invulnerabilidad si no hay timer de daño activo
                if (this.player.invulnerableTimer <= 0) {
                    this.player.invulnerable = false;
                }
            }
        }
        if (this.activeEffects.slow > 0) {
            this.activeEffects.slow--;
            if (this.activeEffects.slow === 0) this.slowFactor = 1;
        }
    }

    applyPowerUpEffect(kind) {
        switch(kind) {
            case 'shield':
                this.activeEffects.shield = this.config.POWERUPS.shield.DURATION;
                this.player.invulnerable = true;
                break;
            case 'slow':
                this.activeEffects.slow = this.config.POWERUPS.slow.DURATION;
                this.slowFactor = this.config.POWERUPS.GLOBAL.EFFECT_SLOW_FACTOR;
                break;
        }
    }
    
    /**
     * Game Over
     */
    gameOver() {
        this.gameState = 'gameover';
        this.createExplosionParticles(this.player.x + this.player.width / 2, 
                                     this.player.y + this.player.height / 2);
        if (window.SoundManager) window.SoundManager.play('explosion');
        
        // Guardar mejor puntuación
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
    }
    
    /**
     * Pausa/Resume
     */
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
    
    /**
     * Inicia el juego
     */
    startGame() {
        this.reset();
    }
    
    /**
     * Formatea el tiempo
     */
    getFormattedTime() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Guarda mejor puntuación en localStorage
     */
    saveBestScore() {
        try {
            localStorage.setItem(this.config.STORAGE.BEST_SCORE_KEY, this.bestScore.toString());
        } catch (e) {
            console.warn('No se pudo guardar la mejor puntuación');
        }
    }
    
    /**
     * Carga mejor puntuación desde localStorage
     */
    loadBestScore() {
        try {
            const saved = localStorage.getItem(this.config.STORAGE.BEST_SCORE_KEY);
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }
}
