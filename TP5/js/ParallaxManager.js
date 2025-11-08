class ParallaxManager {
    constructor() {
        this.layers = [];
        this.gameSpeed = 1;
        this.initialized = false;
        this.animatedElements = [];
        
        this.initializeLayers();
        this.createAnimatedElements();
    }
    
    initializeLayers() {
        const layerElements = document.querySelectorAll('.parallax-layer');
        
        layerElements.forEach(element => {
            const speed = parseFloat(element.dataset.speed) || 0.5;
            this.layers.push({
                element: element,
                speed: speed,
                x: 0,
                width: element.offsetWidth
            });
        });
        
        this.initialized = true;
    }
    
    update(deltaTime, gameSpeed = 1) {
        if (!this.initialized) return;
        
        this.gameSpeed = gameSpeed;
        
        this.layers.forEach(layer => {
            // Calculate movement based on speed and game speed
            const movement = layer.speed * this.gameSpeed * deltaTime * 0.1;
            layer.x -= movement;
            
            // Reset position when layer has moved completely
            if (Math.abs(layer.x) >= layer.width / 3) {
                layer.x = 0;
            }
            
            // Apply transform
            layer.element.style.transform = `translateX(${layer.x}px)`;
        });
    }
    
    setGameSpeed(speed) {
        this.gameSpeed = speed;
    }
    
    addDynamicElements() {
        // Add shooting stars
        this.createShootingStar();
        
        // Schedule next shooting star
        setTimeout(() => {
            this.addDynamicElements();
        }, Math.random() * 10000 + 5000); // Every 5-15 seconds
    }
    
    createShootingStar() {
        const star = document.createElement('div');
        star.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 10px white;
            z-index: 5;
        `;
        
        const startX = window.innerWidth;
        const startY = Math.random() * window.innerHeight * 0.3;
        const endX = -100;
        const endY = startY + Math.random() * 200 - 100;
        
        star.style.left = startX + 'px';
        star.style.top = startY + 'px';
        
        document.body.appendChild(star);
        
        // Animate shooting star
        star.animate([
            { transform: `translate(0, 0)`, opacity: 0 },
            { transform: `translate(-50px, 10px)`, opacity: 1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px)`, opacity: 0 }
        ], {
            duration: 2000,
            easing: 'linear'
        }).onfinish = () => {
            star.remove();
        };
    }
    
    createAnimatedElements() {
        // Create animated clouds
        for (let i = 0; i < 8; i++) {
            this.createAnimatedCloud();
        }
        
        // Create animated background birds
        for (let i = 0; i < 5; i++) {
            this.createAnimatedBird();
        }
        
        // Create floating debris
        for (let i = 0; i < 6; i++) {
            this.createSpaceDebris();
        }
    }
    
    createAnimatedCloud() {
        const cloud = document.createElement('div');
        cloud.className = 'animated-cloud';
        cloud.style.cssText = `
            top: ${Math.random() * 200}px;
            left: ${window.innerWidth + Math.random() * 200}px;
            animation-delay: ${Math.random() * 5}s;
            opacity: ${0.3 + Math.random() * 0.4};
        `;
        
        document.querySelector('.parallax-container').appendChild(cloud);
        this.animatedElements.push(cloud);
        
        // Remove and recreate when off screen
        setTimeout(() => {
            if (cloud.parentElement) {
                cloud.remove();
                this.createAnimatedCloud();
            }
        }, 15000);
    }
    
    createAnimatedBird() {
        const bird = document.createElement('div');
        bird.className = 'animated-bird';
        bird.style.cssText = `
            top: ${Math.random() * 300 + 50}px;
            left: ${window.innerWidth + Math.random() * 300}px;
            animation-delay: ${Math.random() * 3}s;
            z-index: 3;
        `;
        
        document.querySelector('.parallax-container').appendChild(bird);
        this.animatedElements.push(bird);
        
        // Animate across screen
        bird.animate([
            { transform: 'translateX(0)' },
            { transform: `translateX(-${window.innerWidth + 400}px)` }
        ], {
            duration: 12000 + Math.random() * 8000,
            easing: 'linear'
        }).onfinish = () => {
            bird.remove();
            this.createAnimatedBird();
        };
    }
    
    addSpaceDebris(x, y) {
        const debris = document.createElement('div');
        debris.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #888;
            z-index: 6;
            left: ${x}px;
            top: ${y}px;
        `;
        
        document.querySelector('.parallax-container').appendChild(debris);
        
        // Animate debris
        debris.animate([
            { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
            { transform: 'translate(-200px, 50px) rotate(360deg)', opacity: 0 }
        ], {
            duration: 3000,
            easing: 'ease-out'
        }).onfinish = () => {
            debris.remove();
        };
    }
    
    createSpaceDebris() {
        const debris = document.createElement('div');
        debris.className = 'space-debris';
        debris.style.width = `${4 + Math.random() * 6}px`;
        debris.style.height = `${4 + Math.random() * 6}px`;
        debris.style.top = `${Math.random() * window.innerHeight}px`;
        debris.style.left = `${window.innerWidth + Math.random() * 200}px`;
        debris.style.zIndex = '2';
        debris.style.animationDelay = `${Math.random() * 5}s`;
        debris.style.animationDuration = `${20 + Math.random() * 10}s`;
        
        document.querySelector('.parallax-container').appendChild(debris);
        
        // Remove after animation completes
        setTimeout(() => {
            if (debris.parentElement) {
                debris.remove();
                this.createSpaceDebris();
            }
        }, 30000);
    }
}
