import * as tk from 'terminal-kit';
export const term = tk.terminal;

export interface Game {
    name: string;
    start: (onExit: () => void) => void;
}
