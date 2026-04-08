import { term, Game, drawGameBorder } from '../core/engine';

export class Snake implements Game {
    name = "Snake";
    private onExit!: () => void;
    private gameInterval: any;
    
    private playWidth = 80;
    private playHeight = 24;
    private termW = 80;
    private termH = 24;
    private snake: {x: number, y: number}[] = [];
    private food = {x: 0, y: 0};
    private dir = {x: 2, y: 0};
    private nextDir = {x: 2, y: 0};
    private state: 'PLAYING' | 'GAMEOVER' = 'PLAYING';
    private score = 0;

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
            if (name === 'UP' && this.dir.y !== 1) this.nextDir = {x: 0, y: -1};
            if (name === 'DOWN' && this.dir.y !== -1) this.nextDir = {x: 0, y: 1};
            if (name === 'LEFT' && this.dir.x !== 2) this.nextDir = {x: -2, y: 0};
            if (name === 'RIGHT' && this.dir.x !== -2) this.nextDir = {x: 2, y: 0};
        }
    }

    private spawnFood() {
        this.food = {
            x: Math.floor(Math.random() * (this.playWidth / 2)) * 2,
            y: Math.floor(Math.random() * this.playHeight)
        };
    }

    private resetGame() {
        this.termW = term.width;
        this.termH = term.height;
        this.snake = [
            {x: Math.floor(this.playWidth/4)*2, y: Math.floor(this.playHeight/2)},
            {x: Math.floor(this.playWidth/4)*2 - 2, y: Math.floor(this.playHeight/2)},
            {x: Math.floor(this.playWidth/4)*2 - 4, y: Math.floor(this.playHeight/2)},
        ];
        this.dir = {x: 2, y: 0};
        this.nextDir = {x: 2, y: 0};
        this.score = 0;
        this.state = 'PLAYING';
        this.spawnFood();
        
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), 80);
    }

    private render() {
        const tk = require('terminal-kit');
        const buffer = new tk.ScreenBuffer({ width: this.termW, height: this.termH, dst: term });
        buffer.fill({ attr: { bgColor: 'black' } });

        const offsetX = Math.max(0, Math.floor((this.termW - this.playWidth) / 2));
        const offsetY = Math.max(0, Math.floor((this.termH - this.playHeight) / 2));

        drawGameBorder(buffer, offsetX, offsetY, this.playWidth, this.playHeight, 'green');

        // Play area background
        for (let y = 0; y < this.playHeight; y++) {
            for (let x = 0; x < this.playWidth; x++) {
                buffer.put({ x: offsetX + x, y: offsetY + y, attr: { bgColor: 'black' } }, ' ');
            }
        }

        // Draw Food
        buffer.put({ x: offsetX + this.food.x, y: offsetY + this.food.y, attr: { color: 'brightRed' } }, '██');

        // Draw Snake
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            const color = i === 0 ? 'brightGreen' : 'green';
            buffer.put({ x: offsetX + segment.x, y: offsetY + segment.y, attr: { color } }, '██');
        }

        buffer.put({ x: offsetX + 2, y: offsetY + 1, attr: { color: 'white', bold: true } }, `Score: ${this.score}`);

        if (this.state === 'GAMEOVER') {
            const msg = " GAME OVER - Press SPACE to Restart, ESC to Exit ";
            buffer.put({ x: offsetX + Math.floor(this.playWidth/2 - msg.length/2), y: offsetY + Math.floor(this.playHeight/2), attr: { color: 'white', bgColor: 'red', bold: true } }, msg);
        }

        buffer.draw({ delta: true });
    }

    private gameLoop() {
        if (this.state !== 'PLAYING') return;

        this.dir = this.nextDir;
        const head = this.snake[0];
        const next = { x: head.x + this.dir.x, y: head.y + this.dir.y };

        if (next.x < 0 || next.x >= this.playWidth || next.y < 0 || next.y >= this.playHeight) {
            this.state = 'GAMEOVER';
        }

        for (const seg of this.snake) {
            if (seg.x === next.x && seg.y === next.y) {
                this.state = 'GAMEOVER';
            }
        }

        if (this.state === 'GAMEOVER') {
            this.render();
            return;
        }

        this.snake.unshift(next);

        if (next.x === this.food.x && next.y === this.food.y) {
            this.score++;
            this.spawnFood();
        } else {
            this.snake.pop();
        }

        this.render();
    }
}
