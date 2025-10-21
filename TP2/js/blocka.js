// Configuración del juego
const GAME_CONFIG = {
    images: [
        '../assets/img/images-4.jpeg',
        '../assets/img/images-5.jpeg',
        '../assets/img/images-6.jpeg',
        '../assets/img/images-7.jpeg',
        '../assets/img/images-8.jpeg',
        '../assets/img/images-simp.jpg',
        '../assets/img/images-simps.jpeg'
    ],
    // Estructura de niveles con el tipo de filtro a aplicar
    levels: {
        1: { filterType: 'none', name: 'Nivel 1' },
        2: { filterType: 'grayscale', name: 'Nivel 2 (Escala de Grises)' },
        3: { filterType: 'brightness', name: 'Nivel 3 (Brillo 30%)' },
        4: { filterType: 'invert', name: 'Nivel 4 (Negativo)' }
    },
    blockConfigs: {
        4: { rows: 2, cols: 2 },
        6: { rows: 2, cols: 3 },
        8: { rows: 2, cols: 4 }
    }
};

/* =====================
     Menú principal dentro del Canvas
     - (Sin cambios en esta sección)
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
        hovered: null, // 'opt-4' | 'opt-6' | 'opt-8' | 'start' | null
        rects: {},
        enabled: true
    };

    // (El resto del código del menú permanece igual hasta la lógica del juego...)
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
        if (gameState.active) calculateGameLayout(); // Recalcular layout si el juego está activo
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
    function init(){
        fitCanvas();
        const r = canvas.getBoundingClientRect();
        if (r.height < 120){
            canvas.style.height = '450px';
            fitCanvas();
        }
    }
    window.blockaCanvasMenu = {
        setBlocks(n){ menuState.selectedBlocks = n; render(); },
        enable(){ menuState.enabled = true; render(); },
        disable(){ menuState.enabled = false; render(); }
    };

    /* =====================
       Lógica del juego
       ===================== */
    const gameState = {
        active: false,
        level: 1, // <--- MODIFICACIÓN: Añadido para rastrear el nivel
        blocks: 4,
        rows: 0,
        cols: 0,
        pieces: [],
        image: null,
        offCanvas: null,
        cropSize: 0,
        moves: 0,
        win: false,
        startTime: null,
        elapsed: 0,
        timerId: null,
        isPaused: false,
        hud: { height: 56, pauseRect: null }
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

    // ========================================================================
    // --- SECCIÓN DE FILTROS CON IMAGEDATA (NUEVAS FUNCIONES) ---
    // ========================================================================

    /**
     * Aplica un filtro de escala de grises (BT.601) a un objeto ImageData.
     * @param {ImageData} imageData - El objeto ImageData a modificar.
     */
    function applyGrayscaleFilter(imageData) {
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
        }
    }

    /**
     * Aplica un filtro de brillo a un objeto ImageData.
     * @param {ImageData} imageData - El objeto ImageData a modificar.
     */
    function applyBrightnessFilter(imageData) {
        const pixels = imageData.data;
        const adjustment = 255 * 0.3; // Aumento del 30%
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = Math.max(0, Math.min(255, pixels[i] - adjustment));
            pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] - adjustment));
            pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] - adjustment));
        }
    }

    /**
     * Aplica un filtro negativo (invertir color) a un objeto ImageData.
     * @param {ImageData} imageData - El objeto ImageData a modificar.
     */
    function applyInvertFilter(imageData) {
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = 255 - pixels[i];
            pixels[i + 1] = 255 - pixels[i + 1];
            pixels[i + 2] = 255 - pixels[i + 2];
        }
    }

    // ========================================================================
    // --- FIN DE LA SECCIÓN DE FILTROS ---
    // ========================================================================

    function startGame(blocks, level = 1){
        menuState.enabled = false;
        gameState.active = false;
        gameState.blocks = blocks || 4;
        gameState.level = level; // <--- MODIFICACIÓN: Establecer el nivel actual
        gameState.moves = 0;
        gameState.win = false;
        gameState.elapsed = 0;
        const imgSrc = GAME_CONFIG.images[Math.floor(Math.random()*GAME_CONFIG.images.length)];

        loadImage(imgSrc).then(img=>{
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;
            const square = Math.min(nw, nh);
            const sx = Math.floor((nw - square) / 2);
            const sy = Math.floor((nh - square) / 2);
            const off = document.createElement('canvas');
            off.width = square;
            off.height = square;
            const offCtx = off.getContext('2d');

            // 1. Dibuja la imagen original en el canvas temporal
            offCtx.drawImage(img, sx, sy, square, square, 0, 0, square, square);

            // =================================================================
            // --- APLICACIÓN DE FILTROS USANDO IMAGEDATA ---
            // =================================================================
            const levelConfig = GAME_CONFIG.levels[gameState.level];
            if (levelConfig && levelConfig.filterType !== 'none') {
                // 2. Obtiene los datos de los píxeles (ImageData)
                const imageData = offCtx.getImageData(0, 0, off.width, off.height);

                // 3. Llama a la función de filtro correspondiente para modificar los píxeles
                switch (levelConfig.filterType) {
                    case 'grayscale':
                        applyGrayscaleFilter(imageData);
                        break;
                    case 'brightness':
                        applyBrightnessFilter(imageData);
                        break;
                    case 'invert':
                        applyInvertFilter(imageData);
                        break;
                }
                
                // 4. Vuelve a poner los píxeles modificados en el canvas temporal
                offCtx.putImageData(imageData, 0, 0);
            }
            // =================================================================

            gameState.offCanvas = off;
            gameState.cropSize = square;
            gameState.active = true;
            gameState.image = img;
            const cfg = GAME_CONFIG.blockConfigs[gameState.blocks];
            gameState.rows = cfg.rows; gameState.cols = cfg.cols;
            setupPieces();
            startTimer();
            render();
        }).catch(err=>{
            console.error('Error cargando imagen', err);
            menuState.enabled = true; render();
        });
    }

    function setupPieces(){
        gameState.pieces = [];
        const total = gameState.rows * gameState.cols;
        for (let r=0;r<gameState.rows;r++){
            for (let c=0;c<gameState.cols;c++){
                const idx = r*gameState.cols + c;
                const rot = [0,90,180,270][Math.floor(Math.random()*4)];
                gameState.pieces.push({ index: idx, r, c, rotation: rot, correctRotation: 0 });
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
        gameState.startTime = Date.now() - gameState.elapsed;
        if (gameState.timerId) clearInterval(gameState.timerId);
        gameState.timerId = setInterval(()=>{
            if (!gameState.isPaused && !gameState.win) {
                gameState.elapsed = Date.now() - gameState.startTime;
                render();
            }
        }, 200);
    }
    function stopTimer(){ if (gameState.timerId){ clearInterval(gameState.timerId); gameState.timerId = null; } }
    function formatTime(ms){ const s = Math.floor(ms/1000); const m = Math.floor(s/60); const sec = s%60; return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`; }

    function renderGame(){
        clear();
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.fillStyle = '#08111a'; ctx.fillRect(0,0,w,h);
        if (!gameState.image) {
            ctx.fillStyle = '#fff'; ctx.font = '600 18px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText('Cargando imagen...', w/2, h/2);
            return;
        }
        
        const hud = gameState.layout;
        ctx.fillStyle = 'rgba(255,255,255,0.04)'; roundRectFill(ctx, hud.hudX, hud.hudY, hud.hudW, hud.hudH, 8);
        ctx.fillStyle = '#fff'; ctx.font = '600 14px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        // <--- MODIFICACIÓN: Mostrar el nivel actual en el HUD
        ctx.fillText('Nivel: '+gameState.level, hud.hudX + 12, hud.hudY + hud.hudH/2);
        ctx.textAlign = 'center'; ctx.fillText(formatTime(gameState.elapsed), hud.hudX + hud.hudW/2, hud.hudY + hud.hudH/2);
        const pauseW = 80; const pauseH = 32; const px = hud.hudX + hud.hudW - pauseW - 12; const py = hud.hudY + (hud.hudH - pauseH)/2;
        ctx.fillStyle = gameState.isPaused ? 'rgba(255,100,100,0.9)' : styles.buttonBg;
        roundRectFill(ctx, px, py, pauseW, pauseH, 8);
        ctx.fillStyle = '#06202a'; ctx.textAlign='center'; ctx.fillText(gameState.isPaused ? 'Reanudar' : 'Pausa', px + pauseW/2, py + pauseH/2 + 1);
        gameState.hud.pauseRect = { x: px, y: py, w: pauseW, h: pauseH };
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff'; ctx.font = '600 14px Inter, sans-serif';
        ctx.fillText('Movimientos: ' + (gameState.moves || 0), hud.hudX + 100, hud.hudY + hud.hudH/2);
        const area = gameState.layout;
        const off = gameState.offCanvas;
        const cropSize = gameState.cropSize || (off ? off.width : 0);
        if (!off || !cropSize) {
            ctx.fillStyle = '#fff'; ctx.font = '600 16px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText('Error: imagen no disponible', w/2, h/2);
            return;
        }
        const sW = cropSize / gameState.cols;
        const sH = cropSize / gameState.rows;
        const ps = area.pieceSize;
        for (const p of gameState.pieces){
            const dx = area.gridX + p.c * ps;
            const dy = area.gridY + p.r * ps;
            const dw = ps;
            const dh = ps;
            const sx = Math.floor(p.c * sW);
            const sy = Math.floor(p.r * sH);
            ctx.save();
            ctx.translate(dx + dw/2, dy + dh/2);
            ctx.rotate((p.rotation * Math.PI)/180);
            ctx.drawImage(off, sx, sy, sW, sH, -dw/2, -dh/2, dw, dh);
            ctx.restore();
        }
        if (gameState.isPaused){
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0,0,w,h);
            ctx.fillStyle = '#fff'; ctx.font = '600 22px Inter, sans-serif'; ctx.textAlign='center'; ctx.fillText('PAUSADO', w/2, h/2);
        }

        // <--- MODIFICACIÓN: Lógica de la pantalla de victoria/siguiente nivel
        if (gameState.win){
            ctx.fillStyle = 'rgba(0,0,0,0.66)'; ctx.fillRect(0,0,w,h);
            const boxW = Math.min(520, w - 80); const boxH = 260; const bx = (w - boxW)/2; const by = (h - boxH)/2;
            ctx.fillStyle = 'rgba(255,255,255,0.06)'; roundRectFill(ctx, bx, by, boxW, boxH, 14);
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '700 28px Inter, sans-serif';

            const hasNextLevel = !!GAME_CONFIG.levels[gameState.level + 1];
            ctx.fillText(hasNextLevel ? `¡Nivel ${gameState.level} Completado!` : '¡Has Ganado!', w/2, by + 56);
            ctx.font = '600 16px Inter, sans-serif';
            ctx.fillText('Tiempo: ' + formatTime(gameState.elapsed) + ' · Movimientos: ' + (gameState.moves||0), w/2, by + 96);

            const btnW = 160, btnH = 44, gap = 24;
            const bx1 = w/2 - btnW - gap/2;
            const bx2 = w/2 + gap/2;
            const byBtn = by + boxH - 72;

            ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRectFill(ctx, bx1, byBtn, btnW, btnH, 10);
            ctx.fillStyle = '#fff'; ctx.fillText('Reintentar', bx1 + btnW/2, byBtn + btnH/2 + 1);

            ctx.fillStyle = styles.buttonBg; roundRectFill(ctx, bx2, byBtn, btnW, btnH, 10);
            ctx.fillStyle = '#06202a'; ctx.fillText(hasNextLevel ? 'Siguiente Nivel' : 'Volver al Menú', bx2 + btnW/2, byBtn + btnH/2 + 1);

            gameState.hud.winRect = { x: bx, y: by, w: boxW, h: boxH };
            gameState.hud.winBtns = {
                retry: { id: 'retry', x: bx1, y: byBtn, w: btnW, h: btnH },
                next: { id: hasNextLevel ? 'next' : 'menu', x: bx2, y: byBtn, w: btnW, h: btnH }
            };
        } else {
            gameState.hud.winRect = null; gameState.hud.winBtns = null;
        }
    }

    function render(){
        if (gameState.active || gameState.win) renderGame(); else renderMenuOriginal();
    }

    function processPieceInteraction(col, row, isRightClick){
        const idx = row * gameState.cols + col;
        const piece = gameState.pieces[idx];
        if (!piece) return false;
        if (isRightClick){ piece.rotation = (piece.rotation + 90) % 360; }
        else { piece.rotation = (piece.rotation + 270) % 360; }
        gameState.moves = (gameState.moves || 0) + 1;
        const won = gameState.pieces.every(p => (p.rotation % 360) === 0);
        if (won){
            stopTimer();
            gameState.win = true;
            console.info(`Blocka: Nivel ${gameState.level} completado`);
            render();
        }
        return true;
    }

    function handleGamePointerDown(p, button){
        const pr = gameState.hud.pauseRect;
        if (pr && p.x >= pr.x && p.x <= pr.x+pr.w && p.y >= pr.y && p.y <= pr.y+pr.h){
            gameState.isPaused = !gameState.isPaused;
            if (!gameState.isPaused) { startTimer(); }
            render();
            return;
        }
        if (gameState.isPaused) return;

        // <--- MODIFICACIÓN: Lógica de clic en botones de victoria
        if (gameState.win && gameState.hud && gameState.hud.winBtns){
            const btns = gameState.hud.winBtns;
            if (p.x >= btns.retry.x && p.x <= btns.retry.x + btns.retry.w && p.y >= btns.retry.y && p.y <= btns.retry.y + btns.retry.h){
                startGame(gameState.blocks, gameState.level); // Reintentar nivel actual
                return;
            }
            if (p.x >= btns.next.x && p.x <= btns.next.x + btns.next.w && p.y >= btns.next.y && p.y <= btns.next.y + btns.next.h){
                if (btns.next.id === 'next') {
                    startGame(gameState.blocks, gameState.level + 1); // Siguiente nivel
                } else {
                    gameState.win = false; gameState.active = false; gameState.offCanvas = null; gameState.level = 1; menuState.enabled = true; render(); // Volver al menú
                }
                return;
            }
            return;
        }

        const area = gameState.layout;
        if (!area) return;
        const localX = p.x - area.gridX;
        const localY = p.y - area.gridY;
        if (localX < 0 || localY < 0) return;
        const col = Math.floor(localX / area.pieceSize);
        const row = Math.floor(localY / area.pieceSize);
        if (col < 0 || col >= gameState.cols || row < 0 || row >= gameState.rows) return;
        if(processPieceInteraction(col, row, button === 2)){
            render();
        }
    }

    canvas.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
        if (!gameState.active && !gameState.win) return;
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

    canvas.addEventListener('contextmenu', e => { if (gameState.active || gameState.win) e.preventDefault(); });

    // <--- MODIFICACIÓN: Iniciar el juego siempre desde el nivel 1
    window.addEventListener('blocka:start', (ev) => {
        const blocks = ev.detail && ev.detail.blocks ? ev.detail.blocks : menuState.selectedBlocks;
        startGame(blocks, 1);
    });

    new ResizeObserver(fitCanvas).observe(canvas);
    init();

})();