import { term, Game } from '../core/engine';

export class Snake implements Game {
    name = "Snake";
    private onExit!: () => void;
    private gameInterval: any;
    
    private width = 80;
    private height = 24;
    private snake: {x: number, y: number}[] = [];
    private food = {x: 0, y: 0};
    private dir = {x: 2, y: 0};
    private nextDir = {x: 2, y: 0};
    private state: 'PLAYING' | 'GAMEOVER' = 'PLAYING';
    private score = 0;

    start(onExit: () => void) {
        this.onExit = onExit;
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
            this.width = term.width;
            this.height = term.height;
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
            x: Math.floor(Math.random() * (this.width / 2)) * 2,
            y: Math.floor(Math.random() * this.height)
        };
    }

    private resetGame() {
        this.width = term.width;
        this.height = term.height;
        this.snake = [
            {x: Math.floor(this.width/4)*2, y: Math.floor(this.height/2)},
            {x: Math.floor(this.width/4)*2 - 2, y: Math.floor(this.height/2)},
            {x: Math.floor(this.width/4)*2 - 4, y: Math.floor(this.height/2)},
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
        const buffer = new tk.ScreenBuffer({ width: this.width, height: this.height, dst: term });
        buffer.fill({ attr: { bgColor: 'black' } });

        // Draw Food
        buffer.put({ x: this.food.x, y: this.food.y, attr: { bgColor: 'red' } }, '  ');

        // Draw Snake
        for (const segment of this.snake) {
            buffer.put({ x: segment.x, y: segment.y, attr: { bgColor: 'green' } }, '  ');
        }

        buffer.put({ x: 2, y: 1, attr: { color: 'white', bold: true } }, `Score: ${this.score}`);

        if (this.state === 'GAMEOVER') {
            const msg = " GAME OVER - Press SPACE to Restart, ESC to Exit ";
            buffer.put({ x: Math.floor(this.width/2 - msg.length/2), y: Math.floor(this.height/2), attr: { color: 'white', bgColor: 'red', bold: true } }, msg);
        }

        buffer.draw({ delta: true });
    }

    private gameLoop() {
        if (this.state !== 'PLAYING') return;

        this.dir = this.nextDir;
        const head = this.snake[0];
        const next = { x: head.x + this.dir.x, y: head.y + this.dir.y };

        if (next.x < 0 || next.x >= this.width || next.y < 0 || next.y >= this.height) {
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
