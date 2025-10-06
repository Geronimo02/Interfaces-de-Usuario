class GalleryCarousel {
    constructor() {
        this.slider = document.querySelector('.slider');
        this.items = document.querySelectorAll('.slider .item');
        this.prevBtn = document.querySelector('.gallery-nav-left');
        this.nextBtn = document.querySelector('.gallery-nav-right');
        
        this.currentIndex = 0;
        this.totalItems = this.items.length;
        
        if (this.slider && this.items.length > 0) {
            this.init();
        }
    }

    init() {
        // Establecer el primer elemento como activo
        this.updateActiveItem();
        
        // Agregar event listeners
        this.prevBtn?.addEventListener('click', () => this.prevSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());
        
        // Navegación con teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
        });
        
        // Auto-play opcional (descomentár para activar)
        // this.startAutoPlay();
        
        // Touch/swipe support para móviles
        this.addTouchSupport();
        
        console.log('Gallery carousel initialized with', this.totalItems, 'items');
    }

    nextSlide() {
        this.currentIndex = (this.currentIndex + 1) % this.totalItems;
        this.updateCarousel();
    }

    prevSlide() {
        this.currentIndex = (this.currentIndex - 1 + this.totalItems) % this.totalItems;
        this.updateCarousel();
    }

    goToSlide(index) {
        if (index >= 0 && index < this.totalItems) {
            this.currentIndex = index;
            this.updateCarousel();
        }
    }

    updateCarousel() {
        // Calcular la rotación basada en el índice actual
        const rotationY = -(this.currentIndex * (360 / this.totalItems));
        
        // Aplicar la rotación al slider
        this.slider.style.transform = `translate(-50%, -50%) perspective(1000px) rotateY(${rotationY}deg)`;
        
        // Actualizar elemento activo
        this.updateActiveItem();
        
        // Agregar efecto de "bounce" a los botones
        this.animateButton(this.currentIndex > 0 ? this.prevBtn : this.nextBtn);
    }

    updateActiveItem() {
        // Remover clase active de todos los elementos
        this.items.forEach(item => item.classList.remove('active'));
        
        // Agregar clase active al elemento actual
        if (this.items[this.currentIndex]) {
            this.items[this.currentIndex].classList.add('active');
        }
    }

    animateButton(button) {
        if (button) {
            button.style.transform = 'translateY(-50%) scale(1.2)';
            setTimeout(() => {
                button.style.transform = 'translateY(-50%) scale(1)';
            }, 150);
        }
    }

    startAutoPlay(interval = 4000) {
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, interval);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    addTouchSupport() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        this.slider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        this.slider.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const deltaX = startX - endX;
            const deltaY = Math.abs(startY - endY);
            
            // Solo procesar swipe horizontal si es más horizontal que vertical
            if (Math.abs(deltaX) > 50 && deltaY < 100) {
                if (deltaX > 0) {
                    this.nextSlide(); // Swipe left = next
                } else {
                    this.prevSlide(); // Swipe right = prev
                }
            }
        });

        // Prevenir el comportamiento por defecto del scroll
        this.slider.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    // Método público para obtener información del carrusel
    getInfo() {
        return {
            currentIndex: this.currentIndex,
            totalItems: this.totalItems,
            currentItem: this.items[this.currentIndex]
        };
    }

    // Método para agregar indicadores de progreso (opcional)
    addProgressIndicators() {
        const container = document.querySelector('.gallery-container');
        if (!container) return;

        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'gallery-indicators';
        
        for (let i = 0; i < this.totalItems; i++) {
            const indicator = document.createElement('button');
            indicator.className = `indicator ${i === 0 ? 'active' : ''}`;
            indicator.setAttribute('aria-label', `Ir a imagen ${i + 1}`);
            indicator.addEventListener('click', () => this.goToSlide(i));
            indicatorsContainer.appendChild(indicator);
        }
        
        container.appendChild(indicatorsContainer);
        this.indicators = indicatorsContainer.querySelectorAll('.indicator');
    }

    updateIndicators() {
        if (this.indicators) {
            this.indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === this.currentIndex);
            });
        }
    }
}

// Inicializar el carrusel cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const gallery = new GalleryCarousel();
    
    // Hacer la instancia global para debugging (opcional)
    window.galleryCarousel = gallery;
    
    // Agregar indicadores si se desea
    // gallery.addProgressIndicators();
});

// Función auxiliar para manejar errores de carga de imágenes
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('.slider .item img');
    
    images.forEach((img, index) => {
        img.addEventListener('load', () => {
            console.log(`Image ${index + 1} loaded successfully`);
        });
        
        img.addEventListener('error', () => {
            console.warn(`Failed to load image ${index + 1}:`, img.src);
            // Opcional: mostrar imagen de placeholder
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f0f0f0"/><text x="150" y="100" text-anchor="middle" fill="%23999">Imagen no disponible</text></svg>';
        });
    });
});
