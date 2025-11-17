/**
 * ParallaxManager.js
 * Controla movimiento de capas parallax basado en gameSpeed.
 */
class ParallaxManager {
    constructor() {
        this.layers = {
            far: document.getElementById('stars-far'),
            mid: document.getElementById('stars-mid'),
            nebula: document.getElementById('nebula'),
            near: document.getElementById('stars-near')
        };
        this.positions = { far:0, mid:0, nebula:0, near:0 };
        this.disableCSSAnimations();
    }

    disableCSSAnimations() {
        Object.values(this.layers).forEach(el => { if (el) el.style.animation = 'none'; });
    }

    update(gameSpeed) {
        // Factores
        const cfg = GameConfig.PARALLAX;
        this.positions.far -= cfg.SPEED_FAR * gameSpeed * 0.05;
        this.positions.mid -= cfg.SPEED_MID * gameSpeed * 0.05;
        this.positions.nebula -= cfg.SPEED_NEBULA * gameSpeed * 0.05;
        this.positions.near -= cfg.SPEED_NEAR * gameSpeed * 0.05;

        // Loop infinito (mod % width aproximado usando 50vw)
        this.applyTransform('far', this.positions.far);
        this.applyTransform('mid', this.positions.mid);
        this.applyTransform('nebula', this.positions.nebula);
        this.applyTransform('near', this.positions.near);
    }

    applyTransform(key, pos) {
        const el = this.layers[key];
        if (!el) return;
        // Mantener desplazamiento dentro de -100%..0 para repetición suave
        const norm = pos % (window.innerWidth);
        el.style.transform = `translateX(${norm}px)`;
    }
}

window.ParallaxManager = new ParallaxManager();
