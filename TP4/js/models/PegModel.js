export default class PegModel {
    constructor(rows = 7, cols = 7) {
        this.rows = rows;
        this.cols = cols;
        this.board = [];
        this.moveHistory = [];
        this.moveCount = 0;
        this.moveUp = 0;
        this.pegCount = 0;
        this.initializeBoard();
    }

    initializeBoard() {
        const pattern = [
            [0,0,1,1,1,0,0],
            [0,0,1,1,1,0,0],
            [1,1,1,1,1,1,1],
            [1,1,1,0,1,1,1],
            [1,1,1,1,1,1,1],
            [0,0,1,1,1,0,0],
            [0,0,1,1,1,0,0]
        ];
        this.board = pattern.map(r => r.slice());
        this.moveHistory = [];
        this.moveCount = 0;
        this.pegCount = this.board.flat().filter(v=>v===1).length;
    }

    isValidPosition(r,c){
        if (r >= 0 && r <= 1 && c >= 2 && c <= 4) return true;
        if (r >= 2 && r <= 4 && c >= 0 && c <= 6) return true;
        if (r >= 5 && r <= 6 && c >= 2 && c <= 4) return true;
        return false;
    }

    canMove(fromRow,fromCol,toRow,toCol){
        if (!this.isValidPosition(toRow,toCol)) return false;
        if (this.board[toRow][toCol] !== 0) return false;
        const midR = (fromRow + toRow)/2;
        const midC = (fromCol + toCol)/2;
        if (!Number.isInteger(midR) || !Number.isInteger(midC)) return false;
        if (this.board[midR][midC] !== 1) return false;
        return true;
    }

    makeMove(fromRow,fromCol,toRow,toCol){
        this.moveHistory.push(this.board.map(r=>r.slice()));
        const midR = (fromRow + toRow)/2;
        const midC = (fromCol + toCol)/2;
        this.board[fromRow][fromCol] = 0;
        this.board[midR][midC] = 0;
        this.board[toRow][toCol] = 1;
        this.moveCount++;
        if(toRow < fromRow){
            this.moveUp++;
        }
        this.pegCount = this.board.flat().filter(v=>v===1).length;
    }

    undo(){
        if (this.moveHistory.length === 0) return false;
        this.board = this.moveHistory.pop();
        this.moveCount = Math.max(0,this.moveCount-1);
        this.pegCount = this.board.flat().filter(v=>v===1).length;
        return true;
    }

    getAllPossibleMoves(){
        const moves = [];
        for (let r=0;r<this.rows;r++){
            for (let c=0;c<this.cols;c++){
                if (this.board[r][c]===1){
                    const dirs = [[-2,0],[2,0],[0,-2],[0,2]];
                    dirs.forEach(([dr,dc])=>{
                        const nr = r+dr, nc = c+dc;
                        if (this.canMove(r,c,nr,nc)) moves.push({from:[r,c],to:[nr,nc]});
                    });
                }
            }
        }
        return moves;
    }
}
