#!/usr/bin/env node

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let width = process.stdout.columns || 80;
let height = process.stdout.rows || 24;

const FPS = 30;
const GRAVITY = 0.3;
const FLAP_STRENGTH = -2.2;
const PIPE_SPEED = 2;
const PIPE_SPAWN_RATE = 45;
const PIPE_WIDTH = 8;
const GAP_SIZE = 8;

let birdY = height / 2;
let birdVelocity = 0;
let score = 0;
let frames = 0;
let pipes: { x: number; gapY: number; passed: boolean }[] = [];
let gameInterval: NodeJS.Timeout | null = null;
let state: 'MENU' | 'PLAYING' | 'GAME_OVER' | 'LEADERBOARD' = 'MENU';
let menuSelection = 0;

const SCORES_FILE = path.join(os.homedir(), '.flappybird-scores.json');

interface ScoreEntry {
    date: string;
    score: number;
}

function getScores(): ScoreEntry[] {
    if (fs.existsSync(SCORES_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8'));
        } catch {
            return [];
        }
    }
    return [];
}

function saveScore(score: number) {
    if (score === 0) return;
    const scores = getScores();
    scores.push({ date: new Date().toISOString().split('T')[0], score });
    scores.sort((a, b) => b.score - a.score);
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores.slice(0, 10), null, 2));
}

// Setup terminal
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}
process.stdout.write('\x1B[?25l'); // Hide cursor

function clearScreen() {
    process.stdout.write('\x1B[2J\x1B[0;0H');
}
clearScreen();

process.stdout.on('resize', () => {
    width = process.stdout.columns || 80;
    height = process.stdout.rows || 24;
    if (state !== 'PLAYING') {
        render();
    }
});

process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        cleanup();
        process.exit();
    }

    if (state === 'MENU') {
        if (key.name === 'up' || key.name === 'w') {
            menuSelection = Math.max(0, menuSelection - 1);
            render();
        } else if (key.name === 'down' || key.name === 's') {
            menuSelection = Math.min(2, menuSelection + 1);
            render();
        } else if (key.name === 'return' || key.name === 'space') {
            if (menuSelection === 0) {
                startGame();
            } else if (menuSelection === 1) {
                state = 'LEADERBOARD';
                render();
            } else if (menuSelection === 2) {
                cleanup();
                process.exit();
            }
        }
    } else if (state === 'LEADERBOARD') {
        if (key.name === 'return' || key.name === 'space' || key.name === 'escape') {
            state = 'MENU';
            render();
        }
    } else if (state === 'GAME_OVER') {
        if (key.name === 'space' || key.name === 'return') {
            state = 'MENU';
            render();
        }
    } else if (state === 'PLAYING') {
        if (key.name === 'space' || key.name === 'up' || key.name === 'w') {
            birdVelocity = FLAP_STRENGTH;
        }
    }
});

function startGame() {
    state = 'PLAYING';
    birdY = height / 2;
    birdVelocity = 0;
    score = 0;
    frames = 0;
    pipes = [];
    clearScreen();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 1000 / FPS);
}

function cleanup() {
    process.stdout.write('\x1B[?25h'); // Show cursor
    clearScreen();
    if (gameInterval) clearInterval(gameInterval);
}

// Colors
const cReset = '\x1b[0m';
const cBird = '\x1b[33;1m'; // Bright Yellow
const cPipe = '\x1b[32m'; // Green
const cGround = '\x1b[32;1m'; // Bright Green
const cSky = '\x1b[36;1m'; // Bright Cyan
const cText = '\x1b[37;1m'; // Bright White
const cAlert = '\x1b[31;1m'; // Bright Red

function render() {
    let out = '\x1B[0;0H'; // Move to top left
    
    if (state === 'MENU') {
        const title = "   FLAPPY BIRD TUI   ";
        const options = [" Play Game ", " Leaderboard ", " Quit "];
        
        for (let y = 0; y < height; y++) {
            if (y === Math.floor(height / 2) - 4) {
                out += ' '.repeat(Math.max(0, Math.floor((width - title.length) / 2))) + cBird + title + cReset + '\x1B[K\n';
            } else if (y >= Math.floor(height / 2) - 1 && y <= Math.floor(height / 2) + 1) {
                const optIdx = y - (Math.floor(height / 2) - 1);
                const prefix = menuSelection === optIdx ? '> ' : '  ';
                const text = prefix + options[optIdx];
                const padding = Math.max(0, Math.floor((width - text.length) / 2));
                out += ' '.repeat(padding) + (menuSelection === optIdx ? cText : cReset) + text + cReset + '\x1B[K\n';
            } else {
                out += '\x1B[K\n'; // Clear line
            }
        }
        process.stdout.write(out);
        return;
    }

    if (state === 'LEADERBOARD') {
        const title = "   LEADERBOARD   ";
        const scores = getScores();
        
        for (let y = 0; y < height; y++) {
            if (y === Math.floor(height / 2) - 8) {
                out += ' '.repeat(Math.max(0, Math.floor((width - title.length) / 2))) + cBird + title + cReset + '\x1B[K\n';
            } else if (y >= Math.floor(height / 2) - 5 && y < Math.floor(height / 2) - 5 + 10) {
                const idx = y - (Math.floor(height / 2) - 5);
                if (idx < scores.length) {
                    const text = `${(idx + 1).toString().padStart(2)}. ${scores[idx].score.toString().padStart(4)} - ${scores[idx].date}`;
                    const padding = Math.max(0, Math.floor((width - text.length) / 2));
                    out += ' '.repeat(padding) + cText + text + cReset + '\x1B[K\n';
                } else {
                    out += '\x1B[K\n';
                }
            } else if (y === Math.floor(height / 2) + 7) {
                 const text = "Press SPACE to return";
                 const padding = Math.max(0, Math.floor((width - text.length) / 2));
                 out += ' '.repeat(padding) + cText + text + cReset + '\x1B[K\n';
            } else {
                out += '\x1B[K\n';
            }
        }
        process.stdout.write(out);
        return;
    }

    // PLAYING and GAME_OVER rendering
    const rows: string[] = [];
    const birdIntY = Math.floor(birdY);
    const birdX = Math.floor(width / 4);

    for (let y = 0; y < height; y++) {
        let rowStr = '';
        let lastColor = cReset;

        for (let x = 0; x < width; x++) {
            let char = ' ';
            let color = cReset;

            let isPipe = false;
            for (const pipe of pipes) {
                const pipeIntX = Math.floor(pipe.x);
                if (x >= pipeIntX && x < pipeIntX + PIPE_WIDTH) {
                    if (y < pipe.gapY || y > pipe.gapY + GAP_SIZE) {
                        isPipe = true;
                        break;
                    }
                }
            }

            if (y === birdIntY && x === birdX) {
                char = '>';
                color = cBird;
            } else if (y === birdIntY && x === birdX - 1) {
                char = '(';
                color = cBird;
            } else if (y === birdIntY && x === birdX + 1) {
                char = ')';
                color = cBird;
            } else if (isPipe) {
                char = '█';
                color = cPipe;
            } else if (y === height - 1) {
                char = '▀';
                color = cGround;
            }

            if (color !== lastColor) {
                rowStr += color;
                lastColor = color;
            }
            rowStr += char;
        }
        rowStr += cReset + '\x1B[K'; // Reset color and clear rest of line
        rows.push(rowStr);
    }

    out += rows.join('\n');

    // Draw Score overlay
    const scoreText = ` Score: ${score} `;
    const scoreX = Math.floor(width / 2 - scoreText.length / 2);
    out += `\x1B[2;${scoreX}H${cSky}${scoreText}${cReset}`;

    if (state === 'GAME_OVER') {
        const gameOverText = ' GAME OVER ';
        const restartText = ' Press SPACE to continue ';
        
        const goX = Math.floor(width / 2 - gameOverText.length / 2);
        const resX = Math.floor(width / 2 - restartText.length / 2);
        const midY = Math.floor(height / 2);
        
        out += `\x1B[${midY};${goX}H${cAlert}${gameOverText}${cReset}`;
        out += `\x1B[${midY + 2};${resX}H${cText}${restartText}${cReset}`;
    }

    process.stdout.write(out);
}

function gameLoop() {
    if (state !== 'PLAYING') return;

    frames++;
    birdVelocity += GRAVITY;
    birdY += birdVelocity;

    const birdX = Math.floor(width / 4);

    // Spawn pipes
    if (frames % PIPE_SPAWN_RATE === 0) {
        pipes.push({
            x: width,
            gapY: Math.floor(Math.random() * (height - GAP_SIZE - 4)) + 2, // Ensure gap is within bounds
            passed: false
        });
    }

    // Update pipes
    for (const pipe of pipes) {
        pipe.x -= PIPE_SPEED;
        
        const pipeIntX = Math.floor(pipe.x);
        const birdLeft = birdX - 1;
        const birdRight = birdX + 1;
        const pipeLeft = pipeIntX;
        const pipeRight = pipeIntX + PIPE_WIDTH - 1;

        // Check collision
        if (birdRight >= pipeLeft && birdLeft <= pipeRight) {
            if (Math.floor(birdY) < pipe.gapY || Math.floor(birdY) > pipe.gapY + GAP_SIZE) {
                gameOver();
                return;
            }
        }
        
        // Check score
        if (pipeRight < birdLeft && !pipe.passed) {
            score++;
            pipe.passed = true;
        }
    }

    // Remove off-screen pipes
    pipes = pipes.filter(p => p.x > -PIPE_WIDTH);

    // Floor/Ceiling collision
    if (birdY >= height - 1 || birdY < 0) {
        gameOver();
        return;
    }

    render();
}

function gameOver() {
    state = 'GAME_OVER';
    if (gameInterval) clearInterval(gameInterval);
    saveScore(score);
    render();
}

render();
