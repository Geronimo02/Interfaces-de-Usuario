/**
 * Sprite.js
 * Maneja animación de spritesheet simple.
 * Uso: const sp = new Sprite(imgSrc, frameWidth, frameHeight, frames, fps)
 */
class Sprite {
    constructor(src, frameWidth, frameHeight, frameCount, fps = 12) {
        this.image = new Image();
        this.image.src = src; // Puede ser base64 o ruta
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.fps = fps;
        this.currentFrame = 0;
        this.accumulator = 0;
        this.loaded = false;
        this.image.onload = () => { this.loaded = true; };
    }

    update(delta) {
        if (!this.loaded) return;
        this.accumulator += delta;
        const frameDuration = 1000 / this.fps;
        while (this.accumulator >= frameDuration) {
            this.accumulator -= frameDuration;
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        }
    }

    draw(ctx, x, y, width, height, rotation = 0) {
        if (!this.loaded) return false;
        ctx.save();
        ctx.translate(x + width/2, y + height/2);
        // Rotar 90 grados para que mire a la derecha + rotación del juego
        ctx.rotate((rotation + 90) * Math.PI/180);
        ctx.translate(-width/2, -height/2);
        ctx.drawImage(
            this.image,
            this.currentFrame * this.frameWidth,
            0,
            this.frameWidth,
            this.frameHeight,
            0,
            0,
            width,
            height
        );
        ctx.restore();
        return true;
    }
}

/**
 * MultiImageSprite - Maneja múltiples imágenes para diferentes estados
 */
class MultiImageSprite {
    constructor(states) {
        this.states = {};
        this.currentState = 'idle';
        this.loaded = false;
        this.loadedCount = 0;
        this.totalImages = Object.keys(states).length;
        
        // Cargar cada imagen
        Object.keys(states).forEach(stateName => {
            const img = new Image();
            img.onload = () => {
                this.loadedCount++;
                if (this.loadedCount === this.totalImages) {
                    this.loaded = true;
                    console.log('✅ Todos los sprites cargados:', Object.keys(states));
                }
            };
            img.onerror = () => {
                console.error('❌ Error cargando sprite:', states[stateName]);
            };
            img.src = states[stateName];
            this.states[stateName] = img;
        });
    }
    
    setState(state) {
        if (this.states[state]) {
            this.currentState = state;
        }
    }
    
    update(delta) {
        // Para futuras animaciones
    }
    
    draw(ctx, x, y, width, height, rotation = 0) {
        if (!this.loaded) return false;
        
        const img = this.states[this.currentState];
        if (!img) return false;
        
        ctx.save();
        ctx.translate(x + width/2, y + height/2);
        // Rotar 90 grados para que mire a la derecha + rotación del juego
        ctx.rotate((rotation + 90) * Math.PI/180);
        ctx.translate(-width/2, -height/2);
        ctx.drawImage(img, 0, 0, width, height);
        ctx.restore();
        return true;
    }
}

/**
 * AnimatedMultiStateSprite - Combina múltiples spritesheets animados
 */
class AnimatedMultiStateSprite {
    constructor(states) {
        this.states = {};
        this.currentState = 'idle';
        this.loaded = false;
        this.loadedCount = 0;
        this.totalStates = Object.keys(states).length;
        
        // Crear Sprite animado para cada estado
        Object.keys(states).forEach(stateName => {
            const config = states[stateName];
            const sprite = new Sprite(
                config.src,
                config.frameWidth,
                config.frameHeight,
                config.frameCount,
                config.fps || 12
            );
            
            // Detectar cuando cada sprite se carga
            const checkLoaded = () => {
                if (sprite.loaded) {
                    this.loadedCount++;
                    if (this.loadedCount === this.totalStates) {
                        this.loaded = true;
                        console.log('✅ Todos los sprites animados cargados:', Object.keys(states));
                    }
                } else {
                    setTimeout(checkLoaded, 50);
                }
            };
            checkLoaded();
            
            this.states[stateName] = sprite;
        });
    }
    
    setState(state) {
        if (this.states[state]) {
            this.currentState = state;
        }
    }
    
    update(delta) {
        if (this.loaded && this.states[this.currentState]) {
            this.states[this.currentState].update(delta);
        }
    }
    
    draw(ctx, x, y, width, height, rotation = 0) {
        if (!this.loaded) return false;
        
        const sprite = this.states[this.currentState];
        if (!sprite) return false;
        
        return sprite.draw(ctx, x, y, width, height, rotation);
    }
}

// Configuración del sprite del jugador con múltiples estados animados
// Cada sprite tiene múltiples frames en horizontal
window.PlayerSprite = new AnimatedMultiStateSprite({
    idle: {
        src: 'assets/images/Move.png',
        frameWidth: 64,    // Ancho de cada frame individual
        frameHeight: 64,   // Alto de cada frame
        frameCount: 4,     // Cantidad de frames en el spritesheet
        fps: 10            // Velocidad de animación
    },
    thrust: {
        src: 'assets/images/Boost.png',
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 4,
        fps: 12
    },
    explosion: {
        src: 'assets/images/Destroyed.png',
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 8,     // La explosión probablemente tiene más frames
        fps: 15
    },
    shield: {
        src: 'assets/images/Evasion.png',
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 4,
        fps: 10
    }
});
