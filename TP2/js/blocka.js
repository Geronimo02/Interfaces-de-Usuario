// ========================================================================
// --- CONFIGURACIÓN DEL JUEGO CON NUEVAS PROPIEDADES ---
// ========================================================================
const GAME_CONFIG = {
    images: [
        '../assets/img/images-4.jpeg',
        '../assets/img/images-5.jpeg',
        '../assets/img/images-6.jpeg',
        '../assets/img/images-7.jpeg',
        '../assets/img/images-8.jpeg',
        '../assets/img/simp.jpg',
        '../assets/img/simps.jpg'
    ],
    levels: {
        1: { filterTypes: ['none'], name: 'Nivel 1' },
        2: { filterTypes: ['grayscale'], name: 'Nivel 2' },
        3: { filterTypes: ['brightness', 'grayscale'], name: 'Nivel 3', maxTime: 20 },
        4: { filterTypes: ['invert', 'brightness'], name: 'Nivel 4', maxTime: 15 }
    },
    blockConfigs: {
        4: { rows: 2, cols: 2 },
        6: { rows: 2, cols: 3 },
        8: { rows: 2, cols: 4 }
    }
};

/* =====================
     Menú principal dentro del Canvas
     ===================== */

;(function(){
    const canvas = document.getElementById('canvasblocka') || document.getElementById('canvasBlocka');
    if (!canvas) {
        console.warn('Canvas de Blocka no encontrado (busqué ids canvasblocka/canvasBlocka). No se inicializa el menú.');
        return;
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Estado del menú
    const menuState = {
        selectedBlocks: 4,
        hovered: null,
        rects: {},
        enabled: true,
        isLoading: true, // <-- Nuevo estado para precarga
        loadingError: null // <-- AÑADIR ESTA LÍNEA
    };

    const styles = {
        bg: '#0f1220',
        panel: 'rgba(255,255,255,0.04)',
        title: '#ffffff',
        subtitle: '#aab7d6',
        buttonBg: '#5a9fd4',
        buttonBgHover: '#7ab8e8',
        optionBg: 'rgba(255,255,255,0.06)',
        optionBgSel: '#4caf50'
    };
    function fitCanvas() {
        const cssW = Math.max(1, canvas.clientWidth || canvas.getBoundingClientRect().width);
        const cssH = Math.max(1, canvas.clientHeight || canvas.getBoundingClientRect().height);
        canvas.width = Math.max(1, Math.floor(cssW * dpr));
        canvas.height = Math.max(1, Math.floor(cssH * dpr));
        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        if (ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
        if (gameState.phase !== 'menu') calculateGameLayout();
        else layoutRects();
        render();
    }
    function layoutRects(){
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        const centerX = w/2;
        const topY = Math.max(40, h*0.18);
        const optW = 88;
        const optH = 46;
        const gap = 18;
        const totalW = optW*3 + gap*2;
        const startX = centerX - totalW/2;
        menuState.rects = {
            title: { x: centerX, y: topY-20 },
            opts: [
                { id: 'opt-4', x: startX, y: topY + 60, w: optW, h: optH },
                { id: 'opt-6', x: startX + (optW+gap), y: topY + 60, w: optW, h: optH },
                { id: 'opt-8', x: startX + 2*(optW+gap), y: topY + 60, w: optW, h: optH }
            ],
            start: { x: centerX - 120/2, y: topY + 140, w: 120, h: 52 }
        };
    }
    function clear() {
        if (!ctx) return;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.clearRect(0,0,w,h);
    }
    function renderMenuOriginal(){
        if (!ctx) return;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        clear();
        ctx.fillStyle = styles.bg;
        ctx.fillRect(0,0,w,h);
        const topY = Math.max(40, h*0.18);
        ctx.fillStyle = styles.title;
        ctx.textAlign = 'center';
        ctx.font = 'bold 34px Inter, system-ui, sans-serif';
        ctx.fillText('BLOCKA', w/2, topY + 28);
        ctx.fillStyle = styles.subtitle;
        ctx.font = '16px Inter, system-ui, sans-serif';
        ctx.fillText('Gira las piezas y reconstruye la imagen', w/2, topY + 58);

        if (menuState.isLoading) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px Inter, system-ui, sans-serif';
            ctx.fillText('Cargando imágenes...', w/2, h/2 + 40);
            return;
        }

        // AÑADIR ESTE BLOQUE PARA MOSTRAR EL ERROR
        if (menuState.loadingError) {
            ctx.fillStyle = '#ff8a80'; // Un color rojo para el error
            ctx.font = '14px Inter, system-ui, sans-serif';
            ctx.fillText(menuState.loadingError, w/2, h - 50);
        }

        for (const opt of menuState.rects.opts){
            const isSel = menuState.selectedBlocks === parseInt(opt.id.split('-')[1]);
            const isHover = menuState.hovered === opt.id;
            drawOption(opt.x, opt.y, opt.w, opt.h, opt.id.split('-')[1], isSel, isHover);
        }
        const st = menuState.rects.start;
        const hoverStart = menuState.hovered === 'start';
        drawStart(st.x, st.y, st.w, st.h, hoverStart);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillText('Selecciona número de piezas y pulsa Comenzar', w/2, h - 28);
    }
    function drawOption(x,y,w,h,label,selected,hover){
        ctx.save();
        if (selected) ctx.fillStyle = styles.optionBgSel; else ctx.fillStyle = (hover? 'rgba(255,255,255,0.09)': styles.optionBg);
        roundRectFill(ctx, x, y, w, h, 10);
        ctx.fillStyle = selected ? '#fff' : '#e6eef9';
        ctx.font = '600 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w/2, y + h/2 + 1);
        ctx.restore();
    }
    function drawStart(x,y,w,h,hover){
        ctx.save();
        ctx.fillStyle = hover ? styles.buttonBgHover : styles.buttonBg;
        roundRectFill(ctx, x, y, w, h, 12);
        ctx.fillStyle = '#06202a';
        ctx.font = '600 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Comenzar', x + w/2, y + h/2 + 1);
        ctx.restore();
    }
    function roundRectFill(ctx,x,y,w,h,r){
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.arcTo(x+w,y,x+w,y+h,r);
        ctx.arcTo(x+w,y+h,x,y+h,r);
        ctx.arcTo(x,y+h,x,y,r);
        ctx.arcTo(x,y,x+w,y,r);
        ctx.closePath();
        ctx.fill();
    }
    function getPointerPos(evt){
        const r = canvas.getBoundingClientRect();
        return { x: evt.clientX - r.left, y: evt.clientY - r.top };
    }
    function hitTest(x,y){
        if (menuState.isLoading) return null;
        for (const opt of menuState.rects.opts){
            if (x >= opt.x && x <= opt.x + opt.w && y >= opt.y && y <= opt.y + opt.h) return opt.id;
        }
        const s = menuState.rects.start;
        if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return 'start';
        return null;
    }
    canvas.addEventListener('pointermove', e => {
        if (!menuState.enabled) return;
        const p = getPointerPos(e);
        const hit = hitTest(p.x, p.y);
        if (hit !== menuState.hovered){
            menuState.hovered = hit;
            render();
            canvas.style.cursor = hit ? 'pointer' : 'default';
        }
    });
    canvas.addEventListener('pointerdown', e => {
        if (!menuState.enabled) return;
        const p = getPointerPos(e);
        const hit = hitTest(p.x, p.y);
        if (!hit) return;
        if (hit.startsWith('opt-')){
            menuState.selectedBlocks = parseInt(hit.split('-')[1]);
            render();
            return;
        }
        if (hit === 'start'){
            menuState.enabled = false;
            render();
            const detail = { blocks: menuState.selectedBlocks };
            window.dispatchEvent(new CustomEvent('blocka:start', { detail }));
            console.info('blocka:start', detail);
        }
    });
    canvas.addEventListener('pointerleave', () => {
        if (menuState.hovered){ menuState.hovered = null; render(); canvas.style.cursor = 'default'; }
    });
    window.addEventListener('keydown', (e) => {
        if (!menuState.enabled) return;
        if (e.key === 'ArrowLeft' || e.key === 'a'){
            menuState.selectedBlocks = menuState.selectedBlocks === 4 ? 8 : (menuState.selectedBlocks === 6 ? 4 : 6);
            render();
        }
        if (e.key === 'ArrowRight' || e.key === 'd'){
            menuState.selectedBlocks = menuState.selectedBlocks === 4 ? 6 : (menuState.selectedBlocks === 6 ? 8 : 4);
            render();
        }
        if (e.key === 'Enter'){
            window.dispatchEvent(new CustomEvent('blocka:start', { detail: { blocks: menuState.selectedBlocks } }));
            menuState.enabled = false;
            render();
        }
    });
    
    /* =====================
       Lógica del juego
       ===================== */
    const gameState = {
        phase: 'menu', // 'menu', 'image-selection', 'playing', 'win', 'lost'
        allImages: [], // <-- Para guardar las imágenes precargadas
        level: 1,
        blocks: 4,
        rows: 0,
        cols: 0,
        pieces: [],
        image: null,
        unfilteredOffCanvas: null,
        moves: 0,
        showWinScreen: false,
        startTime: null,
        elapsed: 0,
        timeLeft: 0,
        timerId: null,
        isPaused: false,
        hud: { height: 56, pauseRect: null, ayudaRect: null, helpUsed: false },
        selectionAnimation: { running: false, startTime: 0, duration: 3000, finalIndex: 0 }
    };

    const touchState = {
        lastTap: 0,
        tapTimeout: null,
        longPressTimeout: null,
        longPressFired: false
    };

    function loadImage(src){
        return new Promise((resolve,reject)=>{
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    function preloadAllImages() {
        const imagePromises = GAME_CONFIG.images.map(src => loadImage(src));
        Promise.all(imagePromises).then(loadedImages => {
            gameState.allImages = loadedImages;
            menuState.isLoading = false;
            render();
            console.log('Todas las imágenes han sido precargadas.');
        }).catch(err => {
            console.error("Error precargando una o más imágenes:", err);
            // AÑADIR ESTAS LÍNEAS PARA MANEJAR EL ERROR
            menuState.isLoading = false;
            menuState.loadingError = "Error al cargar imágenes. Revisa las rutas.";
            render();
        });
    }

    // --- FUNCIONES DE FILTROS CON IMAGEDATA ---
    function applyGrayscaleFilter(imageData) {
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
        }
    }
    function applyBrightnessFilter(imageData) {
        const pixels = imageData.data;
        const adjustment = 255 * 0.3;
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = Math.max(0, Math.min(255, pixels[i] - adjustment));
            pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] - adjustment));
            pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] - adjustment));
        }
    }
    function applyInvertFilter(imageData) {
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = 255 - pixels[i];
            pixels[i + 1] = 255 - pixels[i + 1];
            pixels[i + 2] = 255 - pixels[i + 2];
        }
    }
    
    // --- GESTIÓN DE RÉCORDS ---
    function getBestTime(level, blocks) {
        const key = `blocka_best_time_${level}_${blocks}`;
        return localStorage.getItem(key) ? parseInt(localStorage.getItem(key), 10) : null;
    }

    function saveBestTime(level, blocks, time) {
        const key = `blocka_best_time_${level}_${blocks}`;
        const existingBest = getBestTime(level, blocks);
        if (!existingBest || time < existingBest) {
            localStorage.setItem(key, time);
        }
    }

    function startGame(blocks, level = 1){
        menuState.enabled = false;
        Object.assign(gameState, {
            level, blocks, moves: 0, showWinScreen: false,
            elapsed: 0, timeLeft: 0, isPaused: false, pieces: [], image: null, unfilteredOffCanvas: null
        });
        gameState.hud.helpUsed = false;
        
        // Iniciar la animación de selección
        gameState.phase = 'image-selection';
        gameState.selectionAnimation.running = true;
        gameState.selectionAnimation.startTime = Date.now();
        gameState.selectionAnimation.finalIndex = Math.floor(Math.random() * gameState.allImages.length);
        
        requestAnimationFrame(render);
    }

    function initializeLevel() {
        const img = gameState.allImages[gameState.selectionAnimation.finalIndex];
        const square = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - square) / 2;
        const sy = (img.naturalHeight - square) / 2;

        const unfilteredCanvas = document.createElement('canvas');
        unfilteredCanvas.width = square;
        unfilteredCanvas.height = square;
        unfilteredCanvas.getContext('2d').drawImage(img, sx, sy, square, square, 0, 0, square, square);
        gameState.unfilteredOffCanvas = unfilteredCanvas;
        gameState.image = img;

        const cfg = GAME_CONFIG.blockConfigs[gameState.blocks];
        gameState.rows = cfg.rows;
        gameState.cols = cfg.cols;
        
        setupPieces();
        
        gameState.phase = 'playing';
        startTimer();
        render();
    }

    function setupPieces(){
        gameState.pieces = [];
        const levelConfig = GAME_CONFIG.levels[gameState.level];
        const pieceWidth = gameState.unfilteredOffCanvas.width / gameState.cols;
        const pieceHeight = gameState.unfilteredOffCanvas.height / gameState.rows;

        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                const pieceCanvas = document.createElement('canvas');
                pieceCanvas.width = pieceWidth;
                pieceCanvas.height = pieceHeight;
                const pieceCtx = pieceCanvas.getContext('2d');

                pieceCtx.drawImage(
                    gameState.unfilteredOffCanvas,
                    c * pieceWidth, r * pieceHeight, pieceWidth, pieceHeight,
                    0, 0, pieceWidth, pieceHeight
                );

                if (levelConfig.filterTypes[0] !== 'none') {
                    const filterType = levelConfig.filterTypes[Math.floor(Math.random() * levelConfig.filterTypes.length)];
                    const imageData = pieceCtx.getImageData(0, 0, pieceWidth, pieceHeight);
                    switch (filterType) {
                        case 'grayscale': applyGrayscaleFilter(imageData); break;
                        case 'brightness': applyBrightnessFilter(imageData); break;
                        case 'invert': applyInvertFilter(imageData); break;
                    }
                    pieceCtx.putImageData(imageData, 0, 0);
                }

                gameState.pieces.push({
                    r, c,
                    rotation: [0, 90, 180, 270][Math.floor(Math.random() * 4)],
                    isFixed: false,
                    pieceCanvas: pieceCanvas
                });
            }
        }
        calculateGameLayout();
    }

    function calculateGameLayout(){
        const cssW = canvas.width / dpr;
        const cssH = canvas.height / dpr;
        const hudH = gameState.hud.height;
        const padding = 12;
        const areaW = cssW - padding*2;
        const areaH = cssH - hudH - padding*2;
        const pieceSize = Math.floor(Math.min(areaW / gameState.cols, areaH / gameState.rows));
        const gridW = pieceSize * gameState.cols;
        const gridH = pieceSize * gameState.rows;
        const areaX = padding + Math.floor((areaW - gridW) / 2);
        const areaY = hudH + padding + Math.floor((areaH - gridH) / 2);

        gameState.layout = {
            cssW, cssH,
            hudX: 12, hudY: 8, hudW: cssW-24, hudH,
            areaX: padding, areaY: hudH + padding, areaW, areaH,
            gridX: areaX, gridY: areaY, gridW, gridH,
            pieceSize
        };
    }
    
    function startTimer(){
        const levelConfig = GAME_CONFIG.levels[gameState.level];
        const initialTime = levelConfig.maxTime ? 0 : gameState.elapsed;
        gameState.startTime = Date.now() - initialTime;
        
        if (gameState.timerId) clearInterval(gameState.timerId);
        
        gameState.timerId = setInterval(() => {
            if (!gameState.isPaused && gameState.phase === 'playing') {
                if (levelConfig.maxTime) {
                    const elapsed = Date.now() - gameState.startTime;
                    gameState.timeLeft = (levelConfig.maxTime * 1000) - elapsed;
                    if (gameState.timeLeft <= 0) {
                        gameState.timeLeft = 0;
                        gameState.phase = 'lost';
                        stopTimer();
                    }
                } else {
                    gameState.elapsed = Date.now() - gameState.startTime;
                }
                render();
            }
        }, 100);
    }

    function stopTimer(){ if (gameState.timerId){ clearInterval(gameState.timerId); gameState.timerId = null; } }
    function formatTime(ms){ const s = Math.floor(ms/1000); const m = Math.floor(s/60); const sec = s%60; return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`; }
    
    function useHelp() {
        if (gameState.hud.helpUsed || gameState.phase !== 'playing') return;
        
        const incorrectPiece = gameState.pieces.find(p => p.rotation % 360 !== 0 && !p.isFixed);
        
        if (incorrectPiece) {
            incorrectPiece.rotation = 0;
            incorrectPiece.isFixed = true;
            gameState.hud.helpUsed = true;
            gameState.moves = (gameState.moves || 0) + 1;
            
            const penalty = 5000;
            gameState.startTime -= penalty;
            
            const won = gameState.pieces.every(p => (p.rotation % 360) === 0);
            if (won) {
                stopTimer();
                gameState.phase = 'win';
            }
            render();
        }
    }

    function renderGame(){
        clear();
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.fillStyle = '#08111a'; ctx.fillRect(0,0,w,h);
        if (!gameState.image || !gameState.layout) {
            ctx.fillStyle = '#fff'; ctx.font = '600 18px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText('Cargando...', w/2, h/2);
            return;
        }
        
        const hud = gameState.layout;
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; roundRectFill(ctx, hud.hudX, hud.hudY, hud.hudW, hud.hudH, 8);
        ctx.fillStyle = '#fff'; ctx.font = '600 14px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        
        const levelConfig = GAME_CONFIG.levels[gameState.level];
        ctx.fillText(`Nivel: ${gameState.level} (${gameState.blocks} piezas)`, hud.hudX + 16, hud.hudY + hud.hudH/2);
        
        let timeToDisplay = levelConfig.maxTime ? formatTime(gameState.timeLeft) : formatTime(gameState.elapsed);
        ctx.textAlign = 'center'; ctx.fillText(timeToDisplay, hud.hudX + hud.hudW/2, hud.hudY + hud.hudH/2);
        
        const movesX = hud.hudX + hud.hudW/2 + 80;
        ctx.textAlign = 'left';
        ctx.fillText('Mov: ' + (gameState.moves || 0), movesX, hud.hudY + hud.hudH/2);

        const pauseW = 80, pauseH = 32;
        const px = hud.hudX + hud.hudW - pauseW - 12;
        const py = hud.hudY + (hud.hudH - pauseH)/2;
        ctx.fillStyle = gameState.isPaused ? 'rgba(255,100,100,0.9)' : styles.buttonBg;
        roundRectFill(ctx, px, py, pauseW, pauseH, 8);
        ctx.fillStyle = '#06202a'; ctx.textAlign='center'; ctx.fillText(gameState.isPaused ? 'Reanudar' : 'Pausa', px + pauseW/2, py + pauseH/2 + 1);
        gameState.hud.pauseRect = { x: px, y: py, w: pauseW, h: pauseH };

        if (!gameState.hud.helpUsed && gameState.phase === 'playing') {
            const ayudaW = 80, ayudaH = 32;
            const ax = px - ayudaW - 12;
            const ay = py;
            ctx.fillStyle = 'rgba(100, 181, 246, 0.8)';
            roundRectFill(ctx, ax, ay, ayudaW, ayudaH, 8);
            ctx.fillStyle = '#06202a'; ctx.textAlign='center'; ctx.fillText('Ayudita', ax + ayudaW/2, ay + ayudaH/2 + 1);
            gameState.hud.ayudaRect = { x: ax, y: ay, w: ayudaW, h: ayudaH };
        } else {
            gameState.hud.ayudaRect = null;
        }

        const area = gameState.layout;
        const sW = gameState.unfilteredOffCanvas.width / gameState.cols;
        const sH = gameState.unfilteredOffCanvas.height / gameState.rows;
        const ps = area.pieceSize;

        for (const p of gameState.pieces) {
            const dx = area.gridX + p.c * ps;
            const dy = area.gridY + p.r * ps;
            const dw = ps, dh = ps;
            
            ctx.save();
            ctx.translate(dx + dw/2, dy + dh/2);
            ctx.rotate((p.rotation * Math.PI) / 180);

            if (gameState.phase === 'win') {
                const sx = p.c * sW, sy = p.r * sH;
                ctx.drawImage(gameState.unfilteredOffCanvas, sx, sy, sW, sH, -dw/2, -dh/2, dw, dh);
            } else {
                ctx.drawImage(p.pieceCanvas, -dw/2, -dh/2, dw, dh);
            }
            
            if (p.isFixed) {
                ctx.globalAlpha = 0.6;
                ctx.strokeStyle = '#4caf50';
                ctx.lineWidth = 4;
                ctx.strokeRect(-dw/2, -dh/2, dw, dh);
                ctx.globalAlpha = 1.0;
            }
            ctx.restore();
        }
        
        if (gameState.isPaused){
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0,0,w,h);
            ctx.fillStyle = '#fff'; ctx.font = '600 22px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText('PAUSADO', w/2, h/2);
        }

        if ((gameState.phase === 'win' && gameState.showWinScreen) || gameState.phase === 'lost') {
            ctx.fillStyle = gameState.phase === 'lost' ? 'rgba(40,0,0,0.66)' : 'rgba(0,0,0,0.66)';
            ctx.fillRect(0,0,w,h);
            const boxW = Math.min(520, w - 80), boxH = 280, bx = (w - boxW)/2, by = (h - boxH)/2;
            ctx.fillStyle = gameState.phase === 'lost' ? 'rgba(255,80,80,0.08)' : 'rgba(255,255,255,0.06)';
            roundRectFill(ctx, bx, by, boxW, boxH, 14);
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
            
            if (gameState.phase === 'lost') {
                ctx.font = '700 28px Inter, sans-serif';
                ctx.fillText('¡Tiempo Agotado!', w/2, by + 60);
                ctx.font = '600 16px Inter, sans-serif';
                ctx.fillText('No has completado el nivel a tiempo.', w/2, by + 100);
            } else {
                const hasNextLevel = !!GAME_CONFIG.levels[gameState.level + 1];
                ctx.font = '700 28px Inter, sans-serif';
                ctx.fillText(hasNextLevel ? `¡Nivel ${gameState.level} Completado!` : '¡Has Ganado!', w/2, by + 56);
                
                const finalTime = levelConfig.maxTime ? (levelConfig.maxTime * 1000 - gameState.timeLeft) : gameState.elapsed;
                const bestTime = getBestTime(gameState.level, gameState.blocks);
                
                ctx.font = '600 16px Inter, sans-serif';
                ctx.fillText(`Tiempo: ${formatTime(finalTime)} · Movimientos: ${gameState.moves||0}`, w/2, by + 96);
                ctx.font = '14px Inter, sans-serif';
                ctx.fillStyle = '#aab7d6';
                ctx.fillText(`Mejor tiempo: ${bestTime ? formatTime(bestTime) : 'N/A'}`, w/2, by + 126);
            }

            const btnW = 160, btnH = 44, gap = 24;
            const bx1 = w/2 - btnW - gap/2;
            const bx2 = w/2 + gap/2;
            const byBtn = by + boxH - 82;

            ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRectFill(ctx, bx1, byBtn, btnW, btnH, 10);
            ctx.fillStyle = '#fff'; ctx.font = '600 16px Inter, sans-serif'; ctx.fillText('Reintentar', bx1 + btnW/2, byBtn + btnH/2 + 1);

            ctx.fillStyle = styles.buttonBg; roundRectFill(ctx, bx2, byBtn, btnW, btnH, 10);
            ctx.fillStyle = '#06202a';
            const nextText = gameState.phase === 'lost' ? 'Volver al Menú' : (!!GAME_CONFIG.levels[gameState.level + 1] ? 'Siguiente Nivel' : 'Volver al Menú');
            ctx.fillText(nextText, bx2 + btnW/2, byBtn + btnH/2 + 1);

            gameState.hud.winRect = { x: bx, y: by, w: boxW, h: boxH };
            gameState.hud.winBtns = {
                retry: { id: 'retry', x: bx1, y: byBtn, w: btnW, h: btnH },
                next: { id: gameState.phase === 'lost' ? 'menu' : (!!GAME_CONFIG.levels[gameState.level + 1] ? 'next' : 'menu'), x: bx2, y: byBtn, w: btnW, h: btnH }
            };
        } else {
            gameState.hud.winRect = null; gameState.hud.winBtns = null;
        }
    }

    function renderImageSelection() {
        const anim = gameState.selectionAnimation;
        const now = Date.now();
        const elapsed = now - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);

        // Función de easing (desaceleración cúbica)
        const easeOut = t => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOut(progress);

        clear();
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.fillStyle = styles.bg;
        ctx.fillRect(0, 0, w, h);

        const thumbHeight = 100;
        const thumbWidth = thumbHeight * 1.6;
        const thumbGap = 20;
        const totalStripHeight = gameState.allImages.length * (thumbHeight + thumbGap);
        
        // Duplicamos las imágenes para un bucle infinito
        const extendedImages = [...gameState.allImages, ...gameState.allImages];

        const finalY = -(totalStripHeight + anim.finalIndex * (thumbHeight + thumbGap));
        const currentY = finalY * easedProgress;

        ctx.save();
        ctx.translate(w / 2 - thumbWidth / 2, h / 2 - thumbHeight / 2);

        for (let i = 0; i < extendedImages.length; i++) {
            const yPos = i * (thumbHeight + thumbGap) + (currentY % totalStripHeight);
            if (yPos > -thumbHeight && yPos < h) {
                ctx.drawImage(extendedImages[i], 0, yPos, thumbWidth, thumbHeight);
            }
        }
        
        ctx.restore();

        // Dibujar un marco de selección
        ctx.strokeStyle = styles.buttonBg;
        ctx.lineWidth = 4;
        ctx.strokeRect(w / 2 - thumbWidth / 2, h / 2 - thumbHeight / 2, thumbWidth, thumbHeight);
        
        ctx.fillStyle = 'rgba(15, 18, 32, 0.7)';
        ctx.fillRect(0, 0, w, h / 2 - thumbHeight / 2);
        ctx.fillRect(0, h / 2 + thumbHeight / 2, w, h / 2 - thumbHeight / 2);

        if (progress >= 1) {
            anim.running = false;
            setTimeout(initializeLevel, 400); // Pequeña pausa en la imagen seleccionada
        } else {
            requestAnimationFrame(render);
        }
    }

    function render(){
        switch(gameState.phase) {
            case 'menu':
                renderMenuOriginal();
                break;
            case 'image-selection':
                renderImageSelection();
                break;
            case 'playing':
            case 'win':
            case 'lost':
                renderGame();
                break;
        }
    }

    function processPieceInteraction(col, row, isRightClick){
        const idx = row * gameState.cols + col;
        const piece = gameState.pieces[idx];
        if (!piece || piece.isFixed) return false;
        
        if (isRightClick){ piece.rotation = (piece.rotation + 90) % 360; }
        else { piece.rotation = (piece.rotation + 270) % 360; }
        gameState.moves = (gameState.moves || 0) + 1;
        
        const won = gameState.pieces.every(p => (p.rotation % 360) === 0);
        if (won){
            stopTimer();
            const levelConfig = GAME_CONFIG.levels[gameState.level];
            const finalTime = levelConfig.maxTime ? (levelConfig.maxTime * 1000 - gameState.timeLeft) : gameState.elapsed;
            saveBestTime(gameState.level, gameState.blocks, finalTime);
            gameState.phase = 'win';
            render();
            setTimeout(() => {
                gameState.showWinScreen = true;
                render();
            }, 1500);
            return true;
        }
        render();
        return true;
    }

    function handleGamePointerDown(p, button){
        if (gameState.phase === 'image-selection') return;

        const pr = gameState.hud.pauseRect;
        if (pr && p.x >= pr.x && p.x <= pr.x+pr.w && p.y >= pr.y && p.y <= pr.y+pr.h){
            gameState.isPaused = !gameState.isPaused;
            if (!gameState.isPaused) { startTimer(); } else { stopTimer(); }
            render();
            return;
        }

        const ar = gameState.hud.ayudaRect;
        if (ar && !gameState.hud.helpUsed && p.x >= ar.x && p.x <= ar.x + ar.w && p.y >= ar.y && p.y <= ar.y + ar.h) {
            useHelp();
            return;
        }

        if (gameState.isPaused) return;

        if ((gameState.phase === 'win' || gameState.phase === 'lost') && gameState.hud && gameState.hud.winBtns){
            const btns = gameState.hud.winBtns;
            if (p.x >= btns.retry.x && p.x <= btns.retry.x + btns.retry.w && p.y >= btns.retry.y && p.y <= btns.retry.y + btns.retry.h){
                startGame(gameState.blocks, gameState.level);
                return;
            }
            if (p.x >= btns.next.x && p.x <= btns.next.x + btns.next.w && p.y >= btns.next.y && p.y <= btns.next.y + btns.next.h){
                if (btns.next.id === 'next') {
                    startGame(gameState.blocks, gameState.level + 1);
                } else {
                    gameState.phase = 'menu';
                    menuState.enabled = true;
                    render();
                }
                return;
            }
            return;
        }

        const area = gameState.layout;
        if (!area || gameState.phase !== 'playing') return;
        const localX = p.x - area.gridX;
        const localY = p.y - area.gridY;
        if (localX < 0 || localY < 0) return;
        const col = Math.floor(localX / area.pieceSize);
        const row = Math.floor(localY / area.pieceSize);
        if (col < 0 || col >= gameState.cols || row < 0 || row >= gameState.rows) return;
        processPieceInteraction(col, row, button === 2);
    }

    canvas.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
        if (gameState.phase === 'menu' && !menuState.enabled) return;
        const p = getPointerPos(e);
        handleGamePointerDown(p, e.button);
    });
    canvas.addEventListener('pointerup', e => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen'){
            if (gameState.isPaused || touchState.longPressFired) {
                if (touchState.longPressTimeout){ clearTimeout(touchState.longPressTimeout); touchState.longPressTimeout = null; }
                touchState.longPressFired = false;
                return;
            }
            const now = Date.now();
            const dt = now - (touchState.lastTap || 0);
            const p = getPointerPos(e);
            if (dt < 300){
                clearTimeout(touchState.tapTimeout);
                touchState.lastTap = 0;
                handleGamePointerDown(p, 2);
            } else {
                touchState.lastTap = now;
                touchState.tapTimeout = setTimeout(()=>{
                    if (!touchState.longPressFired) handleGamePointerDown(p, 0);
                    touchState.lastTap = 0;
                }, 260);
            }
        }
        if (touchState.longPressTimeout){ clearTimeout(touchState.longPressTimeout); touchState.longPressTimeout = null; }
        touchState.longPressFired = false;
    });
    canvas.addEventListener('pointercancel', e => {
        if (touchState.tapTimeout){ clearTimeout(touchState.tapTimeout); touchState.tapTimeout = null; }
        if (touchState.longPressTimeout){ clearTimeout(touchState.longPressTimeout); touchState.longPressTimeout = null; }
        touchState.longPressFired = false;
    });
    canvas.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen'){
            const p = getPointerPos(e);
            if (touchState.longPressTimeout) clearTimeout(touchState.longPressTimeout);
            touchState.longPressFired = false;
            touchState.longPressTimeout = setTimeout(()=>{
                touchState.longPressFired = true;
                handleGamePointerDown(p, 2);
            }, 600);
        }
    });

    canvas.addEventListener('contextmenu', e => { if (gameState.active || gameState.win || gameState.lost) e.preventDefault(); });

    window.addEventListener('blocka:start', (ev) => {
        const blocks = ev.detail && ev.detail.blocks ? ev.detail.blocks : menuState.selectedBlocks;
        startGame(blocks, 1);
    });

    // AÑADIR ESTA FUNCIÓN
    function init() {
        fitCanvas();
        preloadAllImages(); // Llamada a la precarga
        const r = canvas.getBoundingClientRect();
        if (r.height < 120){
            canvas.style.height = '450px';
            fitCanvas();
        }
    }

    new ResizeObserver(fitCanvas).observe(canvas);
    init();

})();