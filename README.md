# Terminal Arcade

A collection of classic terminal-based (TUI) games written in TypeScript. Includes Flappy Bird, Snake, Pong, and Tetris! Playable directly in your terminal.

## Features

- **Four Classic Games:** Enjoy Flappy Bird, Snake, Pong, and Tetris.
- **High Performance:** Uses `terminal-kit` for fluid, flicker-free rendering and true colors.
- **Terminal Resize Support:** The game dynamically adjusts to fit your terminal window size.
- **Interactive Menu:** Easy-to-use menu to select games and navigate.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (which includes npm) installed on your system.

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/OBress/TUI-Flappy-Bird.git
   cd TUI-Flappy-Bird
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build and link the package globally:
   ```bash
   npm run build
   npm link
   ```

## How to Play

Once installed and linked, you can launch the game library from any terminal window by running:

```bash
games
```

### General Controls

- **Up/Down Arrows:** Navigate menus or move paddles.
- **Left/Right Arrows:** Move Snake/Tetris pieces.
- **Space:** Flap (Flappy Bird) or Drop/Rotate (Tetris).
- **Enter:** Select menu options.
- **Ctrl + C:** Quit the game entirely.

## License

ISC
