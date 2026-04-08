# TUI Flappy Bird

A terminal-based (TUI) clone of the classic Flappy Bird game, written in TypeScript and playable directly in your terminal.

## Features

- **Fluid Physics:** Smooth 30 FPS gameplay with fine-tuned gravity and flap mechanics.
- **Terminal Resize Support:** The game dynamically adjusts to fit your terminal window size.
- **Persistent Leaderboard:** Saves your top 10 highest scores locally.
- **Colorful Graphics:** Uses ANSI escape codes for a vibrant terminal experience.
- **Interactive Menu:** Easy-to-use menu to start the game, view scores, or quit.

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

Once installed and linked, you can launch the game from any terminal window by running:

```bash
flappybird
```

### Controls

- **Up Arrow / W / Space:** Flap (jump) or navigate menus.
- **Down Arrow / S:** Navigate menus.
- **Enter / Space:** Select menu option.
- **Ctrl + C:** Quit the game instantly.

## License

ISC
