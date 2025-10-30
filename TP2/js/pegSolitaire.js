class PegSolitaireGame {
    constructor() {
        this.board = [];
        this.selectedPeg = null;
        this.moveHistory = [];
        this.moveCount = 0;
        this.pegCount = 32;

        // Timer (segundos) - ajuste según requerimiento
        this.timeLimit = 300; // 5 minutos por defecto
        this.remainingTime = this.timeLimit;
        this.timerInterval = null;
        this.gameOver = false;

        // Base absoluta para assets (imagenes). Ajusta si tu sitio root es distinto.
        this.ASSET_BASE = '/Interfaces-de-Usuario/TP2/assets';

        this.initializeBoard();
        this.renderBoard();
        this.bindEvents();
        this.updateUI();
        this.startTimer(); // iniciar el temporizador al cargar el juego
    }

    /**
     * Inicializa el tablero 7x7 con el patrón de cruz del Peg Solitaire
     */
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

    /**
     * Renderiza el tablero en el DOM.
     * - Añade atributos draggable a fichas
     * - Añade manejadores de click, dragstart, dragend, dragover y drop a las celdas
     */
    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';

        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Posición válida pero vacía -> hoyo
                if (this.board[row][col] === 0 && this.isValidPosition(row, col)) {
                    cell.classList.add('hole');
                } else if (this.board[row][col] === 1) {
                    // Ficha: crear un círculo coloreado en lugar de una imagen
                    cell.classList.add('peg');
                    const isHomer = ((row + col) % 2 === 0);
                    if (isHomer) {
                        cell.classList.add('homer');
                    } else {
                        cell.classList.add('bart');
                    }

                    // Crear div circular con color según tipo (Homer/Bart)
                    const peg = document.createElement('div');
                    peg.className = 'peg-circle';
                    // colores: Homer -> amarillo, Bart -> naranja (ajustables)
                    peg.style.backgroundColor = isHomer ? '#FFD54F' : '#FF7043';
                    peg.setAttribute('aria-hidden', 'true');
                    cell.appendChild(peg);

                    // Hacer la ficha arrastrable (en la celda)
                    cell.setAttribute('draggable', 'true');
                    cell.addEventListener('dragstart', (e) => this.handleDragStart(e, row, col));
                    cell.addEventListener('dragend', () => this.handleDragEnd());
                } else {
                    cell.classList.add('invalid');
                }

                // Click para seleccionar / mover
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                cell.addEventListener('dragover', (e) => { if (this.isValidPosition(row, col)) e.preventDefault(); });
                cell.addEventListener('drop', (e) => this.handleDrop(e, row, col));

                gameBoard.appendChild(cell);
            }
        }
    }

    /**
     * Verifica si la celda (row,col) pertenece al patrón válido del tablero.
     */
    isValidPosition(row, col) {
        // Verificar si la posición está dentro del patrón de cruz
        if (row >= 0 && row <= 1 && col >= 2 && col <= 4) return true;
        if (row >= 2 && row <= 4 && col >= 0 && col <= 6) return true;
        if (row >= 5 && row <= 6 && col >= 2 && col <= 4) return true;
        return false;
    }

    /**
     * Handler de click en una celda. Selecciona o intenta mover.
     */
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

    /**
     * Selecciona la ficha en (row,col) y muestra movimientos posibles.
     */
    selectPeg(row, col) {
        // Limpiar selecciones anteriores
        this.clearHighlights();
        
        this.selectedPeg = { row, col };
        
        // Resaltar la ficha seleccionada
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) cell.classList.add('selected');
        
        // Mostrar posibles movimientos
        this.showPossibleMoves(row, col);
        
        this.updateMessage("Ficha seleccionada. Haz clic o arrastra hasta una posición válida para mover.");
    }

    /**
     * Muestra (visualmente) los movimientos posibles desde (row,col).
     * Añade la clase 'possible-move' a las celdas destino.
     */
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
                if (cell) {
                    cell.classList.add('possible-move');
                    // Para animación extra (flechas/hints) puedes manipular innerHTML o agregar elementos hijos aquí
                }
            }
        });
    }

    /**
     * Comprueba si una ficha en (fromRow,fromCol) puede moverse a (toRow,toCol)
     */
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

    /**
     * Intenta mover la ficha previamente seleccionada a (toRow,toCol)
     */
    attemptMove(toRow, toCol) {
        if (this.gameOver) return;
        if (!this.selectedPeg) return;

        const { row: fromRow, col: fromCol } = this.selectedPeg;

        if (this.canMove(fromRow, fromCol, toRow, toCol)) {
            this.makeMove(fromRow, fromCol, toRow, toCol);
        } else {
            this.updateMessage("Movimiento inválido. Selecciona otra posición.", "error");
            this.playSound('error');
        }
    }

    /**
     * Ejecuta el movimiento (actualiza board, historial y UI) y ejecuta la animación.
     */
    makeMove(fromRow, fromCol, toRow, toCol) {
        if (this.gameOver) return;

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
        this.pegCount = this.board.flat().filter(v => v === 1).length;

        setTimeout(() => {
            this.renderBoard();
            this.clearHighlights();
            this.selectedPeg = null;
            this.updateUI();
            this.checkGameStatus();
        }, 600);

        this.playSound('move');
    }

    /**
     * Añade clases para animar la ficha que salta y la ficha que desaparece.
     */
    animateMove(fromRow, fromCol, toRow, toCol, middleRow, middleCol) {
        const fromCell = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
        const middleCell = document.querySelector(`[data-row="${middleRow}"][data-col="${middleCol}"]`);
        
        if (fromCell) fromCell.classList.add('jumping');
        if (middleCell) middleCell.classList.add('disappearing');
    }

    /**
     * Quita las clases de selección / pistas de todas las celdas.
     */
    clearHighlights() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'possible-move', 'jumping', 'disappearing');
            // limpiar animaciones inline
            cell.style.animation = '';
        });
    }

    /**
     * Actualiza los contadores del UI (fichas restantes y movimientos).
     */
    updateUI() {
        document.getElementById('pegsLeft').textContent = this.pegCount;
        document.getElementById('moveCount').textContent = this.moveCount;
    }

    /**
     * Muestra un mensaje en el área de mensajes del juego.
     */
    updateMessage(text, type = '') {
        const messageEl = document.getElementById('gameMessage');
        if (!messageEl) return;
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
    }

    /**
     * Inicia el temporizador del juego.
     */
    startTimer() {
        // limpiar intervalos previos
        this.stopTimer();
        const timerEl = document.getElementById('timer');
        if (!timerEl) return;

        // Mostrar tiempo inicial
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            if (this.gameOver) {
                this.stopTimer();
                return;
            }
            this.remainingTime--;
            if (this.remainingTime <= 0) {
                this.remainingTime = 0;
                this.updateTimerDisplay();
                this.gameOver = true;
                this.updateMessage("Tiempo agotado. Juego finalizado.", "error");
                this.playSound('lose');
                this.stopTimer();
                return;
            }
            this.updateTimerDisplay();
        }, 1000);
    }

    /**
     * Detiene el temporizador.
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Actualiza el texto del timer en formato mm:ss.
     */
    updateTimerDisplay() {
        const timerEl = document.getElementById('timer');
        if (!timerEl) return;
        const mins = String(Math.floor(this.remainingTime / 60)).padStart(2, '0');
        const secs = String(this.remainingTime % 60).padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
    }

    /**
     * Comprueba si el juego terminó (sin movimientos) y muestra el estado.
     */
    checkGameStatus() {
        const possibleMoves = this.getAllPossibleMoves();

        if (possibleMoves.length === 0) {
            this.gameOver = true;
            if (this.pegCount === 1) {
                this.updateMessage("¡Felicidades! ¡Ganaste el juego! ¡D'oh! - Homer", "success");
                this.playSound('win');
            } else {
                this.updateMessage(`Juego terminado. Te quedaron ${this.pegCount} fichas. ¡Inténtalo de nuevo!`, "error");
                this.playSound('lose');
            }
            this.stopTimer();
        } else {
            this.updateMessage(`¡Excelente movimiento! ${possibleMoves.length} movimientos posibles restantes.`);
        }
    }

    /**
     * Recorre todo el tablero buscando movimientos válidos y los devuelve.
     */
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

    /**
     * Reinicia el juego a la configuración inicial.
     */
    reset() {
        this.moveHistory = [];
        this.moveCount = 0;
        this.pegCount = 32;
        this.selectedPeg = null;
        this.gameOver = false;
        this.remainingTime = this.timeLimit;
        this.initializeBoard();
        this.renderBoard();
        this.updateUI();
        this.updateMessage("¡Juego reiniciado! Haz clic en una ficha para comenzar.");
        this.playSound('reset');
        this.startTimer();
    }

    /**
     * Deshace el último movimiento (si existe) restaurando el tablero desde el historial.
     */
    undo() {
        if (this.gameOver) return;
        if (this.moveHistory.length > 0) {
            this.board = this.moveHistory.pop();
            this.moveCount = Math.max(0, this.moveCount - 1);
            // Recalcular cantidad de fichas tras restaurar el tablero
            this.pegCount = this.board.flat().filter(v => v === 1).length;
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

    /**
     * Muestra una pista animada (elige un movimiento al azar y lo resalta).
     */
    showHint() {
        if (this.gameOver) return;
        const moves = this.getAllPossibleMoves();
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            const [fromRow, fromCol] = randomMove.from;
            const [toRow, toCol] = randomMove.to;

            this.clearHighlights();

            const fromCell = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
            const toCell = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);

            if (fromCell) fromCell.classList.add('selected');
            if (toCell) toCell.classList.add('possible-move');

            // Mensaje con coordenadas + reproducir "sonido" de pista
            this.updateMessage(`Pista: mueve desde (${fromRow + 1}, ${fromCol + 1}) a (${toRow + 1}, ${toCol + 1})`);
            this.playSound('hint');

            // Quitar hints luego de unos segundos
            setTimeout(() => {
                this.clearHighlights();
            }, 3500);
        } else {
            this.updateMessage("No hay movimientos disponibles.", "error");
        }
    }

    /**
     * Reproduce un "sonido" (aquí simulado con console.log; reemplazar por audio real si se desea).
     */
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

    /**
     * Conecta botones y atajos de teclado a las funciones del juego.
     */
    bindEvents() {
        const resetBtn = document.getElementById('resetBtn');
        const undoBtn = document.getElementById('undoBtn');
        const hintBtn = document.getElementById('hintBtn');

        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
        if (hintBtn) hintBtn.addEventListener('click', () => this.showHint());

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

    /**
     * Maneja el inicio del drag desde una ficha.
     * Guarda la coordenada de origen en dataTransfer y selecciona la ficha.
     */
    handleDragStart(e, fromRow, fromCol) {
        // Guardar origen en el dataTransfer para usar en drop
        e.dataTransfer.setData('text/plain', JSON.stringify({ fromRow, fromCol }));
        // Visual: marcar como seleccionada
        this.selectPeg(fromRow, fromCol);
    }

    /**
     * Maneja el fin del drag (limpia efectos visuales temporales).
     */
    handleDragEnd() {
        // Opcional: limpiar animaciones temporales
        // No deseleccionamos inmediatamente para permitir drop por click
        // this.clearHighlights();
    }

    /**
     * Maneja el drop en una celda destino (toRow,toCol).
     * Lee la coordenada de origen desde dataTransfer y llama a attemptMove.
     */
    handleDrop(e, toRow, toCol) {
        e.preventDefault();
        let data;
        try {
            data = JSON.parse(e.dataTransfer.getData('text/plain'));
        } catch (err) {
            data = null;
        }

        if (data && typeof data.fromRow === 'number') {
            // Asegurar que selectedPeg esté sincronizado con el origen
            this.selectedPeg = { row: data.fromRow, col: data.fromCol };
            this.attemptMove(toRow, toCol);
        } else if (this.selectedPeg) {
            // Fallback: si no vino datos, usar selectedPeg
            this.attemptMove(toRow, toCol);
        } else {
            this.updateMessage("No se pudo determinar la ficha a mover.", "error");
            this.playSound('error');
        }
    }
}

// Inicializar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const game = new PegSolitaireGame();
    
    // Hacer la instancia global para debugging
    window.pegSolitaire = game;
});
