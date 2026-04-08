#!/usr/bin/env node

import * as readline from 'readline';

const width = 80;
const height = 24;
const FPS = 15;
const GRAVITY = 1;
const FLAP_STRENGTH = -3;
const PIPE_SPEED = 2;
const PIPE_SPAWN_RATE = 20;

let birdY = Math.floor(height / 2);
let birdVelocity = 0;
let score = 0;
let frames = 0;
let pipes: { x: number; gapY: number; passed: boolean }[] = [];
let gameInterval: NodeJS.Timeout | null = null;
let isGameOver = false;

// Setup terminal
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}
process.stdout.write('\x1B[?25l'); // Hide cursor

process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        cleanup();
        process.exit();
    }
    if (key.name === 'space') {
        if (isGameOver) {
            resetGame();
        } else {
            birdVelocity = FLAP_STRENGTH;
        }
    }
});

function resetGame() {
    birdY = Math.floor(height / 2);
    birdVelocity = 0;
    score = 0;
    frames = 0;
    pipes = [];
    isGameOver = false;
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 1000 / FPS);
}

function cleanup() {
    process.stdout.write('\x1B[?25h'); // Show cursor
    if (gameInterval) clearInterval(gameInterval);
}

function render() {
    let screen = '';
    for (let y = 0; y < height; y++) {
        let row = '';
        for (let x = 0; x < width; x++) {
            let isPipe = false;
            for (const pipe of pipes) {
                if (x >= pipe.x && x < pipe.x + 6) {
                    if (y < pipe.gapY || y > pipe.gapY + 6) {
                        isPipe = true;
                        break;
                    }
                }
            }

            if (y === Math.floor(birdY) && x === 10) {
                row += 'O'; // Bird
            } else if (isPipe) {
                row += 'X'; // Pipe
            } else if (y === height - 1) {
                row += '='; // Ground
            } else {
                row += ' '; // Empty space
            }
        }
        screen += row + '\n';
    }

    const scoreText = ` Score: ${score} `;
    screen = screen.substring(0, Math.floor(width / 2) - Math.floor(scoreText.length / 2)) + scoreText + screen.substring(Math.floor(width / 2) + Math.ceil(scoreText.length / 2));

    if (isGameOver) {
        const gameOverText = ' GAME OVER - PRESS SPACE TO RESTART ';
        const gameOverPos = Math.floor(height / 2) * (width + 1) + Math.floor(width / 2) - Math.floor(gameOverText.length / 2);
        screen = screen.substring(0, gameOverPos) + gameOverText + screen.substring(gameOverPos + gameOverText.length);
    }

    // Move cursor to top-left and draw
    process.stdout.write('\x1B[0;0H' + screen);
}

function gameLoop() {
    if (isGameOver) return;

    frames++;
    birdVelocity += GRAVITY;
    birdY += birdVelocity;

    // Spawn pipes
    if (frames % PIPE_SPAWN_RATE === 0) {
        pipes.push({
            x: width,
            gapY: Math.floor(Math.random() * (height - 12)) + 2, // Ensure gap is within bounds
            passed: false
        });
    }

    // Update pipes
    for (const pipe of pipes) {
        pipe.x -= PIPE_SPEED;
        
        // Check collision
        if (pipe.x <= 10 && pipe.x + 6 >= 10) {
            if (Math.floor(birdY) < pipe.gapY || Math.floor(birdY) > pipe.gapY + 6) {
                isGameOver = true;
            }
        }
        
        // Check score
        if (pipe.x < 10 && !pipe.passed) {
            score++;
            pipe.passed = true;
        }
    }

    // Remove off-screen pipes
    pipes = pipes.filter(p => p.x > -10);

    // Floor/Ceiling collision
    if (birdY >= height - 1 || birdY < 0) {
        isGameOver = true;
    }

    if (isGameOver) {
        if (gameInterval) clearInterval(gameInterval);
    }

    render();
}

// Clear screen before starting
process.stdout.write('\x1B[2J');
resetGame();
