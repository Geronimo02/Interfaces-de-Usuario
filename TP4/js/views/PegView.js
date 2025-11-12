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
        this.pegImage.src = './assets/images/homer.png';
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

    // Asegura que los controles HTML (reset, undo, hint, contador, timer)
    // estén enlazados con la vista y se muevan junto al canvas cuando se redimensiona.
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

    // Maneja cambios de tamaño del canvas cuando cambia el tamaño de la ventana.
    // Ajusta devicePixelRatio, escala del contexto y recalcula tamaño/offsets del tablero.
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

    // Registra un manejador para clicks simples sobre celdas.
    // callback: (row, col) => void
    onClick(handler){ this._clickHandler = handler; }

    // Registra callbacks para el flujo de pointer/drag. Estos son usados por
    // el controlador para coordinar selección, arrastre y suelta.
    // onPointerDown: (row,col,event) => boolean (retornar true para permitir drag)
    onPointerDown(handler){ this._pointerDownHandler = handler; }
    // onPointerMove: (row,col,event) => void
    onPointerMove(handler){ this._pointerMoveHandler = handler; }
    // onPointerUp: (row,col,event) => void
    onPointerUp(handler){ this._pointerUpHandler = handler; }

    // Callbacks de control externos: reset, undo, hint. Si no se proveen,
    // la vista intenta clicar los botones DOM correspondientes (si existen).
    onReset(handler){ this._onResetCallback = handler; }
    onUndo(handler){ this._onUndoCallback = handler; }
    onHint(handler){ this._onHintCallback = handler; }

    // Handler interno para pointerdown en el canvas.
    // - Traduce la posición del puntero a (row,col)
    // - Si la posición está sobre el HUD, delega a _hitHudButton
    // - Pregunta al controlador si se permite iniciar el arrastre
    // - Si se permite, captura el pointer y guarda el estado de arrastre
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

        // Preguntar al controller si está permitido iniciar arrastre
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

    // Handler interno para pointermove.
    // Actualiza hover del HUD y, si se está arrastrando, calcula la nueva
    // posición visual de la ficha arrastrada y notifica al controlador.
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

    // Handler interno para pointerup: finaliza el arrastre, libera pointer
    // y notifica al controlador de la celda destino (si corresponde).
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

    // Handler para pointercancel: asegura limpiar el estado si el pointer se pierde.
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

    // Handler para clicks simples (no drag). Traduce a celda y llama a _clickHandler
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

    // Convierte un evento pointer/click a coordenadas de celda y coordenadas locales
    // Devuelve { row, col, localX, localY } donde localX/Y son relativas al origen del tablero
    _getCellFromEvent(e){
        const r = this.canvas.getBoundingClientRect();
        const x = e.clientX - r.left - this._originX;
        const y = e.clientY - r.top - this._originY;
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return { row, col, localX: x, localY: y };
    }

    // Render principal: dibuja fondo, panel de madera, celdas, fichas, HUD y overlays.
    // `model` debe exponer: board[row][col], isValidPosition(r,c), pegCount, moveCount
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
            // ruta del rectángulo redondeado para el panel central
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
                // Añade vetas de madera sutiles
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

        // dibuja circulo animado de ayuda
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

    // Dibuja la HUD dentro del canvas: paneles laterales, estadísticas y botones.
    // Calcula también las regiones de hit-testing en this._hudRegions para clicks.
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

    // Dibuja animaciones de pista (arcos rotando) alrededor de las celdas objetivo.
    _drawArrows(ctx, originX, originY, model){
        const now = performance.now();
        const elapsed = now - this._animStart;
        const p = ((elapsed % this._animDuration) / this._animDuration);
        // dibuja en cada celda objetivo un 'rotador' compuesto por 3 barras amarillas
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



    // Dibuja la ficha seleccionada o la que se está arrastrando. Aplica escala, sombra
    // y usa clipping para pintar la imagen dentro de un círculo.
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

    // Dibuja un botón estilizado dentro del canvas. No gestiona eventos, solo render.
    _drawButton(ctx, x, y, w, h, label, hovered = false){
        ctx.save();
        const radius = Math.min(12, Math.floor(h * 0.35));

        // sombra proyectada para dar profundidad; ligeramente más intensa al pasar el cursor
        ctx.shadowColor = 'rgba(0,0,0,0.28)';
        ctx.shadowBlur = Math.max(6, Math.floor(this.cellSize * 0.06)) * (hovered ? 1.2 : 1);
        ctx.shadowOffsetY = hovered ? 3 : 2;
        ctx.fillStyle = hovered ? 'rgba(40,44,48,0.96)' : 'rgba(20,24,28,0.86)';

        // ruta del rectángulo redondeado
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

    // Crea una ruta de rectángulo redondeado en el contexto (no la rellena ni strokea).
    // Útil como helper para dibujar celdas y paneles con esquinas redondeadas.
    _roundRectPath(ctx, x, y, w, h, r){
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

    // Comprueba si un punto (x,y) está sobre algún botón HUD y, si es así,
    // dispara el callback correspondiente o simula un click en el botón DOM.
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

    // Helper: determina si un punto (x,y) está dentro de un rect {x,y,w,h}
    _pointInRect(x,y,rect){
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }

    // Inicia el loop de animación para las flechas/pistas, usando requestAnimationFrame.
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

    // Detiene la animación de flechas y cancela el RAF si existe.
    _stopArrowAnim(){
        this._arrowAnimating = false;
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = null;
    }

    // Destaca visualmente un conjunto de celdas. También puede activar
    // la animación de flechas si se pasa un objeto con { source, targets }.
    // Parámetros aceptados:
    // - Array de celdas: [{r,c}, ...]  -> solo highlight
    // - Objeto { source: {r,c}, targets: [{r,c}, ...] } -> highlight + animación
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

    // Quita cualquier highlight y detiene animaciones asociadas.
    clearHighlights(){ this._highlightedCells = []; this._arrowSource = null; this._arrowTargets = null; this._stopArrowAnim && this._stopArrowAnim(); if (this._renderOnUpdate) this._renderOnUpdate(); }

    // Registra la función que la vista llamará para solicitar un re-render.
    // Normalmente el controlador pasa una función que llama a view.render(model).
    setRenderCallback(cb){ this._renderOnUpdate = cb; }

   

    /**
     * Muestra una pantalla de fin de juego (overlay rojo) centrada sobre el área del juego.
     * Opciones: { message, remaining, onRestart }
     */
    showGameOver(opts = {}){
        // limpiar cualquier overlay o banner previo
        if (this._gameOverEl && this._gameOverEl.parentNode) {
            this._gameOverEl.parentNode.removeChild(this._gameOverEl);
            this._gameOverEl = null;
        }

        const parent = this.canvas.parentElement || document.body;
        // garantizar que el contenedor padre tenga position: relative para el overlay absoluto
        const prevPos = parent.style.position;
        if (!prevPos || prevPos === '') parent.style.position = parent.style.position || 'relative';

        const overlay = document.createElement('div');
        overlay.className = 'peg-gameover-overlay';
        // estilos inline para asegurar apariencia consistente
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.background = 'rgba(180,20,20,0.98)';
        overlay.style.color = '#fff';
        overlay.style.zIndex = '9999';
        overlay.style.padding = '24px';
        overlay.style.boxSizing = 'border-box';

        const title = document.createElement('h2');
        title.textContent = opts.message || 'Fin del juego';
        title.style.margin = '0 0 12px 0';
        title.style.fontSize = '1.6rem';
        title.style.textAlign = 'center';
        title.style.textShadow = '0 2px 8px rgba(0,0,0,0.45)';
        overlay.appendChild(title);

        if (typeof opts.remaining === 'number'){
            const p = document.createElement('p');
            p.textContent = `Quedan ${opts.remaining} fichas en el tablero.`;
            p.style.margin = '0 0 20px 0';
            p.style.opacity = '0.95';
            p.style.fontSize = '1.05rem';
            overlay.appendChild(p);
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'peg-gameover-restart';
        btn.textContent = '🔁 Reiniciar';
        btn.style.padding = '12px 20px';
        btn.style.fontSize = '1.05rem';
        btn.style.border = 'none';
        btn.style.borderRadius = '8px';
        btn.style.cursor = 'pointer';
        btn.style.background = '#ffffff';
        btn.style.color = '#b00000';
        btn.style.fontWeight = '700';
        btn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.28)';

        // handler reinicio: preferir callback pasado, si no usar el callback onReset de la vista
        btn.addEventListener('click', ()=>{
            // remover overlay inmediatamente
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (this._gameOverEl === overlay) this._gameOverEl = null;
            // restaurar posicion previa del padre si la cambiamos anteriormente (no forzar override)
            // (no hacemos nada complejo aquí para no romper estilos globales)
            if (typeof opts.onRestart === 'function'){
                try{ opts.onRestart(); } catch(e){ /* ignore errors from controller.reset */ }
            } else if (this._onResetCallback) {
                try{ this._onResetCallback(); } catch(e){}
            } else if (this.ui.resetBtn) {
                try{ this.ui.resetBtn.click(); } catch(e){}
            }
        });

        overlay.appendChild(btn);

        // Insertar overlay sobre el tablero (ajustar tamaño al área del tablero)
        try{
            const canvasRect = this.canvas.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            // posición del tablero dentro del parent (en px)
            const leftPx = (canvasRect.left - parentRect.left) + this._originX;
            const topPx = (canvasRect.top - parentRect.top) + this._originY;
            let boardW = this.cellSize * this.cols;
            let boardH = this.cellSize * this.rows;

            // Expandir el overlay un poco más que el tablero para cubrir también
            // el panel de madera/sombra alrededor. Usamos un margen relativo a cellSize.
            const margin = Math.max(12, Math.floor(this.cellSize * 0.2));
            const adjLeft = leftPx - margin;
            const adjTop = topPx - margin;
            boardW = boardW + margin * 2;
            boardH = boardH + margin * 2;

            overlay.style.position = 'absolute';
            overlay.style.left = `${adjLeft}px`;
            overlay.style.top = `${adjTop}px`;
            overlay.style.width = `${boardW}px`;
            overlay.style.height = `${boardH}px`;
            overlay.style.borderRadius = `${Math.max(10, Math.floor(this.cellSize * 0.12))}px`;
            // reducir alpha para que sea menos intrusiva
            overlay.style.background = 'rgba(180,20,20,0.78)';
        } catch(e) {
            // fallback: cubrir todo el contenedor si algo falla
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(180,20,20,0.78)';
        }
        parent.appendChild(overlay);
        this._gameOverEl = overlay;
    }

    /**
     * Pantalla de victoria (verde). Opciones: { message, remaining, onRestart }
     */
    showVictory(opts = {}){
        // eliminar overlay previo
        if (this._gameOverEl && this._gameOverEl.parentNode) {
            this._gameOverEl.parentNode.removeChild(this._gameOverEl);
            this._gameOverEl = null;
        }

        const parent = this.canvas.parentElement || document.body;
        // crear contenedor
        const overlay = document.createElement('div');
        overlay.className = 'peg-victory-overlay';
        // estilos base
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = '#fff';
        overlay.style.zIndex = '9999';
        overlay.style.padding = '20px';
        overlay.style.boxSizing = 'border-box';

        // intentar ubicar sobre el tablero (igual lógica que showGameOver)
        try{
            const canvasRect = this.canvas.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            const leftPx = (canvasRect.left - parentRect.left) + this._originX;
            const topPx = (canvasRect.top - parentRect.top) + this._originY;
            let boardW = this.cellSize * this.cols;
            let boardH = this.cellSize * this.rows;
            const margin = Math.max(12, Math.floor(this.cellSize * 0.2));
            const adjLeft = leftPx - margin;
            const adjTop = topPx - margin;
            boardW = boardW + margin * 2;
            boardH = boardH + margin * 2;

            overlay.style.position = 'absolute';
            overlay.style.left = `${adjLeft}px`;
            overlay.style.top = `${adjTop}px`;
            overlay.style.width = `${boardW}px`;
            overlay.style.height = `${boardH}px`;
            overlay.style.borderRadius = `${Math.max(10, Math.floor(this.cellSize * 0.12))}px`;
            overlay.style.background = 'linear-gradient(180deg, rgba(40,167,69,0.92), rgba(20,120,48,0.9))';
        } catch(e){
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'linear-gradient(180deg, rgba(40,167,69,0.92), rgba(20,120,48,0.9))';
        }

        const title = document.createElement('h2');
        title.textContent = opts.message || '¡Has ganado!';
        title.style.margin = '0 0 10px 0';
        title.style.fontSize = '1.6rem';
        title.style.textAlign = 'center';
        title.style.textShadow = '0 2px 8px rgba(0,0,0,0.35)';
        overlay.appendChild(title);

        const info = document.createElement('p');
        info.style.margin = '0 0 18px 0';
        info.style.fontSize = '1.05rem';
        info.style.opacity = '0.98';
        info.textContent = opts.remaining === 1 ? '¡Solo queda 1 ficha!' : `Quedan ${opts.remaining} fichas`;
        overlay.appendChild(info);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'peg-victory-restart';
        btn.textContent = '🎉 Jugar de nuevo';
        btn.style.padding = '12px 22px';
        btn.style.fontSize = '1rem';
        btn.style.border = 'none';
        btn.style.borderRadius = '8px';
        btn.style.cursor = 'pointer';
        btn.style.background = '#fff';
        btn.style.color = '#1b5e20';
        btn.style.fontWeight = '700';
        btn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.22)';

        btn.addEventListener('click', ()=>{
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (this._gameOverEl === overlay) this._gameOverEl = null;
            if (typeof opts.onRestart === 'function'){
                try{ opts.onRestart(); } catch(e){}
            } else if (this._onResetCallback){
                try{ this._onResetCallback(); } catch(e){}
            } else if (this.ui.resetBtn){
                try{ this.ui.resetBtn.click(); } catch(e){}
            }
        });

        overlay.appendChild(btn);
        parent.appendChild(overlay);
        this._gameOverEl = overlay;
    }

}

