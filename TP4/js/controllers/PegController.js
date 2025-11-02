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
    // iniciar selección/arrastre si existe ficha
        if (!this.model.isValidPosition(row,col)) return;
        if (this.model.board[row][col] === 1){
            this.selected = {row,col};
            // calcular destinos válidos y resaltarlos
            const moves = [];
            const dirs = [[-2,0],[2,0],[0,-2],[0,2]];
            dirs.forEach(([dr,dc])=>{
                const nr = row+dr, nc = col+dc;
                if (this.model.canMove(row,col,nr,nc)) moves.push([nr,nc]);
            });
            this._possibleMoves = moves;
            this.view.highlightCells({ source: { r: row, c: col }, targets: moves });
            this.view.showMessage('Arrastrando ficha...');
            return true;
        }
        return false;
    }

    _onPointerUp(row,col,e){
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
    // si no, limpiar selección/resaltados
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
        if (moves.length === 0) { this.view.showMessage('No hay movimientos'); return; }
        const mv = moves[Math.floor(Math.random()*moves.length)];
        this.view.showMessage(`Pista: ${mv.from} → ${mv.to}`);
    }

    startTimer(){
        this.stopTimer();
        const timerEl = this.ui.timerEl;
        this.timer = setInterval(()=>{
            if (this.gameOver) { this.stopTimer(); return; }
            this.remainingTime--;
            // actualizar timer en DOM si está presente
            if (timerEl) timerEl.textContent = `${String(Math.floor(this.remainingTime/60)).padStart(2,'0')}:${String(this.remainingTime%60).padStart(2,'0')}`;
            // pedir a la vista que vuelva a renderizar para actualizar el HUD dentro del canvas
            if (this.view && this.view.render) this.view.render(this.model);
            if (this.remainingTime <= 0){
                this.remainingTime = 0;
                this.gameOver = true;
                if (this.view) this.view.showMessage('Tiempo agotado');
                this.stopTimer();
            }
        },1000);
    }

    stopTimer(){ if (this.timer) clearInterval(this.timer); this.timer = null; }

    checkStatus(){
        const moves = this.model.getAllPossibleMoves();
        if (moves.length === 0){
            this.gameOver = true;
            if (this.model.pegCount === 1) this.view.showMessage('¡Ganaste!');
            else this.view.showMessage(`Juego terminado. Quedaron ${this.model.pegCount} fichas.`);
            this.stopTimer();
        }
    }
}
