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
let isResizing = false;
let menuInstance: any;

function drawMenuBorder() {
    term.clear();
    const width = 50;
    const height = 15;
    const x = Math.max(1, Math.floor((term.width - width) / 2));
    const y = Math.max(1, Math.floor((term.height - height) / 2));

    // Draw border
    term.moveTo(x, y);
    term.brightMagenta('╭' + '─'.repeat(width - 2) + '╮');
    for (let i = 1; i < height - 1; i++) {
        term.moveTo(x, y + i);
        term.brightMagenta('│' + ' '.repeat(width - 2) + '│');
    }
    term.moveTo(x, y + height - 1);
    term.brightMagenta('╰' + '─'.repeat(width - 2) + '╯');

    const title = ' TERMINAL ARCADE ';
    term.moveTo(x + Math.floor((width - title.length) / 2), y + 2);
    term.bold.brightYellow(title);

    const subtitle = 'Select a game to play:';
    term.moveTo(x + Math.floor((width - subtitle.length) / 2), y + 4);
    term.white(subtitle);

    return { x: x + Math.floor((width - 20) / 2), y: y + 6 }; // Return menu start pos
}

function showMenu() {
    inMenu = true;
    isResizing = false;
    term.hideCursor(true);
    
    const menuPos = drawMenuBorder();
    const options = [...games.map(g => g.name), 'Quit'];

    const menuOptions: any = {
        y: menuPos.y,
        x: menuPos.x,
        style: term.brightCyan,
        selectedStyle: term.bgBrightYellow.black,
        cancelable: true
    };

    menuInstance = term.singleColumnMenu(options, menuOptions, (error, response) => {
        if (isResizing) return; // ignore abort from resize
        
        if (error) {
            quit();
        } else if (response.canceled) {
            // Optional: User pressed escape, maybe do nothing or quit
        } else if (response.selectedIndex === games.length) {
            quit();
        } else {
            inMenu = false;
            term.clear();
            const game = games[response.selectedIndex];
            game.start(() => {
                showMenu();
            });
        }
    });
}

function quit() {
    term.clear();
    term.fullscreen(false);
    term.hideCursor(false);
    term.grabInput(false);
    process.exit(0);
}

term.on('key', (name: string) => {
    if (name === 'CTRL_C') {
        quit();
    }
});

term.on('terminal', (name: string) => {
    if (name === 'resize' && inMenu) {
        isResizing = true;
        if (menuInstance && typeof menuInstance.abort === 'function') {
            menuInstance.abort();
        }
        showMenu();
    }
});

term.fullscreen(true);
term.grabInput(true);
term.hideCursor(true);
showMenu();
