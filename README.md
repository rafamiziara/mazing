# MAZING 🎮

A dynamic maze game built with Next.js and Matter.js physics engine. Navigate through procedurally generated mazes of increasing difficulty using arrow keys.

## 🎯 Features

- **Dynamic Maze Generation**: Each stage features a unique maze created using recursive backtracking
- **Physics-Based Movement**: Realistic ball physics powered by Matter.js
- **Progressive Difficulty**: 20 stages across 4 difficulty levels (Easy, Medium, Hard, Super Hard)
- **Game Controls**: Pause/resume functionality and stage restart options
- **Timer System**: Track your completion time for each stage
- **Responsive Design**: Optimized for desktop gameplay

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd mazing

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play the game.

## 🕹️ How to Play

1. **Select Difficulty**: Choose from Easy, Medium, Hard, or Super Hard
2. **Navigate**: Use arrow keys to move the green ball through the maze
3. **Reach the Goal**: Guide the ball to the light green target in the bottom-right corner
4. **Progress**: Complete stages to unlock higher difficulty levels

### Controls
- `↑↓←→` Arrow keys: Move the ball
- `Pause/Play` button: Pause or resume the game
- `Restart` button: Reset the current stage

## 🛠️ Built With

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Matter.js](https://brm.io/matter-js/)** - 2D physics engine
- **[Tailwind CSS 4.x](https://tailwindcss.com/)** - Utility-first CSS
- **[Day.js](https://day.js.org/)** - Date/time handling
- **[Lucide React](https://lucide.dev/)** - Icon library

## 📝 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint with Prettier
```

## 🎮 Game Architecture

The game uses a state-driven architecture with five core states:
- `initializing` - Setting up the physics engine
- `ready` - Waiting for player input to start
- `running` - Active gameplay
- `paused` - Game temporarily stopped
- `finished` - Stage completed successfully

## 🏗️ Project Structure

```
src/
├── app/
│   ├── components/     # Reusable UI components
│   ├── game/          # Game page and core game logic
│   └── page.tsx       # Home page with difficulty selection
├── hooks/
│   ├── useGameControls.ts  # Keyboard event management
│   ├── useMaze.ts          # Maze generation and physics
│   └── useTimer.ts         # Timer functionality
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## 🤝 Contributing

This project was developed as a demonstration of modern web development skills. Feel free to fork and experiment with new features!

## 📄 License

This project is licensed under the ISC License.
