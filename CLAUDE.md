# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Lukas's 3x/Week Aesthetic Training Program" - a React-based fitness tracking application for a 12-week progressive training program with integrated nutrition and supplement tracking.

## Development Commands

```bash
# Start development server (runs on port 5173 with Vite, or fallback CDN version on port 8000)
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview

# Alternative: Run simple HTTP server for CDN version
python3 -m http.server 8000
```

## Architecture Overview

### Dual Implementation Strategy
The project has two implementations that should be kept in sync:
1. **Modern Vite/TypeScript setup** (`src/` directory) - Primary development version
2. **CDN/Vanilla JS version** (`app.js` + `index.html`) - Fallback version for compatibility

### Core Application Structure

The app is a single-page React application with the main component `TrainingProgram` that manages:

**State Management:**
- `currentWeek` (1-12) - Controls which week of the program is active
- `completedExercises` - Object tracking exercise completion by day/week
- `exerciseWeights` - Object tracking weights used per exercise/week
- `nutritionGoals` - Object tracking nutrition/supplement completion
- `completedSessions` - Array storing saved workout sessions
- `showHistory` - Boolean controlling history modal display

**Phase System:**
- **Foundation Phase** (weeks 1-4): Building movement patterns
- **Growth Phase** (weeks 5-8): Higher volume for muscle growth
- **Intensity Phase** (weeks 9-12): Advanced techniques and peak strength

**Data Structure:**
- `workouts` object contains 3 training days (Monday/Wednesday/Friday)
- Each day has exercises for each phase with sets, reps, rest periods, and notes
- ARM FOCUS exercises are specially marked for arm specialization
- Nutrition goals include 4 protein meals + hydration + micronutrients + 5 supplements

### Key Features

**Exercise Tracking:**
- Progressive exercise variations across 3 phases
- Weight tracking with +/-2.5kg increments
- Exercise completion checkboxes
- Demo links to YouTube search and Google search

**Nutrition & Supplement Tracking:**
- 13 daily goals: 4 protein meals, water, vegetables, fats, carbs, 5 supplements
- Color-coded categories with left borders
- Icons for visual identification

**Session Management:**
- Save completed workouts to history with timestamp
- Full session data capture (exercises, weights, nutrition)
- Modal history view with detailed session breakdown

**Mobile-First Design:**
- Responsive grid layouts
- Touch-optimized buttons with active states
- Sticky header with progress tracking
- Collapsible sections

## Development Guidelines

### Working with Dual Implementations
When modifying functionality:
1. Update the TypeScript version in `src/TrainingProgram.tsx` first
2. Mirror changes in `app.js` (convert TypeScript to vanilla JS)
3. Test both implementations work correctly

### State Key Patterns
- Exercise completion: `"${dayName}-${exerciseIndex}-week${currentWeek}"`
- Exercise weights: `"${dayName}-${exerciseIndex}-week${currentWeek}"`
- Nutrition goals: `"${dayName}-nutrition-${goalIndex}-week${currentWeek}"`

### Styling Conventions
- Uses Tailwind CSS for all styling
- Color categories: protein (red), hydration (blue), micronutrients (green), fats (yellow), carbs (orange), supplements (purple)
- ARM FOCUS exercises use orange left border highlighting
- Mobile-first responsive design with `md:` breakpoints

### Demo Link System
All demo links use search URLs rather than direct links:
- Video: `https://www.youtube.com/results?search_query=` + exercise name
- Guide: `https://www.google.com/search?q=` + exercise name

### Adding New Exercises
1. Add to appropriate phase array in `workouts` object
2. Include: name, sets, rest, notes, demo (slug)
3. Mark arm exercises with "ARM FOCUS:" or "ARM BONUS:" in notes
4. Update both TypeScript and vanilla JS versions

### Adding New Nutrition Goals
1. Add to `dailyNutritionGoals` array with icon, category
2. Add category to `categoryColors` mapping if new category
3. Update summary text if needed