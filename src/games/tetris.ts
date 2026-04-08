import { term, Game, drawGameBorder } from '../core/engine';

const SHAPES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]], // L
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]]  // Z
];

const COLORS = ['cyan', 'yellow', 'magenta', 'blue', 'white', 'green', 'red'];

export class Tetris implements Game {
    name = "Tetris";
    private onExit!: () => void;
    private gameInterval: any;
    
    private blocksW = 10;
    private playHeight = 20;
    private playWidth = 20; // blocksW * 2
    private termW = 80;
    private termH = 24;
    
    private grid: (number | null)[][] = [];
    private currentPiece: { shape: number[][], x: number, y: number, color: string } | null = null;
    private score = 0;
    private state: 'PLAYING' | 'GAMEOVER' = 'PLAYING';

    start(onExit: () => void) {
        this.onExit = onExit;
        this.termW = term.width;
        this.termH = term.height;
        term.on('key', this.handleKey);
        term.on('terminal', this.handleResize);
        this.resetGame();
    }

    private stop() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        term.off('key', this.handleKey);
        term.off('terminal', this.handleResize);
        this.onExit();
    }

    private handleResize = (name: string) => {
        if (name === 'resize') {
            this.termW = term.width;
            this.termH = term.height;
            if (this.state === 'GAMEOVER') this.render();
        }
    }

    private handleKey = (name: string) => {
        if (name === 'ESCAPE' || name === 'q') {
            this.stop();
        } else if (this.state === 'GAMEOVER' && name === ' ') {
            this.resetGame();
        } else if (this.state === 'PLAYING') {
            if (name === 'LEFT') this.move(-1, 0);
            if (name === 'RIGHT') this.move(1, 0);
            if (name === 'DOWN') this.move(0, 1);
            if (name === 'UP' || name === ' ') this.rotate();
            this.render();
        }
    }

    private resetGame() {
        this.termW = term.width;
        this.termH = term.height;
        this.grid = Array(this.playHeight).fill(null).map(() => Array(this.blocksW).fill(null));
        this.score = 0;
        this.state = 'PLAYING';
        this.spawnPiece();
        
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), 400);
    }

    private spawnPiece() {
        const type = Math.floor(Math.random() * SHAPES.length);
        this.currentPiece = {
            shape: SHAPES[type],
            x: Math.floor(this.blocksW / 2) - Math.floor(SHAPES[type][0].length / 2),
            y: 0,
            color: COLORS[type]
        };
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.state = 'GAMEOVER';
            this.render();
        }
    }

    private rotate() {
        if (!this.currentPiece) return;
        const newShape = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece!.shape.map(row => row[i]).reverse()
        );
        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, newShape)) {
            this.currentPiece.shape = newShape;
        }
    }

    private move(dx: number, dy: number) {
        if (!this.currentPiece) return false;
        if (!this.checkCollision(this.currentPiece.x + dx, this.currentPiece.y + dy, this.currentPiece.shape)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            return true;
        }
        return false;
    }

    private checkCollision(x: number, y: number, shape: number[][]) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const nx = x + col;
                    const ny = y + row;
                    if (nx < 0 || nx >= this.blocksW || ny >= this.playHeight || (ny >= 0 && this.grid[ny][nx] !== null)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private freeze() {
        if (!this.currentPiece) return;
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const ny = this.currentPiece.y + row;
                    const nx = this.currentPiece.x + col;
                    if (ny >= 0) {
                        this.grid[ny][nx] = COLORS.indexOf(this.currentPiece.color);
                    }
                }
            }
        }
        this.clearLines();
        this.spawnPiece();
    }

    private clearLines() {
        let linesCleared = 0;
        for (let y = this.playHeight - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== null)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(this.blocksW).fill(null));
                linesCleared++;
                y++; 
            }
        }
        if (linesCleared > 0) {
            this.score += linesCleared * 100;
        }
    }

    private render() {
        const tk = require('terminal-kit');
        const buffer = new tk.ScreenBuffer({ width: this.termW, height: this.termH, dst: term });
        buffer.fill({ attr: { bgColor: 'black' } });

        const offsetX = Math.max(0, Math.floor((this.termW - this.playWidth) / 2));
        const offsetY = Math.max(0, Math.floor((this.termH - this.playHeight) / 2));

        drawGameBorder(buffer, offsetX, offsetY, this.playWidth, this.playHeight, 'yellow');

        // Draw grid inside border
        for (let y = 0; y < this.playHeight; y++) {
            for (let x = 0; x < this.blocksW; x++) {
                if (this.grid[y][x] !== null) {
                    buffer.put({ x: offsetX + x * 2, y: offsetY + y, attr: { bgColor: COLORS[this.grid[y][x] as number] } }, '  ');
                } else {
                    buffer.put({ x: offsetX + x * 2, y: offsetY + y, attr: { bgColor: 'black' } }, '  ');
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        buffer.put({ x: offsetX + (this.currentPiece.x + col) * 2, y: offsetY + this.currentPiece.y + row, attr: { bgColor: this.currentPiece.color } }, '  ');
                    }
                }
            }
        }

        // Draw score outside border
        buffer.put({ x: offsetX + this.playWidth + 4, y: offsetY + 2, attr: { color: 'white', bold: true } }, `Score: ${this.score}`);

        if (this.state === 'GAMEOVER') {
            const msg = " GAMEOVER! SPACE=Restart, ESC=Exit ";
            buffer.put({ x: offsetX + Math.floor(this.playWidth/2 - msg.length/2), y: offsetY + Math.floor(this.playHeight/2), attr: { color: 'white', bgColor: 'red', bold: true } }, msg);
        }

        buffer.draw({ delta: true });
    }

    private gameLoop() {
        if (this.state !== 'PLAYING') return;

        if (!this.move(0, 1)) {
            this.freeze();
        }
        
        this.render();
    }
}
