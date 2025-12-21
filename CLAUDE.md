# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Lukas's Fitness Companion" - a scientific evidence-based training application with 6-mesocycle periodization (48 weeks total), movement plane optimization, and real-time cloud synchronization. The primary goal is transforming from FFMI 17.5 to 20.0 within 12 months using proven hypertrophy protocols.

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

### Cloud-Synced Architecture
The project is a single implementation with cloud synchronization:
1. **Modern Vite/TypeScript setup** (`src/` directory) - Production application
2. **Supabase integration** - Cloud database for cross-device sync
3. **Legacy files** (`app.js` + root `index.html`) - Outdated, use TypeScript version only

### Core Application Structure

The app is a single-page React application with the main component `TrainingProgram` that manages:

**State Management:**
- `meso` (1-6) - Controls which mesocycle is active
- `week` (1-8) - Controls which week within the mesocycle is active
- `day` (push/pull/legs/arms) - Controls which training day is selected
- `done` - Object tracking exercise completion by mesocycle/week/day
- `weights` - Object tracking weights used per exercise
- `nutritionDone` - Object tracking nutrition/supplement completion
- `measurements` - Array storing body measurements for FFMI tracking

**Mesocycle System:**
- **M1 Foundation** (weeks 1-8): Base strength & movement patterns
- **M2 Volume I** (weeks 9-16): Hypertrophy accumulation phase
- **M3 Intensity I** (weeks 17-24): Strength & neural adaptations
- **M4 Volume II** (weeks 25-32): Peak hypertrophy volume
- **M5 Intensity II** (weeks 33-40): Advanced techniques & strength
- **M6 Peak** (weeks 41-48): Competition prep & refinement
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
- **Auto-save exercise completion** - checkboxes save instantly to cloud
- **Weight prefilling** - previous weights automatically populate
- Demo links to YouTube search and Google search

**Nutrition & Supplement Tracking:**
- 13 daily goals: 4 protein meals, water, vegetables, fats, carbs, 5 supplements
- **Auto-save nutrition goals** - checkboxes save instantly to cloud
- Color-coded categories with left borders
- Icons for visual identification

**Session Management:**
- Save completed workouts to history with timestamp
- Full session data capture (exercises, weights, nutrition)
- Modal history view with detailed session breakdown
- **Cross-device synchronization** - progress syncs across phone, tablet, PC

**Mobile-First Design:**
- Responsive grid layouts
- Touch-optimized buttons with active states
- Sticky header with progress tracking
- Collapsible sections

## Cloud Database Integration

### Supabase Setup
The app uses Supabase for cloud data persistence:
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Tables**: `user_preferences` (current state), `completed_sessions` (workout history)
- **User ID**: Uses 'anonymous' as default user identifier
- **Auto-save**: All user interactions save immediately to cloud

### Environment Variables
Required for deployment:
```bash
VITE_SUPABASE_URL=https://abizxuxilbyrfohxjame.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Data Persistence Features
- **Instant Save**: Exercise completion, weight changes, nutrition goals
- **Cross-Device Sync**: Open app on any device, see latest progress
- **Offline Resilience**: Changes persist on refresh, even with poor connection
- **Progress Bar**: Automatically reflects completion percentage from database

## Development Guidelines

### TypeScript-Only Development
The app uses a single TypeScript implementation:
1. All changes go in `src/TrainingProgram.tsx`
2. Legacy `app.js` is outdated - ignore it
3. Test locally with `npm run dev`, deploy via Vercel

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