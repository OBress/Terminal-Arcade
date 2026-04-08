import { term, Game, drawGameBorder } from '../core/engine';

export class Pong implements Game {
    name = "Pong";
    private onExit!: () => void;
    private gameInterval: any;
    
    private playWidth = 80;
    private playHeight = 24;
    private termW = 80;
    private termH = 24;
    private playerY = 10;
    private aiY = 10;
    private ball = {x: 40, y: 12, vx: 1.5, vy: 0.5};
    private score = {player: 0, ai: 0};
    private state: 'PLAYING' | 'GAMEOVER' = 'PLAYING';

    start(onExit: () => void) {
        this.onExit = onExit;
        this.termW = term.width;
        this.termH = term.height;
        term.on('key', this.handleKey);
        term.on('terminal', this.handleResize);
        this.score = {player: 0, ai: 0};
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
        } else if (name === 'UP' || name === 'w') {
            this.playerY = Math.max(0, this.playerY - 2);
        } else if (name === 'DOWN' || name === 's') {
            this.playerY = Math.min(this.playHeight - 4, this.playerY + 2);
        } else if (name === ' ' && this.state === 'GAMEOVER') {
            this.score = {player: 0, ai: 0};
            this.resetGame();
        }
    }

    private resetGame() {
        this.termW = term.width;
        this.termH = term.height;
        this.playerY = this.playHeight / 2 - 2;
        this.aiY = this.playHeight / 2 - 2;
        this.ball = {
            x: this.playWidth / 2, 
            y: this.playHeight / 2, 
            vx: (Math.random() > 0.5 ? 2 : -2), 
            vy: (Math.random() * 2 - 1)
        };
        this.state = 'PLAYING';
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), 40);
    }

    private render() {
        const tk = require('terminal-kit');
        const buffer = new tk.ScreenBuffer({ width: this.termW, height: this.termH, dst: term });
        buffer.fill({ attr: { bgColor: 'black' } });

        const offsetX = Math.max(0, Math.floor((this.termW - this.playWidth) / 2));
        const offsetY = Math.max(0, Math.floor((this.termH - this.playHeight) / 2));

        drawGameBorder(buffer, offsetX, offsetY, this.playWidth, this.playHeight, 'magenta');

        // Center line
        for (let y = 0; y < this.playHeight; y+=2) {
            buffer.put({ x: offsetX + Math.floor(this.playWidth/2), y: offsetY + y, attr: { bgColor: 'darkGray' } }, ' ');
        }

        // Player (Left)
        for (let i=0; i<4; i++) {
            buffer.put({ x: offsetX + 2, y: offsetY + Math.floor(this.playerY) + i, attr: { bgColor: 'brightCyan' } }, '  ');
        }

        // AI (Right)
        for (let i=0; i<4; i++) {
            buffer.put({ x: offsetX + this.playWidth - 4, y: offsetY + Math.floor(this.aiY) + i, attr: { bgColor: 'brightRed' } }, '  ');
        }

        // Ball
        buffer.put({ x: offsetX + Math.floor(this.ball.x), y: offsetY + Math.floor(this.ball.y), attr: { bgColor: 'brightYellow' } }, '  ');

        // Scores
        buffer.put({ x: offsetX + Math.floor(this.playWidth/4), y: offsetY + 2, attr: { color: 'brightCyan', bold: true } }, `${this.score.player}`);
        buffer.put({ x: offsetX + Math.floor(this.playWidth*0.75), y: offsetY + 2, attr: { color: 'brightRed', bold: true } }, `${this.score.ai}`);

        if (this.state === 'GAMEOVER') {
            const msg = " Press SPACE to Play Again, ESC to Exit ";
            buffer.put({ x: offsetX + Math.floor(this.playWidth/2 - msg.length/2), y: offsetY + Math.floor(this.playHeight/2), attr: { color: 'white', bgColor: 'red', bold: true } }, msg);
        }

        buffer.draw({ delta: true });
    }

    private gameLoop() {
        if (this.state !== 'PLAYING') return;

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // AI movement
        if (this.aiY + 2 < this.ball.y) this.aiY += 0.8;
        if (this.aiY + 2 > this.ball.y) this.aiY -= 0.8;
        this.aiY = Math.max(0, Math.min(this.playHeight - 4, this.aiY));

        // Wall collisions
        if (this.ball.y <= 0 || this.ball.y >= this.playHeight - 1) {
            this.ball.vy *= -1;
            this.ball.y = Math.max(1, Math.min(this.playHeight - 2, this.ball.y));
        }

        // Paddle collisions
        if (this.ball.x <= 4 && this.ball.y >= this.playerY && this.ball.y <= this.playerY + 4) {
            this.ball.vx = Math.abs(this.ball.vx) + 0.1; 
            this.ball.vy = (this.ball.y - (this.playerY + 2)) * 0.5;
            this.ball.x = 5;
        }

        if (this.ball.x >= this.playWidth - 6 && this.ball.y >= this.aiY && this.ball.y <= this.aiY + 4) {
            this.ball.vx = -Math.abs(this.ball.vx) - 0.1;
            this.ball.vy = (this.ball.y - (this.aiY + 2)) * 0.5;
            this.ball.x = this.playWidth - 7;
        }

        // Score
        if (this.ball.x < 0) {
            this.score.ai++;
            if (this.score.ai >= 5) this.state = 'GAMEOVER';
            else this.resetGame();
            return;
        }
        if (this.ball.x > this.playWidth) {
            this.score.player++;
            if (this.score.player >= 5) this.state = 'GAMEOVER';
            else this.resetGame();
            return;
        }

        this.render();
    }
}
