export class Personaje {
    
    constructor(nombre, rutaSprite, salud, x, y) {
        this.nombre = nombre;
        this.rutaSprite = rutaSprite;
        this.salud = salud;
        this.x = x;
        this.y = y;
        this.elemento = null; // El elemento del DOM se asignará en las subclases
    }
    
    // Usa getBoundingClientRect para obtener la posición y tamaño VISUAL REAL
    getRect() {
        if (!this.elemento) return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
        return this.elemento.getBoundingClientRect();
    }
    
    // Elimina el personaje del juego
    destruir() {
        if (this.elemento) {
            this.elemento.remove();
        }
    }

}