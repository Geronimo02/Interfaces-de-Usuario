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
        ctx.rotate(rotation * Math.PI/180);
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

// Sprite placeholder base64 (4 cuadros 32x32) - colores simples
window.PlayerSprite = new Sprite(
    'assets/img/Evasion.png', // Ruta relativa al index.html
    192, // ancho de cada frame del pájaro
    192, // alto de cada frame del pájaro
    9,  // cantidad de frames del sprite
    8  // fps de animación (ajusta si quieres más rápido/lento)
);
