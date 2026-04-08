import * as tk from 'terminal-kit';
export const term = tk.terminal;

export interface Game {
    name: string;
    start: (onExit: () => void) => void;
}

export function drawGameBorder(buffer: any, offsetX: number, offsetY: number, width: number, height: number, color: string = 'brightBlue') {
    // Draw top and bottom
    for (let x = 0; x < width; x++) {
        buffer.put({ x: offsetX + x, y: offsetY - 1, attr: { color } }, '─');
        buffer.put({ x: offsetX + x, y: offsetY + height, attr: { color } }, '─');
    }
    // Draw sides
    for (let y = 0; y < height; y++) {
        buffer.put({ x: offsetX - 1, y: offsetY + y, attr: { color } }, '│');
        buffer.put({ x: offsetX + width, y: offsetY + y, attr: { color } }, '│');
    }
    // Corners
    buffer.put({ x: offsetX - 1, y: offsetY - 1, attr: { color } }, '╭');
    buffer.put({ x: offsetX + width, y: offsetY - 1, attr: { color } }, '╮');
    buffer.put({ x: offsetX - 1, y: offsetY + height, attr: { color } }, '╰');
    buffer.put({ x: offsetX + width, y: offsetY + height, attr: { color } }, '╯');
}
