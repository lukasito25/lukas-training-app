# 🏋️ Lukas's 3x/Week Aesthetic Training Program

A progressive 12-week training app with nutrition tracking, built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Progressive 3-Phase Training**: Foundation → Growth → Intensity
- **Complete Exercise Tracking**: Sets, reps, weights, completion status
- **Nutrition & Supplement Tracking**: 13 daily goals including 5 supplements
- **Session History**: Save and view all completed workouts in the cloud
- **Mobile-First Design**: Optimized for gym usage on mobile devices
- **Cloud Sync**: All data saved to Supabase database
- **ARM Specialization**: Extra arm volume on every session

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deployment**: Vercel

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Environment Variables

Create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema-fixed.sql` in the SQL Editor
3. Add your credentials to `.env`

## Training Program

**3x per Week Schedule:**
- **Monday**: Push Day (Chest, Shoulders, Triceps) - 90 min
- **Wednesday**: Pull Day + Arms (Back, Biceps, Triceps) - 90 min
- **Friday**: Legs + Cardio + Bonus Arms - 75 min

**12-Week Goals:**
- Arms: +2cm (34.5cm → 36.5cm)
- Chest: +4.5cm (100.5cm → 105cm)
- Weight: +5kg (77.4kg → 82-83kg)
- Daily Protein: 156g (39g x 4 meals)

## Mobile PWA Features

- Add to home screen capability
- Offline functionality for gym usage
- Touch-optimized controls
- Fast loading and responsive design