#!/usr/bin/env node
import { term } from './core/engine';
import { FlappyBird } from './games/flappybird';
import { Snake } from './games/snake';
import { Pong } from './games/pong';
import { Tetris } from './games/tetris';

const games = [
    new FlappyBird(),
    new Snake(),
    new Pong(),
    new Tetris()
];

let inMenu = true;

function showMenu() {
    inMenu = true;
    term.clear();
    term.bgBlack.cyan('\n========================================\n');
    term.bgBlack.yellow('          TERMINAL ARCADE               \n');
    term.bgBlack.cyan('========================================\n\n');
    term.bgBlack.white('Select a game to play (Up/Down and Enter):\n\n');

    const options = [...games.map(g => g.name), 'Quit'];

    term.singleColumnMenu(options, (error, response) => {
        if (error) {
            term.clear();
            process.exit(1);
        }
        inMenu = false;
        if (response.selectedIndex === games.length) {
            term.clear();
            process.exit(0);
        } else {
            const game = games[response.selectedIndex];
            game.start(() => {
                showMenu();
            });
        }
    });
}

term.on('key', (name: string) => {
    if (name === 'CTRL_C') {
        term.clear();
        process.exit(0);
    }
});

term.grabInput(true);
term.hideCursor(true);
showMenu();
