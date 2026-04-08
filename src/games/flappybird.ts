import { term, Game, drawGameBorder } from '../core/engine';

export class FlappyBird implements Game {
    name = "Flappy Bird";
    private onExit!: () => void;
    private gameInterval: any;
    
    private playWidth = 80;
    private playHeight = 24;
    private termW = 80;
    private termH = 24;
    private FPS = 30;
    private birdY = 12;
    private birdVelocity = 0;
    private gravity = 0.3;
    private flapStrength = -1.5;
    private pipes: { x: number, gapY: number, passed: boolean }[] = [];
    private score = 0;
    private frames = 0;
    private state: 'PLAYING' | 'GAMEOVER' = 'PLAYING';

    start(onExit: () => void) {
        this.onExit = onExit;
        this.termW = term.width;
        this.termH = term.height;
        term.on('key', this.handleKey);
        term.on('terminal', this.handleResize);
        this.resetGame();
    }

    private handleResize = (name: string) => {
        if (name === 'resize') {
            this.termW = term.width;
            this.termH = term.height;
            if (this.state === 'GAMEOVER') this.render();
        }
    }

    private stop() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        term.off('key', this.handleKey);
        term.off('terminal', this.handleResize);
        this.onExit();
    }

    private handleKey = (name: string) => {
        if (name === 'ESCAPE' || name === 'q') {
            this.stop();
        } else if (name === ' ' || name === 'UP') {
            if (this.state === 'PLAYING') {
                this.birdVelocity = this.flapStrength;
            } else if (this.state === 'GAMEOVER') {
                this.resetGame();
            }
        }
    }

    private resetGame() {
        this.termW = term.width;
        this.termH = term.height;
        this.birdY = this.playHeight / 2;
        this.birdVelocity = 0;
        this.score = 0;
        this.frames = 0;
        this.pipes = [];
        this.state = 'PLAYING';
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.gameLoop(), 1000 / this.FPS);
    }

    private render() {
        const tk = require('terminal-kit');
        const buffer = new tk.ScreenBuffer({ width: this.termW, height: this.termH, dst: term });
        
        buffer.fill({ attr: { bgColor: 'black' } });

        const offsetX = Math.max(0, Math.floor((this.termW - this.playWidth) / 2));
        const offsetY = Math.max(0, Math.floor((this.termH - this.playHeight) / 2));

        drawGameBorder(buffer, offsetX, offsetY, this.playWidth, this.playHeight, 'cyan');

        // Fill sky
        for (let y = 0; y < this.playHeight - 1; y++) {
            for (let x = 0; x < this.playWidth; x++) {
                buffer.put({ x: offsetX + x, y: offsetY + y, attr: { bgColor: 'blue' } }, ' ');
            }
        }

        // Draw pipes
        for (const pipe of this.pipes) {
            const px = Math.floor(pipe.x);
            for (let x = px; x < px + 8; x++) {
                if (x >= 0 && x < this.playWidth) {
                    for (let y = 0; y < this.playHeight - 1; y++) {
                        if (y < pipe.gapY || y >= pipe.gapY + 8) {
                            buffer.put({ x: offsetX + x, y: offsetY + y, attr: { bgColor: 'green', color: 'darkGreen' } }, '█');
                        }
                    }
                }
            }
        }

        // Draw ground
        for (let x = 0; x < this.playWidth; x++) {
            buffer.put({ x: offsetX + x, y: offsetY + this.playHeight - 1, attr: { bgColor: 'yellow', color: 'green' } }, '▀');
        }

        // Draw Bird
        const bx = Math.floor(this.playWidth / 4);
        const by = Math.floor(this.birdY);
        if (by >= 0 && by < this.playHeight - 1) {
            buffer.put({ x: offsetX + bx, y: offsetY + by, attr: { color: 'brightYellow', bgColor: 'blue', bold: true } }, 'Ö');
        }

        // Score
        buffer.put({ x: offsetX + Math.floor(this.playWidth/2 - 5), y: offsetY + 2, attr: { color: 'white', bgColor: 'blue', bold: true } }, `SCORE: ${this.score}`);

        if (this.state === 'GAMEOVER') {
            const goMsg = " GAME OVER ";
            const resMsg = " Press SPACE to restart, ESC to exit ";
            buffer.put({ x: offsetX + Math.floor(this.playWidth/2 - goMsg.length/2), y: offsetY + Math.floor(this.playHeight/2), attr: { color: 'white', bgColor: 'red', bold: true } }, goMsg);
            buffer.put({ x: offsetX + Math.floor(this.playWidth/2 - resMsg.length/2), y: offsetY + Math.floor(this.playHeight/2)+2, attr: { color: 'white', bgColor: 'blue' } }, resMsg);
        }

        buffer.draw({ delta: true });
    }

    private gameLoop() {
        if (this.state !== 'PLAYING') return;

        this.frames++;
        this.birdVelocity += this.gravity;
        this.birdY += this.birdVelocity;

        const bx = Math.floor(this.playWidth / 4);

        if (this.frames % 50 === 0) {
            this.pipes.push({
                x: this.playWidth,
                gapY: Math.floor(Math.random() * (this.playHeight - 12)) + 2,
                passed: false
            });
        }

        for (const pipe of this.pipes) {
            pipe.x -= 1.5;
            const px = Math.floor(pipe.x);
            
            // collision
            if (bx >= px && bx < px + 8) {
                if (Math.floor(this.birdY) < pipe.gapY || Math.floor(this.birdY) >= pipe.gapY + 8) {
                    this.state = 'GAMEOVER';
                }
            }

            if (px + 8 < bx && !pipe.passed) {
                this.score++;
                pipe.passed = true;
            }
        }

        this.pipes = this.pipes.filter(p => p.x > -10);

        if (this.birdY < 0 || this.birdY >= this.playHeight - 1) {
            this.state = 'GAMEOVER';
        }

        this.render();
    }
}
