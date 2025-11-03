import PegModel from '../models/PegModel.js';

export default class PegController {
    constructor(canvas, uiSelectors = {}){
        this.model = new PegModel();
        this.view = null; // inyectada en init
        this.canvas = canvas;
        this.ui = uiSelectors;
        this.timer = null;
        this.remainingTime = uiSelectors.initialTime || 300;
        this.gameOver = false;
        // estado temporal para distinguir click vs hold/drag
        this._pressTimer = null;
        this._pressInfo = null; // { row, col, clientX, clientY, pointerId }
        this._dragThreshold = 6; // px
        this._longPressMs = 220; // ms para considerar long-press (iniciar selección/drag)
    }

    init(view){
        this.view = view;
        this.view.onClick((r,c)=> this.handleClick(r,c));
    // callback de render para que la vista pueda solicitar un re-render
        if (this.view.setRenderCallback) this.view.setRenderCallback(()=> this.view.render(this.model));
    // manejadores pointer (arrastrar/soltar)
        if (this.view.onPointerDown) this.view.onPointerDown((r,c,e)=> this._onPointerDown(r,c,e));
        if (this.view.onPointerUp) this.view.onPointerUp((r,c,e)=> this._onPointerUp(r,c,e));
    if (this.view.onPointerMove) this.view.onPointerMove((r,c,e)=> this._onPointerMove && this._onPointerMove(r,c,e));
    // botones del HUD dentro del canvas
    if (this.view.onReset) this.view.onReset(()=> this.reset());
    if (this.view.onUndo) this.view.onUndo(()=> this.undo());
    if (this.view.onHint) this.view.onHint(()=> this.showHint());
    // conectar botones DOM (compatibilidad)
        if (this.ui.resetBtn) this.ui.resetBtn.addEventListener('click', ()=> this.reset());
        if (this.ui.undoBtn) this.ui.undoBtn.addEventListener('click', ()=> this.undo());
        if (this.ui.hintBtn) this.ui.hintBtn.addEventListener('click', ()=> this.showHint());
        this.startTimer();
        this.view.render(this.model);
    }

    handleClick(row,col){
        if (!this.model.isValidPosition(row,col)) return;
        // Si hay una pista activa y el usuario clickea un destino sugerido, ejecutar el movimiento directamente
        if (!this.selected && this._hint){
            const hintTargets = this._hint.targets || [];
            const match = hintTargets.find(t => t.row === row && t.col === col);
            if (match){
                const from = this._hint.from;
                if (this.model.canMove(from.row, from.col, row, col)){
                    this.model.makeMove(from.row, from.col, row, col);
                    this.view.clearHighlights && this.view.clearHighlights();
                    this.view.render(this.model);
                    this.view.showMessage('Movimiento realizado (pista)');
                    this._hint = null;
                    this.checkStatus();
                    return;
                }
            } else {
                // si clickea en cualquier otro sitio, quitar la pista activa y continuar
                this._hint = null;
                this.view.clearHighlights && this.view.clearHighlights();
            }
        }

        if (!this.selected){
            if (this.model.board[row][col] === 1){
                this.selected = {row,col};
                // resaltar destinos válidos
                const moves = [];
                const dirs = [[-2,0],[2,0],[0,-2],[0,2]];
                dirs.forEach(([dr,dc])=>{
                    const nr = row+dr, nc = col+dc;
                    if (this.model.canMove(row,col,nr,nc)) moves.push([nr,nc]);
                });
                if (moves.length) this.view.highlightCells({ source: { r: row, c: col }, targets: moves });
                this.view.showMessage('Ficha seleccionada');
            }
        } else {
            const from = this.selected;
            if (this.model.canMove(from.row,from.col,row,col)){
                this.model.makeMove(from.row,from.col,row,col);
                this.selected = null;
                this.view.clearHighlights && this.view.clearHighlights();
                this.view.render(this.model);
                this.view.showMessage('Movimiento realizado');
                this.checkStatus();
            } else {
                // si clickeo otra ficha seleccionable, cambiar selección
                if (this.model.board[row][col] === 1){
                    this.selected = {row,col};
                    const moves = [];
                    const dirs = [[-2,0],[2,0],[0,-2],[0,2]];
                    dirs.forEach(([dr,dc])=>{
                        const nr = row+dr, nc = col+dc;
                        if (this.model.canMove(row,col,nr,nc)) moves.push([nr,nc]);
                    });
                    this.view.highlightCells({ source: { r: row, c: col }, targets: moves });
                    this.view.showMessage('Ficha seleccionada');
                } else {
                    this.view.showMessage('Movimiento inválido');
                }
            }
        }
    }

    _onPointerDown(row,col,e){
        // iniciar proceso de press: no seleccionamos inmediatamente para distinguir
        // click (handleClick) de mantener/apretar para arrastrar.
        if (!this.model.isValidPosition(row,col)) return false;
        if (this.model.board[row][col] === 1){
            // almacenar info del press y programar long-press
            this._pressInfo = { row, col, clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId };
            if (this._pressTimer) { clearTimeout(this._pressTimer); this._pressTimer = null; }
            this._pressTimer = setTimeout(()=>{
                // si el usuario mantiene presionado, iniciar la selección para arrastre
                this._selectForDrag(this._pressInfo.row, this._pressInfo.col);
                this._pressTimer = null;
            }, this._longPressMs);
            return true; // indicar a la vista que puede capturar el pointer para arrastre
        }
        return false;
    }

    _onPointerMove(row,col,e){
        // si hay un press en curso y el usuario mueve, si supera el umbral iniciamos selección (drag)
        if (this._pressInfo && !this.selected){
            const dx = e.clientX - this._pressInfo.clientX;
            const dy = e.clientY - this._pressInfo.clientY;
            if (Math.sqrt(dx*dx + dy*dy) > this._dragThreshold){
                // iniciar selección para arrastre
                if (this._pressTimer){ clearTimeout(this._pressTimer); this._pressTimer = null; }
                this._selectForDrag(this._pressInfo.row, this._pressInfo.col);
            }
        }
    }

    _selectForDrag(row,col){
        // marcar como seleccionada y calcular posibles movimientos
        this.selected = { row, col };
        const moves = [];
        const dirs = [[-2,0],[2,0],[0,-2],[0,2]];
        dirs.forEach(([dr,dc])=>{
            const nr = row+dr, nc = col+dc;
            if (this.model.canMove(row,col,nr,nc)) moves.push([nr,nc]);
        });
        this._possibleMoves = moves;
        this.view.highlightCells({ source: { r: row, c: col }, targets: moves });
        this.view.showMessage('Arrastrando ficha...');
    }

    _onPointerUp(row,col,e){
        // cancelar cualquier press pendiente
        if (this._pressTimer){ clearTimeout(this._pressTimer); this._pressTimer = null; }
        this._pressInfo = null;

        // soltar: si el destino está en possibleMoves, realizar el movimiento
        if (this.selected && Array.isArray(this._possibleMoves)){
            const match = this._possibleMoves.find(m => m[0] === row && m[1] === col);
            if (match){
                const from = this.selected;
                this.model.makeMove(from.row, from.col, row, col);
                this.view.clearHighlights && this.view.clearHighlights();
                this.view.render(this.model);
                this.view.showMessage('Movimiento realizado');
                this.selected = null;
                this._possibleMoves = null;
                this.checkStatus();
                return;
            }
        }
        // si no se realizó movimiento, limpiar selección/resaltados
        this.selected = null;
        this._possibleMoves = null;
        this.view.clearHighlights && this.view.clearHighlights();
    }

    reset(){
        this.model.initializeBoard();
        this.model.moveHistory = [];
        this.model.moveCount = 0;
        this.remainingTime = this.ui.initialTime || 300;
        this.gameOver = false;
        this.view.render(this.model);
        this.view.showMessage('Juego reiniciado');
        // --- AÑADIR ESTA LÍNEA ---
        this.startTimer();
    }

    undo(){
        if (this.model.undo()){
            this.view.render(this.model);
            this.view.showMessage('Movimiento deshecho');
        } else {
            this.view.showMessage('No hay movimientos para deshacer');
        }
    }

    showHint(){
        const moves = this.model.getAllPossibleMoves();
        if (moves.length === 0) { 
            this.view.showMessage('No hay movimientos'); 
            this.view.showBanner && this.view.showBanner('No hay movimientos posibles', 'warning');
            this.view.clearHighlights && this.view.clearHighlights();
            return; 
        }
        const mv = moves[Math.floor(Math.random()*moves.length)];
        // Resalta la ficha origen y el destino sugerido
        this.view.highlightCells({ 
            source: { r: mv.from[0], c: mv.from[1] }, 
            targets: [mv.to] 
        });
        const msg = `Pista: (${mv.from[0]+1},${mv.from[1]+1}) → (${mv.to[0]+1},${mv.to[1]+1})`;
        this.view.showMessage(msg);
        this.view.showBanner && this.view.showBanner(msg, 'info');
        // Registrar la pista en el controlador para que el click sobre el destino la ejecute
        this._hint = {
            from: { row: mv.from[0], col: mv.from[1] },
            targets: [ { row: mv.to[0], col: mv.to[1] } ]
        };
        // No dejar selección activa (evita comportamiento virtual), pero mantener el highlight visual en la vista
        this.selected = null;
        this._possibleMoves = null;
    }

    startTimer(){
        this.stopTimer();
        const timerEl = this.ui.timerEl;
        this.timer = setInterval(()=>{
            if (this.gameOver) { this.stopTimer(); return; }
            this.remainingTime--;
            if (this.remainingTime < 0) this.remainingTime = 0; // Evitar números negativos

            // actualizar timer en DOM si está presente
            if (timerEl) timerEl.textContent = `${String(Math.floor(this.remainingTime/60)).padStart(2,'0')}:${String(this.remainingTime%60).padStart(2,'0')}`;
            
            // pedir a la vista que vuelva a renderizar para actualizar el HUD dentro del canvas
            if (this.view && this.view.render) this.view.render(this.model);

            // --- INICIO DEL CAMBIO ---
            // Si el tiempo se agota, llamar a checkStatus para que maneje el fin del juego
            if (this.remainingTime <= 0){
                this.checkStatus();
            }
            // --- FIN DEL CAMBIO --- (Eliminar el bloque if anterior que estaba aquí)

        },1000);
    }

    stopTimer(){
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }

    checkStatus(){
        if (this.gameOver) return;

        // --- INICIO DEL CAMBIO ---
        // Mover la comprobación del tiempo para que tenga prioridad
        if (this.remainingTime <= 0){
            this.gameOver = true;
            this.stopTimer();
            this.view.showBanner('¡Se acabó el tiempo!', 'warning');
            return; // Salir para no mostrar otros mensajes
        }
        // --- FIN DEL CAMBIO ---

        const possibleMoves = this.model.getAllPossibleMoves();
        if (this.model.pegCount === 1){
            this.gameOver = true;
            this.stopTimer();
            this.view.showBanner('¡Has ganado!', 'success');
        } else if (possibleMoves.length === 0){
            this.gameOver = true;
            this.stopTimer();
            this.view.showBanner('¡Fin del juego! No hay más movimientos', 'warning');
        }
        // Se elimina la comprobación del tiempo de aquí porque ya se hizo arriba
    }
}
