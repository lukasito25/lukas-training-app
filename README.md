# 🏋️ Lukas's Fitness Companion | FFMI 20 Goal

A scientific evidence-based training companion with 6-mesocycle periodization, movement plane optimization, and real-time cloud synchronization. Transform from FFMI 17.5 to 20.0 within 12 months using proven hypertrophy protocols.

## 🎯 Core Features

### **Intelligent Training System**
- **6-Mesocycle Periodization**: Foundation → Volume I → Intensity I → Volume II → Intensity II → Peak
- **8-Week Mesocycles**: 7 training weeks + 1 deload week (scientifically optimal for hypertrophy)
- **Movement Plane Optimization**: 64% sagittal, 18% multi-planar, 10% frontal, 8% transverse
- **Auto-Progressive Overload**: Smart weight suggestions based on previous sessions
- **Adaptive Measurement Tracking**: Real-time FFMI calculations with mesocycle-specific targets

### **Cloud-First Architecture**
- **Instant Auto-Save**: Every checkbox/weight change saves to cloud immediately
- **Cross-Device Sync**: Seamless progress across phone, tablet, and desktop
- **Offline Resilience**: Works without connection, syncs when online
- **Session History**: Complete workout logs with exercise and nutrition data
- **Smart Prefilling**: Previous weights automatically populate for progression

### **Evidence-Based Nutrition**
- **13 Daily Targets**: 4 protein meals + hydration + micronutrients + 5 supplements
- **Supplement Protocol**: Evidence-graded recommendations (D3, K2, Omega-3, Creatine, etc.)
- **Color-Coded Tracking**: Visual categories for easy identification
- **Auto-Save Goals**: Nutrition completion syncs instantly

### **Mobile-Optimized Experience**
- **PWA Ready**: Install as native app on any device
- **Touch-Optimized**: Large buttons, sticky headers, swipe gestures
- **Dark Mode**: Optimized for gym lighting conditions
- **Responsive Grid**: Perfect scaling from phone to tablet to desktop

## 📊 FFMI 20 Goal System

### **Target Progression**
- **Starting FFMI**: 17.5 (77.4kg @ ~10% body fat)
- **Target FFMI**: 20.0 (87kg @ ~10% body fat)
- **Timeline**: 12 months (6 x 8-week mesocycles)
- **Expected Gains**: 9.6kg lean mass through optimized programming

### **Mesocycle Structure**
```
M1 Foundation    → Base strength & movement patterns (8 weeks)
M2 Volume I      → Hypertrophy accumulation phase (8 weeks)
M3 Intensity I   → Strength & neural adaptations (8 weeks)
M4 Volume II     → Peak hypertrophy volume (8 weeks)
M5 Intensity II  → Advanced techniques & strength (8 weeks)
M6 Peak         → Competition prep & refinement (8 weeks)
```

### **Training Split**
- **Monday**: Push Day (Chest, Shoulders, Triceps) - 90 min
- **Wednesday**: Pull Day + Arms (Back, Biceps, Triceps) - 90 min
- **Friday**: Legs + Cardio + Arms Specialization - 75 min

## 🔧 Tech Stack

### **Frontend**
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for mobile-first responsive design
- **Lucide React** for consistent iconography
- **Vite** for fast development and builds

### **Backend & Database**
- **Supabase** (PostgreSQL) with Row Level Security
- **Real-time subscriptions** for instant sync
- **Edge functions** for performance

### **Deployment & PWA**
- **Vercel** for global CDN deployment
- **PWA Manifest** for native app experience
- **Service Worker** for offline functionality

## 🚀 Development Setup

```bash
# Install dependencies
npm install

# Start development server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run TypeScript linter
npm run lint
```

## 🔐 Environment Configuration

Create `.env` file:
```bash
VITE_SUPABASE_URL=https://abizxuxilbyrfohxjame.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

## 🗄️ Database Schema

### **Core Tables**
- `user_preferences`: Current state (mesocycle, week, day, progress)
- `completed_sessions`: Workout history with full exercise/nutrition data
- `body_measurements`: Start/end measurements per mesocycle with FFMI tracking

### **Setup Instructions**
1. Create new Supabase project
2. Run SQL schema from `supabase-schema-fixed.sql`
3. Enable Row Level Security (RLS)
4. Add environment variables

## 📱 Progressive Web App

### **Installation**
- **iOS**: Safari → Share → Add to Home Screen
- **Android**: Chrome → Menu → Add to Home Screen
- **Desktop**: Chrome → Install App button

### **Features**
- Native app experience
- Offline functionality
- Push notifications (coming soon)
- Background sync

## 🏆 Training Science

### **Movement Plane Distribution**
- **Sagittal (64%)**: Squats, deadlifts, presses - primary strength movements
- **Multi-planar (18%)**: Arnold press, landmine exercises - functional strength
- **Frontal (10%)**: Lateral lunges, cossack squats - lateral stability
- **Transverse (8%)**: Cable crossovers, curtsy lunges - rotational power

### **Evidence-Based Programming**
- **Mesocycle Length**: 8 weeks optimal for hypertrophy (Helms et al., 2018)
- **Deload Frequency**: Every 7th week prevents overreaching (Kraemer & Ratamess, 2004)
- **Volume Progression**: Periodized increases maximize adaptations (Schoenfeld et al., 2017)
- **Movement Planes**: Multi-planar training enhances muscle fiber recruitment (Saeterbakken et al., 2019)

### **Supplement Protocol**
All recommendations based on peer-reviewed research:
- **Creatine Monohydrate**: 5g daily (Very Strong evidence)
- **Vitamin D3**: 2000-4000 IU daily (Strong evidence)
- **Omega-3**: 2-3g EPA/DHA daily (Strong evidence)
- **Collagen + Vitamin C**: 10-15g + 50mg pre-workout (Moderate evidence)

## 🌐 Live Application

**Production URL**: [lukas-training-app.vercel.app](https://lukas-training-app.vercel.app)

### **Key Benefits**
- **Zero Configuration**: Open and start training immediately
- **Always Synchronized**: Real-time progress across all devices
- **Evidence-Based**: Every exercise and protocol backed by research
- **FFMI-Focused**: Specifically designed for lean mass optimization

---

*Built with scientific rigor for maximum hypertrophy gains and FFMI progression.*