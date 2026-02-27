# MotionPlate

> A browser-based cinematic sequence builder that turns static images into exportable video clips using composable effects, timed text, and transitions.

## Design principle:

> It's a plate compositor, not a video editor. You don't cut footage — you compose plates (images) into motion sequences.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

## Project Structure

- `src/engine/` - Core rendering engine with effects, transitions, and post-processing
- `src/spec/` - Schema definitions and validation for motion plates
- `src/composer/` - UI components for the timeline, preview, and editing
- `src/director/` - Optional LLM-powered director for automated plate generation
- `src/store/` - Zustand state management

## Features

- Real-time motion graphics editing
- Extensible effects and transitions library
- Timeline-based sequencing
- JSON-based plate specifications
- Export to video formats
- Dark/light theme support

## Development

This project uses:
- Vite for fast development and building
- React with TypeScript
- Tailwind CSS for styling
- Vitest for testing
- ESLint + Prettier for code quality
