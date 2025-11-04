export default class PegView {
    constructor(canvas, uiSelectors = {}){
        this.canvas = canvas;
    // Estilos defensivos del canvas para evitar causar overflow en la página
        if (this.canvas && this.canvas.style){
            this.canvas.style.display = 'block';
            this.canvas.style.width = '100%';
            this.canvas.style.maxWidth = '100%';
            this.canvas.style.boxSizing = 'border-box';
        }
        this.ctx = canvas.getContext('2d');

        // --- INICIO: Cargar imagen de la ficha ---
        this.pegImage = new Image();
        this.pegImage.src = './assets/images/homer.png'; // Asegúrate de que la ruta a tu imagen sea correcta
        this.pegImageLoaded = false;
        this.pegImage.onload = () => {
            this.pegImageLoaded = true;
            // Vuelve a dibujar la vista una vez que la imagen se haya cargado
            if (this._renderOnUpdate) this._renderOnUpdate();
        };
        // --- FIN: Cargar imagen de la ficha ---

        // --- INICIO: Cargar imagen de FONDO ---
        // Usamos `this._bgImage` porque `render()` comprueba esa propiedad.
        this._bgImage = new Image();
        // evitar problemas CORS si la imagen se carga desde otra ruta
        try { this._bgImage.crossOrigin = 'anonymous'; } catch(e){}
        // ruta solicitada por el usuario (archivo compartido en TP2)
        this._bgImage.src = '../TP2/assets/img/background_simpson.jpg';        // ...en el método render, reemplaza...
        // ...existing code...
        this._bgImage.onload = () => {
            // Cuando cargue, forzamos re-render
            if (this._renderOnUpdate) this._renderOnUpdate();
        };
        this._bgImage.onerror = () => {
            // fallo de carga: no hacer nada extra, render() usará el color de fallback
            // console.warn('No se pudo cargar background_simpson.jpg');
        };
        // --- FIN: Cargar imagen de FONDO ---

    this.ui = uiSelectors; // { pegsLeftEl, moveCountEl, timerEl, messageEl } elementos DOM opcionales
        this.rows = 7; this.cols = 7;
        this.cellSize = 64; // tamaño por defecto, se ajustará en resize
        this.padding = 12;
    this._originX = this.padding;
    this._originY = this.padding;
        this._highlightedCells = [];
        this._dragging = false;
        this._dragOrigin = null; // {row,col}
    this._dragPos = null; // {x,y} en pixels locales (CSS)
        this._dragPointerId = null;
        this._dragPointerOffset = {x:0,y:0};
        this._hudRegions = {
            reset: null,
            undo: null,
            hint: null
        };
        this._hoveredHud = null; // 'reset'|'undo'|'hint' when pointer is over a button
        this._onResetCallback = null;
        this._onUndoCallback = null;
        this._onHintCallback = null;
    // estado de animación de flechas
        this._arrowSource = null;
        this._arrowTargets = null;
        this._arrowAnimating = false;
        this._animStart = 0;
        this._rafId = null;
    this._animDuration = 900; // ms por ciclo

        this.canvas.addEventListener('click', (e)=> this._onClick(e));
        this.canvas.addEventListener('pointerdown', (e)=> this._onPointerDownEvent(e));
        this.canvas.addEventListener('pointermove', (e)=> this._onPointerMoveEvent(e));
        this.canvas.addEventListener('pointerleave', ()=>{
            if (this._hoveredHud){ this._hoveredHud = null; if (this._renderOnUpdate) this._renderOnUpdate(); }
        });
        this.canvas.addEventListener('pointerup', (e)=> this._onPointerUpEvent(e));
        this.canvas.addEventListener('pointercancel', (e)=> this._onPointerCancelEvent(e));
        window.addEventListener('resize', ()=> this._onResize());
        this._onResize();

        
        this._ensureControlsInsideBoard();
    }

    _ensureControlsInsideBoard(){

        let boardContainer = this.canvas.closest('#game-area') || this.canvas.parentElement;
        if (!boardContainer) boardContainer = document.body;

        document.querySelectorAll('.game-controls').forEach(el => { if (!boardContainer.contains(el)) el.remove(); });

        const existing = boardContainer.querySelector('.game-controls');
        if (existing){
            this.ui.pegsLeftEl = document.getElementById('pegsLeft') || existing.querySelector('#pegsLeft');
            this.ui.moveCountEl = document.getElementById('moveCount') || existing.querySelector('#moveCount');
            this.ui.timerEl = document.getElementById('timer') || existing.querySelector('#timer');
            this.ui.messageEl = document.getElementById('gameMessage') || existing.querySelector('#gameMessage');
            this.ui.resetBtn = document.getElementById('resetBtn') || existing.querySelector('#resetBtn');
            this.ui.undoBtn = document.getElementById('undoBtn') || existing.querySelector('#undoBtn');
            this.ui.hintBtn = document.getElementById('hintBtn') || existing.querySelector('#hintBtn');
            return;
        }

    }

    _onResize(){
        const rect = this.canvas.getBoundingClientRect();
        // calcular cellSize en función del ancho disponible
        const avail = Math.min(rect.width, rect.height) - this.padding*2;
        this.cellSize = Math.floor(avail / Math.max(this.rows, this.cols));
        this.canvas.width = rect.width * (window.devicePixelRatio || 1);
        this.canvas.height = rect.height * (window.devicePixelRatio || 1);
        this.ctx.setTransform(window.devicePixelRatio || 1,0,0,window.devicePixelRatio || 1,0,0);

        const totalGridW = this.cellSize * this.cols;
        const totalGridH = this.cellSize * this.rows;
        this._originX = Math.max(this.padding, Math.floor((rect.width - totalGridW) / 2));
        this._originY = Math.max(this.padding, Math.floor((rect.height - totalGridH) / 2));
    }

    onClick(handler){ this._clickHandler = handler; }


    onPointerDown(handler){ this._pointerDownHandler = handler; }
    onPointerMove(handler){ this._pointerMoveHandler = handler; }
    onPointerUp(handler){ this._pointerUpHandler = handler; }


    onReset(handler){ this._onResetCallback = handler; }
    onUndo(handler){ this._onUndoCallback = handler; }
    onHint(handler){ this._onHintCallback = handler; }

    _onPointerDownEvent(e){

        // calcular posición del evento y evitar iniciar drag si está fuera del área del tablero
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // si clickea sobre el HUD, delegar al manejador de botones y no iniciar drag
        if (this._hitHudButton(x,y)) return;

        const {row,col,localX,localY} = this._getCellFromEvent(e);
        // si está fuera de los límites de la cuadrícula no iniciamos arrastre
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;

        // Preguntar al manejador (controlador) si está permitido iniciar arrastre
        // El controlador debe devolver true si hay una ficha para arrastrar.
        if (this._pointerDownHandler){
            try{
                const allow = this._pointerDownHandler(row,col,e);
                if (!allow) return; // no iniciar arrastre si el controlador lo prohíbe
            } catch(err){
                // si el handler lanza, abortar iniciar drag
                return;
            }
        }

        try{ this.canvas.setPointerCapture(e.pointerId); } catch(err){}
        this._dragging = true;
        this._dragOrigin = {row,col};

        const centerX = col * this.cellSize + this.cellSize/2;
        const centerY = row * this.cellSize + this.cellSize/2;
        this._dragPos = {x: centerX, y: centerY};
       
        this._dragPointerOffset = { x: localX - centerX, y: localY - centerY };
        this._dragPointerId = e.pointerId;
        if (this._renderOnUpdate) this._renderOnUpdate();
    }

    _onPointerMoveEvent(e){
        // actualizar hover sobre HUD aunque no estemos arrastrando
        const rect = this.canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        let newHover = null;
        if (this._hudRegions.reset && this._pointInRect(px,py,this._hudRegions.reset)) newHover = 'reset';
        else if (this._hudRegions.undo && this._pointInRect(px,py,this._hudRegions.undo)) newHover = 'undo';
        else if (this._hudRegions.hint && this._pointInRect(px,py,this._hudRegions.hint)) newHover = 'hint';
        if (newHover !== this._hoveredHud){ this._hoveredHud = newHover; if (this._renderOnUpdate) this._renderOnUpdate(); }

        // si no estamos arrastrando o el pointerId no coincide, no actualizar la posición de arrastre
        if (!this._dragging || e.pointerId !== this._dragPointerId) return;
        const {localX, localY, row, col} = this._getCellFromEvent(e);

        this._dragPos = { x: localX - this._dragPointerOffset.x, y: localY - this._dragPointerOffset.y };
        if (this._pointerMoveHandler) this._pointerMoveHandler(row,col,e);
        if (this._renderOnUpdate) this._renderOnUpdate();
    }

    _onPointerUpEvent(e){
        if (this._dragging){
            try{ this.canvas.releasePointerCapture(e.pointerId); } catch(err){}
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this._hitHudButton(x,y)){
                this._dragging = false;
                this._dragOrigin = null;
                this._dragPos = null;
                this._dragPointerId = null;
                if (this._renderOnUpdate) this._renderOnUpdate();
                return;
            }
            const {row,col} = this._getCellFromEvent(e);
            if (this._pointerUpHandler) this._pointerUpHandler(row,col,e);
            this._dragging = false;
            this._dragOrigin = null;
            this._dragPos = null;
            this._dragPointerId = null;
            if (this._renderOnUpdate) this._renderOnUpdate();
        }
    }

    _onPointerCancelEvent(e){
 
        if (this._dragging && e.pointerId === this._dragPointerId){
            try{ this.canvas.releasePointerCapture(e.pointerId); } catch(err){}
            this._dragging = false;
            this._dragOrigin = null;
            this._dragPos = null;
            this._dragPointerId = null;
            if (this._renderOnUpdate) this._renderOnUpdate();
        }
    }

    _onClick(e){
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this._hitHudButton(x,y)) return;

        if (!this._clickHandler) return;
        const localX = x - this._originX;
        const localY = y - this._originY;
        const col = Math.floor(localX / this.cellSize);
        const row = Math.floor(localY / this.cellSize);
        this._clickHandler(row, col);
    }

    _getCellFromEvent(e){
        const r = this.canvas.getBoundingClientRect();
        const x = e.clientX - r.left - this._originX;
        const y = e.clientY - r.top - this._originY;
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return { row, col, localX: x, localY: y };
    }

    render(model){
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.width / dpr;
        const h = this.canvas.height / dpr;
        ctx.clearRect(0,0,w,h);
        // dibujar imagen de fondo si está cargada, si no usar color de fallback
        if (this._bgImage && this._bgImage.complete && this._bgImage.naturalWidth){
            try{
                ctx.drawImage(this._bgImage, 0, 0, w, h);
            } catch(err){
                ctx.fillStyle = '#ffffffff';
                ctx.fillRect(0,0,w,h);
            }
        } else {
            ctx.fillStyle = '#ffffffff';
            ctx.fillRect(0,0,w,h);
        }


    const originX = this._originX;
    const originY = this._originY;

        // Dibujar un panel detrás del tablero para separarlo del fondo y hacerlo más nítido
        try{
            const panelPad = Math.max(6, Math.floor(this.cellSize * 0.12));
            const totalGridW = this.cellSize * this.cols;
            const totalGridH = this.cellSize * this.rows;
            const panelX = originX - panelPad;
            const panelY = originY - panelPad;
            const panelW = totalGridW + panelPad*2;
            const panelH = totalGridH + panelPad*2;
            const radius = Math.max(12, Math.floor(this.cellSize * 0.12));

            ctx.save();
            // rounded rect path for center panel
            ctx.beginPath();
            ctx.moveTo(panelX + radius, panelY);
            ctx.arcTo(panelX + panelW, panelY, panelX + panelW, panelY + panelH, radius);
            ctx.arcTo(panelX + panelW, panelY + panelH, panelX, panelY + panelH, radius);
            ctx.arcTo(panelX, panelY + panelH, panelX, panelY, radius);
            ctx.arcTo(panelX, panelY, panelX + panelW, panelY, radius);
            ctx.closePath();
            // --- Cambio: fondo tipo madera para el panel central ---
            // Crear un gradiente marrón para simular madera
                const woodGrad = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
                woodGrad.addColorStop(0, '#d2a06a'); // marrón claro
                woodGrad.addColorStop(0.5, '#b07a43'); // tono medio
                woodGrad.addColorStop(1, '#8a5a2a'); // marrón más oscuro
                ctx.fillStyle = woodGrad;
                ctx.fill();

                // Dibujar vetas sutiles para efecto madera (más visibles)
                ctx.save();
                ctx.globalAlpha = 0.16;
                ctx.lineWidth = Math.max(1, Math.floor(this.cellSize * 0.02));
                ctx.strokeStyle = '#3b2a18';
                const lines = Math.max(7, Math.floor(panelH / 26));
                for (let i = 0; i < lines; i++) {
                    const yy = panelY + (i + 0.5) * (panelH / lines);
                    ctx.beginPath();
                    // curva ligera para simular veta
                    ctx.moveTo(panelX - panelW * 0.02, yy + Math.sin(i * 1.2) * (this.cellSize * 0.09));
                    ctx.quadraticCurveTo(panelX + panelW * 0.45, yy + Math.cos(i * 0.85) * (this.cellSize * 0.06), panelX + panelW + panelW * 0.02, yy + Math.sin(i * 0.7) * (this.cellSize * 0.08));
                    ctx.stroke();
                }
                ctx.restore();

                // Sutil sombra interior (inner shadow) para dar profundidad
                ctx.save();
                // clip to rounded panel so shadow stays inside
                ctx.beginPath();
                ctx.moveTo(panelX + radius, panelY);
                ctx.arcTo(panelX + panelW, panelY, panelX + panelW, panelY + panelH, radius);
                ctx.arcTo(panelX + panelW, panelY + panelH, panelX, panelY + panelH, radius);
                ctx.arcTo(panelX, panelY + panelH, panelX, panelY, radius);
                ctx.arcTo(panelX, panelY, panelX + panelW, panelY, radius);
                ctx.closePath();
                ctx.clip();

                // radial gradient that is darker near the edges -> looks like inner shadow
                const centerX = panelX + panelW * 0.5;
                const centerY = panelY + panelH * 0.5;
                const maxR = Math.max(panelW, panelH) * 0.7;
                const innerGrad = ctx.createRadialGradient(centerX, centerY, Math.min(panelW, panelH) * 0.25, centerX, centerY, maxR);
                innerGrad.addColorStop(0, 'rgba(0,0,0,0)');
                innerGrad.addColorStop(0.85, 'rgba(0,0,0,0.06)');
                innerGrad.addColorStop(1, 'rgba(0,0,0,0.18)');
                ctx.fillStyle = innerGrad;
                ctx.fillRect(panelX, panelY, panelW, panelH);
                ctx.restore();

                // sutil borde para separar del fondo
                ctx.lineWidth = Math.max(1, Math.floor(this.cellSize * 0.015));
                ctx.strokeStyle = 'rgba(0,0,0,0.25)';
                ctx.stroke();
                // --- fin cambio madera ---

            // side panels (left and right) anchored to the canvas extremes
            // We'll make them full-height bars at the edges so the board contrasts
            // aumentar el ancho para dar más espacio a botones y estadísticas
            const sideW = Math.max(180, Math.floor(this.cellSize * 2.4));
            // anchor flush to edges (left at x=0, right at x = canvasWidth - sideW)
            const leftX = 0;
            const rightX = Math.max(0, Math.floor(w - sideW));
            const sideY = 0; // full canvas height
            const sideH = h;

            // store for HUD drawing
            this._sidePanelLeft = { x: leftX, y: sideY, w: sideW, h: sideH };
            this._sidePanelRight = { x: rightX, y: sideY, w: sideW, h: sideH };

    
        } catch(err){ /* ignore drawing panel if anything fails */ }


        let _selectedPos = null;
        for (let r=0;r<this.rows;r++){
            for (let c=0;c<this.cols;c++){
                const x = originX + c*this.cellSize;
                const y = originY + r*this.cellSize;

                // fondo de la celda: hacerlo un poco más oscuro para separarlo del fondo de madera
                ctx.fillStyle = model.isValidPosition(r,c) ? 'rgba(0,0,0,0.18)' : 'transparent';
                // dibujar fondo de celda con esquinas redondeadas
                ctx.save();
                ctx.beginPath();
                this._roundRectPath(ctx, x+2, y+2, this.cellSize-4, this.cellSize-4, Math.max(6, Math.floor(this.cellSize * 0.08)));
                ctx.fill();
                ctx.restore();
                const isDragSource = this._dragging && this._dragOrigin && this._dragOrigin.row === r && this._dragOrigin.col === c;
                const isSelectedSource = this._arrowSource && this._arrowSource.r === r && this._arrowSource.c === c;

                // Dibujamos la ficha. Si es la fuente del arrastre la ocultamos (la dibujamos al final),
                // pero mostramos un 'ghost' en su lugar cuando está seleccionada o en arrastre.
                if (model.board[r][c] === 1){
                    if (isDragSource){
                        // si estamos arrastrando, no dibujar la ficha fija en la celda origen (seguirá al pointer)
                        if (!this._dragging){
                            // si no estamos activamente arrastrando (solo seleccionada), mostrarla elevada
                            _selectedPos = { r, c };
                        }
                    } else if (isSelectedSource){
                        // guardar la posición para dibujar la ficha seleccionada al final (sobre otras)
                        _selectedPos = { r, c };
                    } else {
                        // --- INICIO DEL CAMBIO CON CLIPPING ---
                        ctx.save(); // 1. Guardar estado
                        
                        // 2. Definir la forma circular para el recorte
                        ctx.beginPath();
                        ctx.arc(x + this.cellSize/2, y + this.cellSize/2, this.cellSize*0.42, 0, Math.PI*2);
                        
                        // 3. Aplicar la máscara de recorte
                        ctx.clip();

                        // 4. Dibujar la imagen (solo se verá la parte dentro del círculo)
                        if (this.pegImageLoaded) {
                            const pegSize = this.cellSize * 0.85;
                            const pegX = x + (this.cellSize - pegSize) / 2;
                            const pegY = y + (this.cellSize - pegSize) / 2;
                            ctx.drawImage(this.pegImage, pegX, pegY, pegSize, pegSize);
                        } else {
                            // Fallback si la imagen no ha cargado (no se recortará, pero es un fallback)
                            ctx.fillStyle = '#FFD54F';
                            ctx.fill(); // Rellena el círculo definido en el paso 2
                        }

                        // 5. Restaurar para eliminar la máscara y no afectar otros dibujos
                        ctx.restore(); 
                        // --- FIN DEL CAMBIO CON CLIPPING ---
                    }
                } else if (model.board[r][c] === 0 && model.isValidPosition(r,c)){
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                    ctx.lineWidth = 2;
                    ctx.arc(x + this.cellSize/2, y + this.cellSize/2, this.cellSize*0.12, 0, Math.PI*2);
                    ctx.stroke();
                }
                if (this._highlightedCells.some(hc => hc.r === r && hc.c === c)){
                    ctx.save();
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(100, 181, 246, 0.22)';
                    this._roundRectPath(ctx, x+2, y+2, this.cellSize-4, this.cellSize-4, Math.max(6, Math.floor(this.cellSize * 0.08)));
                    ctx.fill();
                    ctx.restore();
                    ctx.beginPath();
                    ctx.fillStyle = 'rgba(2,35,45,0.9)';
                    ctx.arc(x + this.cellSize/2, y + this.cellSize/2, this.cellSize*0.08, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }

        // aplicar un sombreado suave (vignette) alrededor del tablero para que destaque sobre el fondo
        try{
            const totalGridW = this.cellSize * this.cols;
            const totalGridH = this.cellSize * this.rows;
            const boardCx = originX + totalGridW * 0.5;
            const boardCy = originY + totalGridH * 0.5;
            const outerR = Math.max(w, h) * 0.9;
            const innerR = Math.min(totalGridW, totalGridH) * 0.45;
            const vignette = ctx.createRadialGradient(boardCx, boardCy, innerR, boardCx, boardCy, outerR);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(0.6, 'rgba(0,0,0,0.12)');
            vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0,0,w,h);
        } catch(err){ /* ignore if gradient fails */ }

        // draw arrow animations (if any)
        if (this._arrowAnimating && this._arrowSource && Array.isArray(this._arrowTargets) && this._arrowTargets.length){
            this._drawArrows(ctx, originX, originY, model);
        }

        // Si hay una ficha seleccionada, dibujarla ahora por encima de las demás
        if (_selectedPos){
            // si la ficha seleccionada corresponde al origen del arrastre activo, no la dibujamos aquí
            const isActiveDragOrigin = this._dragging && this._dragOrigin && this._dragOrigin.row === _selectedPos.r && this._dragOrigin.col === _selectedPos.c;
            if (!isActiveDragOrigin){
                const sx = originX + _selectedPos.c * this.cellSize + this.cellSize/2;
                const sy = originY + _selectedPos.r * this.cellSize + this.cellSize/2;
                this._drawSelectedPeg(ctx, sx, sy, this.cellSize*0.34);
            }
        }

    this._drawHud(ctx, originX, originY, w, h, model);

    // actualizar cursor según hover sobre HUD
    try{ this.canvas.style.cursor = this._hoveredHud ? 'pointer' : 'default'; } catch(e){}

        // si hay una pieza siendo arrastrada, dibujarla en la posición del pointer
        // usando el mismo efecto de la ficha seleccionada (scale + shadow) para que parezca
        // levantada mientras se arrastra.
        if (this._dragging && this._dragOrigin && this._dragPos){
            const dx = this._dragPos.x;
            const dy = this._dragPos.y;
            // dibujar la pieza arrastrada con el estilo "selected/elevated"
            this._drawSelectedPeg(ctx, originX + dx, originY + dy, this.cellSize*0.34);
        }
        // Actualizar HUD en el DOM si existen los elementos
        if (this.ui.pegsLeftEl) this.ui.pegsLeftEl.textContent = model.pegCount;
        if (this.ui.moveCountEl) this.ui.moveCountEl.textContent = model.moveCount;
        if (this.ui.timerEl && window.pegController && typeof window.pegController.remainingTime === 'number') {
            const t = window.pegController.remainingTime;
            this.ui.timerEl.textContent = `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
            // Forzar estilos visibles
            this.ui.timerEl.style.color = '#FFD54F';
            this.ui.timerEl.style.fontWeight = 'bold';
            this.ui.timerEl.style.fontSize = '1.5rem';
            this.ui.timerEl.style.background = 'transparent';
            this.ui.timerEl.style.display = 'inline';
            this.ui.timerEl.style.visibility = 'visible';
        }
    }

    showMessage(text){ if (this.ui.messageEl) this.ui.messageEl.textContent = text; }

    _drawHud(ctx, originX, originY, w, h, model){
        // Estadísticas como botones, alineación mejorada y números más integrados
    ctx.save();
    // Aumenté los valores para que los controles sean más grandes/legibles
    const pad = Math.max(22, Math.floor(this.cellSize * 0.22));
    const btnW = Math.max(150, Math.floor(this.cellSize * 2.0));
    const btnH = Math.max(48, Math.floor(this.cellSize * 0.46));
    // reducir espacio entre estadísticas para que queden más compactas
    const spacing = Math.max(4, Math.floor(this.cellSize * 0.28));
    const iconFont = `bold ${Math.max(6, Math.floor(this.cellSize * 0.24))}px Arial`;
    const labelFont = `bold ${Math.max(5, Math.floor(this.cellSize * 0.18))}px Arial`;
    const valueFont = `bold ${Math.max(5, Math.floor(this.cellSize * 0.18))}px Arial`;

        if (this._sidePanelLeft){
            const p = this._sidePanelLeft;
            let bx = p.x + (p.w - btnW)/2;
            let by = p.y + pad + Math.floor(this.cellSize * 0.2);

            // Helper para dibujar cada estadística con el mismo estilo que los botones
            // (fondo oscuro, esquinas redondeadas y sombra sutil)
            function drawStat(icon, label, value, color, valueColor) {
                ctx.save();

                // parámetros de forma
                const radiusStat = Math.min(12, Math.floor(btnH * 0.35));

                // sombra ligera para separar del fondo
                ctx.shadowColor = 'rgba(0,0,0,0.18)';
                ctx.shadowBlur = Math.max(4, Math.floor(btnH * 0.12));
                ctx.shadowOffsetY = 1;

                ctx.fillStyle = 'rgba(20,24,28,0.86)';

                // ruta redondeada
                ctx.beginPath();
                ctx.moveTo(bx + radiusStat, by);
                ctx.arcTo(bx + btnW, by, bx + btnW, by + btnH, radiusStat);
                ctx.arcTo(bx + btnW, by + btnH, bx, by + btnH, radiusStat);
                ctx.arcTo(bx, by + btnH, bx, by, radiusStat);
                ctx.arcTo(bx, by, bx + btnW, by, radiusStat);
                ctx.closePath();
                ctx.fill();

                // borde sutil sin sombra
                ctx.shadowColor = 'transparent';
                ctx.lineWidth = Math.max(1, Math.floor(btnH * 0.06));
                ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                ctx.stroke();

                // Icono
                ctx.font = iconFont;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = color;
                ctx.fillText(icon, bx + 12, by + btnH/2);

                // Label
                ctx.font = labelFont;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#fff';
                ctx.fillText(label, bx + 38, by + btnH/2);

                // Valor
                ctx.font = valueFont;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = valueColor;
                const labelWidth = ctx.measureText(label).width;
                ctx.fillText(String(value), bx + 38 + labelWidth + 12, by + btnH/2);

                ctx.restore();
            }

            drawStat('🟡', 'Fichas', model.pegCount, '#FFD54F', '#FFD54F');
            by += btnH + spacing;
            drawStat('🔄', 'Movimientos', model.moveCount, '#64B5F6', '#64B5F6');
            by += btnH + spacing;
            let timerText = '00:00';
            if (window.pegController && typeof window.pegController.remainingTime === 'number') {
                const t = window.pegController.remainingTime;
                timerText = `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
            }
            drawStat('⏰', 'Tiempo', timerText, '#FF5722', '#FF5722');
        }

        // Panel derecho: botones (sin cambios)
        if (this._sidePanelRight){
            const p = this._sidePanelRight;
            // botones del panel derecho más grandes
            const btnW2 = Math.max(120, Math.floor(p.w - pad*2));
            const btnH2 = Math.max(44, Math.floor(this.cellSize * 0.42));
            const spacing2 = Math.max(12, Math.floor(this.cellSize * 0.22));
            let bx2 = p.x + (p.w - btnW2)/2;
            let by2 = p.y + pad + Math.floor(this.cellSize * 0.2);

            this._hudRegions.reset = { x: bx2, y: by2, w: btnW2, h: btnH2 };
            this._drawButton(ctx, bx2, by2, btnW2, btnH2, '🔁 Reiniciar', this._hoveredHud === 'reset');

            by2 += btnH2 + spacing2;
            this._hudRegions.undo = { x: bx2, y: by2, w: btnW2, h: btnH2 };
            this._drawButton(ctx, bx2, by2, btnW2, btnH2, '↶ Deshacer', this._hoveredHud === 'undo');

            by2 += btnH2 + spacing2;
            this._hudRegions.hint = { x: bx2, y: by2, w: btnW2, h: btnH2 };
            this._drawButton(ctx, bx2, by2, btnW2, btnH2, '💡 Pista', this._hoveredHud === 'hint');
        }

        ctx.restore();
    }

    _drawArrows(ctx, originX, originY, model){
        const now = performance.now();
        const elapsed = now - this._animStart;
        const p = ((elapsed % this._animDuration) / this._animDuration);
        // Nuevo: para cada celda objetivo dibujar un 'rotador' compuesto por 3 barras amarillas
        // que giren alrededor del centro de la celda. Las barras se dibujan como trazos con
        // extremos redondeados (lineCap='round') y con un contorno negro para contraste.
        const baseAngle = elapsed / this._animDuration * Math.PI * 2;
        this._arrowTargets.forEach(target => {
            const cx = originX + (target.c * this.cellSize) + this.cellSize/2;
            const cy = originY + (target.r * this.cellSize) + this.cellSize/2;

            // radios y grosores relativos a cellSize
            const outerR = this.cellSize * 0.36;
            const innerR = this.cellSize * 0.12;
            const barW = Math.max(4, this.cellSize * 0.07);

            // ángulo rotación actual
            const angle = baseAngle;

            // dibujar 3 segmentos de arco alrededor del centro, formando el borde de un círculo
            const ringR = (innerR + outerR) * 0.5;
            // longitud angular de cada segmento (fracción del tercio de círculo)
            const segFraction = 0.72; // 72% del tercio => deja pequeño espacio entre segmentos
            const segAngle = (Math.PI * 2 / 3) * segFraction;
            for (let i = 0; i < 3; i++){
                const start = angle + i * (Math.PI * 2 / 3) - segAngle/2;
                const end = start + segAngle;

                // contorno negro grueso
                ctx.beginPath();
                ctx.lineWidth = Math.max(6, barW + 2);
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#000';
                ctx.arc(cx, cy, ringR, start, end);
                ctx.stroke();

                // arco amarillo encima
                ctx.beginPath();
                ctx.lineWidth = barW;
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#FFD54F';
                ctx.arc(cx, cy, ringR, start, end);
                ctx.stroke();

                // (Quitar highlight blanco interior para un diseño más limpio)
            }
        });
    }

    _drawGhostPeg(ctx, cx, cy, radius){
        // ghost: círculo translúcido con halo y borde sutil
        ctx.save();
        // sombra/halo
        ctx.beginPath();
        // halo más sutil
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        ctx.arc(cx + this.cellSize*0.04, cy + this.cellSize*0.04, radius + this.cellSize*0.03, 0, Math.PI*2);
        ctx.fill();

        // cuerpo ghost (más translúcido)
        ctx.beginPath();
        // aumentar opacidad para que la ficha seleccionada se vea más (efecto atenuado)
        ctx.fillStyle = 'rgba(255,213,79,0.58)';
        ctx.arc(cx, cy, radius, 0, Math.PI*2);
        ctx.fill();

        // borde suave
        ctx.beginPath();
        ctx.lineWidth = Math.max(1, this.cellSize * 0.02);
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.arc(cx, cy, radius, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
    }

    _drawSelectedPeg(ctx, cx, cy, radius){
        // Dibuja la ficha seleccionada con leve escala y una sombra manual (elipse) para "elevarla"
        ctx.save();
        const scale = 1.4;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

    // Sombra circular plana: misma forma y tamaño que la ficha, desplazada hacia abajo
    ctx.save();
    // sombra principal (mismo radio que la ficha)
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.arc(0, radius * 0.9, radius, 0, Math.PI * 2);
    ctx.fill();
    // borde exterior más suave (ligeramente mayor)
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.arc(0, radius * 0.9, radius * 1.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

        // --- INICIO DEL CAMBIO CON CLIPPING ---
        ctx.save(); // 1. Guardar estado

        // 2. Definir la forma circular para el recorte (en el centro, ya que estamos transladados)
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI*2);

        // 3. Aplicar la máscara de recorte
        ctx.clip();

        // 4. Dibujar la imagen
        if (this.pegImageLoaded) {
            const imgRadius = radius * 1.1;
            ctx.drawImage(this.pegImage, -imgRadius, -imgRadius, imgRadius * 2, imgRadius * 2);
        } else {
            // Fallback si la imagen no carga
            ctx.fillStyle = '#FFD54F';
            ctx.fill(); // Rellena el círculo del paso 2
        }

        // 5. Restaurar para quitar la máscara
        ctx.restore();
        // --- FIN DEL CAMBIO CON CLIPPING ---

        // borde sutil (lo dibujamos después de restaurar para que no se recorte)
        ctx.beginPath();
        ctx.lineWidth = Math.max(1, this.cellSize * 0.02);
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.arc(0, 0, radius, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
    }

    _drawButton(ctx, x, y, w, h, label, hovered = false){
        ctx.save();
        const radius = Math.min(12, Math.floor(h * 0.35));

        // drop shadow for depth; slightly stronger when hovered
        ctx.shadowColor = 'rgba(0,0,0,0.28)';
        ctx.shadowBlur = Math.max(6, Math.floor(this.cellSize * 0.06)) * (hovered ? 1.2 : 1);
        ctx.shadowOffsetY = hovered ? 3 : 2;

        // background that combines well with varied page backgrounds (dark, slightly warm)
        ctx.fillStyle = hovered ? 'rgba(40,44,48,0.96)' : 'rgba(20,24,28,0.86)';

        // rounded rect path
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
        ctx.fill();

        // subtle border
        ctx.shadowColor = 'transparent'; // don't shadow stroke/text
        ctx.lineWidth = Math.max(1, Math.floor(this.cellSize * 0.02));
        ctx.strokeStyle = hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)';
        ctx.stroke();

        // label
        ctx.fillStyle = 'rgba(255,255,255,0.98)';
        const fontSize = Math.max(12, Math.floor(h * (hovered ? 0.48 : 0.45)));
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w/2, y + h/2);
        ctx.restore();
    }

    _roundRectPath(ctx, x, y, w, h, r){
        // crea la ruta de un rectángulo redondeado (no la rellena ni la dibuja)
        if (r <= 0) {
            ctx.rect(x, y, w, h);
            return;
        }
        const radius = Math.min(r, w/2, h/2);
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }

    _hitHudButton(x,y){
        const r = this._hudRegions;
        if (r.reset && this._pointInRect(x,y,r.reset)){
            if (this._onResetCallback) this._onResetCallback();
            else if (this.ui.resetBtn) this.ui.resetBtn.click();
            return true;
        }
        if (r.undo && this._pointInRect(x,y,r.undo)){
            if (this._onUndoCallback) this._onUndoCallback();
            else if (this.ui.undoBtn) this.ui.undoBtn.click();
            return true;
        }
        if (r.hint && this._pointInRect(x,y,r.hint)){
            if (this._onHintCallback) this._onHintCallback();
            else if (this.ui.hintBtn) this.ui.hintBtn.click();
            return true;
        }
        return false;
    }

    _pointInRect(x,y,rect){
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }

    _startArrowAnim(){
        if (this._arrowAnimating) return;
        this._arrowAnimating = true;
        this._animStart = performance.now();
        const tick = (t)=>{
            if (!this._arrowAnimating) return;
            // solicitar a la vista que renderice el frame actual
            if (this._renderOnUpdate) this._renderOnUpdate();
            this._rafId = requestAnimationFrame(tick);
        };
        this._rafId = requestAnimationFrame(tick);
    }

    _stopArrowAnim(){
        this._arrowAnimating = false;
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = null;
    }

    highlightCells(cells){
        // Acepta: un array de destinos O un objeto { source: {r,c}, targets: [...] }
        if (!cells) return;
        if (Array.isArray(cells)){
            this._highlightedCells = cells.map(c=>({r:(c.r!==undefined?c.r:c[0]), c:(c.c!==undefined?c.c:c[1])}));
            // no arrow animation without a source
            this._arrowSource = null;
            this._arrowTargets = null;
            this._stopArrowAnim && this._stopArrowAnim();
        } else if (cells && cells.source && Array.isArray(cells.targets)){
            this._highlightedCells = cells.targets.map(c=>({r:(c.r!==undefined?c.r:c[0]), c:(c.c!==undefined?c.c:c[1])}));
            this._arrowSource = { r: cells.source.r, c: cells.source.c };
            this._arrowTargets = this._highlightedCells.slice();
            this._startArrowAnim && this._startArrowAnim();
        } else {
            this._highlightedCells = [];
            this._arrowSource = null;
            this._arrowTargets = null;
            this._stopArrowAnim && this._stopArrowAnim();
        }
        if (this._renderOnUpdate) this._renderOnUpdate();
    }

    clearHighlights(){ this._highlightedCells = []; this._arrowSource = null; this._arrowTargets = null; this._stopArrowAnim && this._stopArrowAnim(); if (this._renderOnUpdate) this._renderOnUpdate(); }

    setRenderCallback(cb){ this._renderOnUpdate = cb; }

    showBanner(text, type='info'){
        // Elimina cualquier banner anterior
        if (this._bannerEl && this._bannerEl.parentNode) {
            this._bannerEl.parentNode.removeChild(this._bannerEl);
            this._bannerEl = null;
        }
        const banner = document.createElement('div');
        banner.className = `peg-banner peg-banner-${type}`;
        banner.textContent = text;
        // Estilos básicos inline para asegurar visibili    dad
        banner.style.position = 'absolute';
        banner.style.top = '24px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.padding = '16px 32px';
        banner.style.background = type === 'warning' ? '#ff9800' :  '#1976d2';
        banner.style.color = '#fff';
        banner.style.fontSize = '1.2rem';
        banner.style.fontWeight = 'bold';
        banner.style.borderRadius = '8px';
        banner.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
        banner.style.zIndex = '1000';
        banner.style.pointerEvents = 'none';
        // Insertar sobre el canvas
        const parent = this.canvas.parentElement || document.body;
        parent.appendChild(banner);
        this._bannerEl = banner;
        setTimeout(()=> {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
            if (this._bannerEl === banner) this._bannerEl = null;
        }, 2200);
    }

}

