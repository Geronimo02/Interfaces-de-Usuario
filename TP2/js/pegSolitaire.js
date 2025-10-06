class PegSolitaireGame {
    constructor() {
        this.board = [];
        this.selectedPeg = null;
        this.moveHistory = [];
        this.moveCount = 0;
        this.pegCount = 32;
        
        this.initializeBoard();
        this.renderBoard();
        this.bindEvents();
        this.updateUI();
    }

    initializeBoard() {
        // Crear tablero 7x7 con patrón de cruz
        this.board = Array(7).fill().map(() => Array(7).fill(0));
        
        // Definir el patrón de cruz del Peg Solitaire
        const pattern = [
            [0,0,1,1,1,0,0],
            [0,0,1,1,1,0,0],
            [1,1,1,1,1,1,1],
            [1,1,1,0,1,1,1], // Centro vacío
            [1,1,1,1,1,1,1],
            [0,0,1,1,1,0,0],
            [0,0,1,1,1,0,0]
        ];

        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                this.board[row][col] = pattern[row][col];
            }
        }
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';

        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (this.board[row][col] === 0 && this.isValidPosition(row, col)) {
                    cell.classList.add('hole');
                } else if (this.board[row][col] === 1) {
                    cell.classList.add('peg');
                    // Alternar entre Homer y Bart
                    if ((row + col) % 2 === 0) {
                        cell.classList.add('homer');
                    } else {
                        cell.classList.add('bart');
                    }
                } else {
                    cell.classList.add('invalid');
                }

                cell.addEventListener('click', () => this.handleCellClick(row, col));
                gameBoard.appendChild(cell);
            }
        }
    }

    isValidPosition(row, col) {
        // Verificar si la posición está dentro del patrón de cruz
        if (row >= 0 && row <= 1 && col >= 2 && col <= 4) return true;
        if (row >= 2 && row <= 4 && col >= 0 && col <= 6) return true;
        if (row >= 5 && row <= 6 && col >= 2 && col <= 4) return true;
        return false;
    }

    handleCellClick(row, col) {
        if (!this.isValidPosition(row, col)) return;

        if (this.board[row][col] === 1) {
            // Seleccionar una ficha
            this.selectPeg(row, col);
        } else if (this.board[row][col] === 0 && this.selectedPeg) {
            // Intentar mover a una posición vacía
            this.attemptMove(row, col);
        }
    }

    selectPeg(row, col) {
        // Limpiar selecciones anteriores
        this.clearHighlights();
        
        this.selectedPeg = { row, col };
        
        // Resaltar la ficha seleccionada
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
        
        // Mostrar posibles movimientos
        this.showPossibleMoves(row, col);
        
        this.updateMessage("Ficha seleccionada. Haz clic en una posición válida para mover.");
    }

    showPossibleMoves(row, col) {
        const directions = [
            [-2, 0], [2, 0], [0, -2], [0, 2]  // Arriba, Abajo, Izquierda, Derecha
        ];

        directions.forEach(([dRow, dCol]) => {
            const newRow = row + dRow;
            const newCol = col + dCol;
            const middleRow = row + dRow / 2;
            const middleCol = col + dCol / 2;

            if (this.canMove(row, col, newRow, newCol)) {
                const cell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
                cell.classList.add('possible-move');
            }
        });
    }

    canMove(fromRow, fromCol, toRow, toCol) {
        // Verificar límites
        if (!this.isValidPosition(toRow, toCol)) return false;
        
        // Verificar que la posición destino esté vacía
        if (this.board[toRow][toCol] !== 0) return false;
        
        // Verificar que hay una ficha en el medio para saltar
        const middleRow = (fromRow + toRow) / 2;
        const middleCol = (fromCol + toCol) / 2;
        
        if (!Number.isInteger(middleRow) || !Number.isInteger(middleCol)) return false;
        if (this.board[middleRow][middleCol] !== 1) return false;
        
        return true;
    }

    attemptMove(toRow, toCol) {
        if (!this.selectedPeg) return;
        
        const { row: fromRow, col: fromCol } = this.selectedPeg;
        
        if (this.canMove(fromRow, fromCol, toRow, toCol)) {
            this.makeMove(fromRow, fromCol, toRow, toCol);
        } else {
            this.updateMessage("Movimiento inválido. Selecciona otra posición.", "error");
            this.playSound('error');
        }
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        // Guardar estado para deshacer
        this.moveHistory.push(JSON.parse(JSON.stringify(this.board)));
        
        const middleRow = (fromRow + toRow) / 2;
        const middleCol = (fromCol + toCol) / 2;
        
        // Animar el movimiento
        this.animateMove(fromRow, fromCol, toRow, toCol, middleRow, middleCol);
        
        // Actualizar tablero
        this.board[fromRow][fromCol] = 0;
        this.board[middleRow][middleCol] = 0;
        this.board[toRow][toCol] = 1;
        
        this.moveCount++;
        this.pegCount--;
        
        setTimeout(() => {
            this.renderBoard();
            this.clearHighlights();
            this.selectedPeg = null;
            this.updateUI();
            this.checkGameStatus();
        }, 600);
        
        this.playSound('move');
    }

    animateMove(fromRow, fromCol, toRow, toCol, middleRow, middleCol) {
        const fromCell = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
        const middleCell = document.querySelector(`[data-row="${middleRow}"][data-col="${middleCol}"]`);
        
        fromCell.classList.add('jumping');
        middleCell.classList.add('disappearing');
    }

    clearHighlights() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'possible-move');
        });
    }

    updateUI() {
        document.getElementById('pegsLeft').textContent = this.pegCount;
        document.getElementById('moveCount').textContent = this.moveCount;
    }

    updateMessage(text, type = '') {
        const messageEl = document.getElementById('gameMessage');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
    }

    checkGameStatus() {
        const possibleMoves = this.getAllPossibleMoves();
        
        if (possibleMoves.length === 0) {
            if (this.pegCount === 1) {
                this.updateMessage("¡Felicidades! ¡Ganaste el juego! ¡D'oh! - Homer", "success");
                this.playSound('win');
            } else {
                this.updateMessage(`Juego terminado. Te quedaron ${this.pegCount} fichas. ¡Inténtalo de nuevo!`, "error");
                this.playSound('lose');
            }
        } else {
            this.updateMessage(`¡Excelente movimiento! ${possibleMoves.length} movimientos posibles restantes.`);
        }
    }

    getAllPossibleMoves() {
        const moves = [];
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                if (this.board[row][col] === 1) {
                    const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];
                    directions.forEach(([dRow, dCol]) => {
                        const newRow = row + dRow;
                        const newCol = col + dCol;
                        if (this.canMove(row, col, newRow, newCol)) {
                            moves.push({ from: [row, col], to: [newRow, newCol] });
                        }
                    });
                }
            }
        }
        return moves;
    }

    reset() {
        this.moveHistory = [];
        this.moveCount = 0;
        this.pegCount = 32;
        this.selectedPeg = null;
        this.initializeBoard();
        this.renderBoard();
        this.updateUI();
        this.updateMessage("¡Juego reiniciado! Haz clic en una ficha para comenzar.");
        this.playSound('reset');
    }

    undo() {
        if (this.moveHistory.length > 0) {
            this.board = this.moveHistory.pop();
            this.moveCount = Math.max(0, this.moveCount - 1);
            this.pegCount++;
            this.selectedPeg = null;
            this.renderBoard();
            this.clearHighlights();
            this.updateUI();
            this.updateMessage("Movimiento deshecho.");
            this.playSound('undo');
        } else {
            this.updateMessage("No hay movimientos para deshacer.", "error");
        }
    }

    showHint() {
        const moves = this.getAllPossibleMoves();
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            const [fromRow, fromCol] = randomMove.from;
            const [toRow, toCol] = randomMove.to;
            
            this.clearHighlights();
            
            const fromCell = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
            const toCell = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
            
            fromCell.style.animation = 'pulse 0.5s ease-in-out 3';
            toCell.style.animation = 'glow 0.5s ease-in-out 3';
            
            this.updateMessage(`Pista: Mueve desde (${fromRow + 1}, ${fromCol + 1}) a (${toRow + 1}, ${toCol + 1})`);
            this.playSound('hint');
        } else {
            this.updateMessage("No hay movimientos disponibles.", "error");
        }
    }

    playSound(type) {
        // Simulación de sonidos con efectos visuales
        const sounds = {
            move: () => console.log("🔊 ¡Excelente movimiento!"),
            win: () => console.log("🎉 ¡D'oh! ¡Ganaste!"),
            lose: () => console.log("😅 ¡Ay, caramba!"),
            error: () => console.log("❌ Movimiento inválido"),
            reset: () => console.log("🔄 Juego reiniciado"),
            undo: () => console.log("↶ Movimiento deshecho"),
            hint: () => console.log("💡 Aquí tienes una pista")
        };
        
        if (sounds[type]) {
            sounds[type]();
        }
    }

    bindEvents() {
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        
        // Controles de teclado
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'r':
                    this.reset();
                    break;
                case 'z':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.undo();
                    }
                    break;
                case 'h':
                    this.showHint();
                    break;
            }
        });
    }
}

// Inicializar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const game = new PegSolitaireGame();
    
    // Hacer la instancia global para debugging
    window.pegSolitaire = game;
});
