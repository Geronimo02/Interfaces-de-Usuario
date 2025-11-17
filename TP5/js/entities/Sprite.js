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
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAYAAABU1PscAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAABh0RVh0Q3JlYXRpb24gVGltZQAwOS8xNy8yNT8q4zYAAAB4SURBVGje7ZbBCcAgDEW7/0c7sFzJImM1AS0kQJqR8WKmQ7h4i3fd4+Y4gKjk9CVhLQnYvAPlUAswC9y2AY40k1qZf0K+agjm18AG4QzteWwSXzO8A+0wAX3L8IOm8x5nUadZsLe1ah1vA6MdZN9rZYR12zkJE6I0QJqR8WPovhU8QgZepVsAAAAASUVORK5CYII=',
    32, 32, 4, 8
);
