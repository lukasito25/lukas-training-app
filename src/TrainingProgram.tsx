import { useState, useEffect } from "react";
import { CheckCircle2, Circle, RotateCcw, Clock, Plus, Minus, Play, Dumbbell, Heart, Zap, X, Sun, Moon, Pill, Apple, Flame, Wind, BedDouble } from "lucide-react";
import { DatabaseService } from './lib/supabase';

const MuscleMap = ({ muscles, size = "large" }: { muscles: string[], size?: "small" | "large" }) => {
  const mc = { chest: "#ef4444", upper_chest: "#f87171", back: "#3b82f6", lats: "#60a5fa", traps: "#2563eb", shoulders: "#f59e0b", front_delts: "#fbbf24", lateral_delts: "#f59e0b", rear_delts: "#d97706", biceps: "#10b981", triceps: "#14b8a6", forearms: "#34d399", quads: "#8b5cf6", hamstrings: "#a78bfa", glutes: "#7c3aed", calves: "#c4b5fd", core: "#ec4899", erectors: "#6366f1" };
  const w = size === "small" ? 50 : 100, h = size === "small" ? 70 : 140;
  const has = (m: string) => muscles.includes(m);
  return (
    <svg viewBox="0 0 100 140" width={w} height={h} className="mx-auto">
      <ellipse cx="50" cy="12" rx="8" ry="10" fill="#d4a574"/>
      <path d="M42 20 L35 35 L65 35 L58 20 Z" fill={has('traps') ? mc.traps : '#e5e7eb'}/>
      <ellipse cx="28" cy="38" rx="10" ry="6" fill={has('shoulders')||has('front_delts')||has('lateral_delts') ? mc.shoulders : '#e5e7eb'}/>
      <ellipse cx="72" cy="38" rx="10" ry="6" fill={has('shoulders')||has('front_delts')||has('lateral_delts') ? mc.shoulders : '#e5e7eb'}/>
      <path d="M35 35 L35 55 Q50 62 65 55 L65 35 Z" fill={has('chest')||has('upper_chest') ? mc.chest : '#e5e7eb'}/>
      <rect x="18" y="40" width="8" height="22" rx="3" fill={has('biceps')||has('triceps') ? mc.biceps : '#e5e7eb'}/>
      <rect x="74" y="40" width="8" height="22" rx="3" fill={has('biceps')||has('triceps') ? mc.triceps : '#e5e7eb'}/>
      <rect x="38" y="55" width="24" height="25" rx="2" fill={has('core') ? mc.core : '#e5e7eb'}/>
      <path d="M35 40 L28 45 L28 60 L35 55 Z" fill={has('back')||has('lats') ? mc.lats : '#e5e7eb'}/>
      <path d="M65 40 L72 45 L72 60 L65 55 Z" fill={has('back')||has('lats') ? mc.lats : '#e5e7eb'}/>
      <rect x="35" y="82" width="12" height="30" rx="3" fill={has('quads') ? mc.quads : '#e5e7eb'}/>
      <rect x="53" y="82" width="12" height="30" rx="3" fill={has('quads') ? mc.quads : '#e5e7eb'}/>
      <rect x="35" y="78" width="12" height="6" rx="2" fill={has('glutes')||has('hamstrings') ? mc.hamstrings : '#e5e7eb'}/>
      <rect x="53" y="78" width="12" height="6" rx="2" fill={has('glutes')||has('hamstrings') ? mc.hamstrings : '#e5e7eb'}/>
      <rect x="36" y="114" width="10" height="18" rx="3" fill={has('calves') ? mc.calves : '#e5e7eb'}/>
      <rect x="54" y="114" width="10" height="18" rx="3" fill={has('calves') ? mc.calves : '#e5e7eb'}/>
    </svg>
  );
};

interface Exercise {
  name: string;
  sets: number | string;
  reps: string;
  rest: string;
  notes: string;
  muscles: string[];
  demo: string;
}

const ExerciseModal = ({ ex, onClose }: { ex: Exercise | null, onClose: () => void }) => {
  if (!ex) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4"><h3 className="text-lg font-bold text-white">{ex.name}</h3><button onClick={onClose}><X className="w-5 h-5 text-white"/></button></div>
        {ex.muscles && <div className="bg-gray-700 rounded-lg p-4 mb-4"><MuscleMap muscles={ex.muscles}/><div className="flex flex-wrap gap-1 justify-center mt-3">{ex.muscles.map((m,i)=><span key={i} className="text-xs bg-gray-600 px-2 py-1 rounded capitalize text-white">{m.replace('_',' ')}</span>)}</div></div>}
        <div className="space-y-2 text-sm text-white"><div className="flex justify-between"><span className="text-gray-400">Sets × Reps</span><span>{ex.sets} × {ex.reps}</span></div><div className="flex justify-between"><span className="text-gray-400">Rest</span><span>{ex.rest}</span></div></div>
        <div className="mt-4 p-3 bg-gray-700 rounded-lg text-sm text-white">{ex.notes}</div>
        {ex.demo && <a href={ex.demo} target="_blank" rel="noopener noreferrer" className="mt-4 block w-full text-center bg-blue-600 py-2 rounded-lg text-sm text-white"><Play className="w-4 h-4 inline mr-2"/>Demo</a>}
      </div>
    </div>
  );
};

export default function GymCompanion() {
  const [meso, setMeso] = useState(1);
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState("push");
  const [view, setView] = useState("workout");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [doneWarmup, setDoneWarmup] = useState<Record<string, boolean>>({});
  const [doneCool, setDoneCool] = useState<Record<string, boolean>>({});
  const [selEx, setSelEx] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const preferences = await DatabaseService.getPreferences();

      if (preferences) {
        setMeso(preferences.meso || 1);
        setWeek(preferences.week || 1);
        setDay(preferences.day || "push");
        setDone(preferences.done || {});
        setWeights(preferences.weights || {});
        setDoneWarmup(preferences.done_warmup || {});
        setDoneCool(preferences.done_cool || {});
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData: any) => {
    try {
      await DatabaseService.savePreferences({
        meso,
        week,
        day,
        done,
        weights,
        done_warmup: doneWarmup,
        done_cool: doneCool,
        ...newData
      });
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const deload = week === 8;
  const mesos = { 1: "Foundation", 2: "Volume I", 3: "Intensity I", 4: "Volume II", 5: "Intensity II", 6: "Peak" };

  const warmups = {
    push: { name: "Push Warm-Up (8-10 min)", science: "Dynamic stretching +1.3% performance vs static -3.7% (Behm 2016)", items: [
      { name: "Arm Circles", val: "30s each dir", notes: "Small to large", type: "dynamic" },
      { name: "Band Pull-Aparts", val: "15-20 reps", notes: "Squeeze shoulder blades", type: "activation" },
      { name: "Wall Slides", val: "10-12 reps", notes: "Keep wall contact", type: "mobility" },
      { name: "Shoulder Dislocations", val: "10-12 reps", notes: "Band or stick", type: "mobility" },
      { name: "Incline Push-Ups", val: "10-15 reps", notes: "Activation set", type: "activation" },
      { name: "Empty Bar Press", val: "2×10", notes: "40% then 60%", type: "ramp" },
      { name: "Thoracic Rotations", val: "8 each side", notes: "Follow hand with eyes", type: "mobility" },
      { name: "Scapular Push-Ups", val: "10-12 reps", notes: "Protract/retract only", type: "activation" }
    ]},
    pull: { name: "Pull Warm-Up (8-10 min)", science: "Foam rolling +4% flexibility without performance loss", items: [
      { name: "Cat-Cow Stretch", val: "10 cycles", notes: "Full spinal ROM", type: "mobility" },
      { name: "Thoracic Foam Roll", val: "60 sec", notes: "Pause on tight spots", type: "SMR" },
      { name: "Lat Foam Roll", val: "30s each", notes: "Armpit to mid-back", type: "SMR" },
      { name: "Band Face Pulls", val: "15-20 reps", notes: "External rotate at top", type: "activation" },
      { name: "Scapular Pull-Ups", val: "10-12 reps", notes: "No elbow bend", type: "activation" },
      { name: "Dead Hangs", val: "20-30 sec", notes: "Decompress spine", type: "mobility" },
      { name: "Band Rows", val: "15-20 reps", notes: "Feel lats engage", type: "activation" },
      { name: "Hip Hinges", val: "10-12 reps", notes: "PVC on back", type: "movement" }
    ]},
    legs: { name: "Legs Warm-Up (10 min)", science: "Progressive loading through full ROM prevents cartilage damage", items: [
      { name: "Hip Circles", val: "10 each dir", notes: "Large controlled circles", type: "mobility" },
      { name: "Leg Swings Front/Back", val: "15 each leg", notes: "Keep torso stable", type: "dynamic" },
      { name: "Leg Swings Lateral", val: "15 each leg", notes: "Open hip", type: "dynamic" },
      { name: "Glute Bridges", val: "15-20 reps", notes: "2 sec hold at top", type: "activation" },
      { name: "Walking Lunges", val: "10 each leg", notes: "Arms overhead", type: "dynamic" },
      { name: "Lateral Band Walks", val: "15 each dir", notes: "Stay low", type: "activation" },
      { name: "World's Greatest Stretch", val: "5 each side", notes: "Lunge+rotate+hamstring", type: "mobility" },
      { name: "Goblet Squats", val: "2×10", notes: "Full depth, pause", type: "ramp" },
      { name: "Quad Foam Roll", val: "60 sec", notes: "Include IT band", type: "SMR" }
    ]},
    arms: { name: "Arms Warm-Up (8 min)", science: "Zone 2 cardio as active warm-up while building aerobic base", items: [
      { name: "Zone 2 Cardio", val: "5 min", notes: "60-70% HR, conversational", type: "cardio" },
      { name: "Arm Circles", val: "30s each", notes: "Both directions", type: "dynamic" },
      { name: "Wrist Circles", val: "30s each", notes: "Important for grip", type: "mobility" },
      { name: "Band Curls", val: "15-20 reps", notes: "Light, feel biceps", type: "activation" },
      { name: "Band Pushdowns", val: "15-20 reps", notes: "Light, feel triceps", type: "activation" },
      { name: "Shoulder Dislocations", val: "10 reps", notes: "Prepare shoulders", type: "mobility" }
    ]}
  };

  const cooldowns = {
    push: { name: "Push Cool-Down (5-6 min)", science: "Stretching improves flexibility but does NOT reduce DOMS (Afonso 2021)", items: [
      { name: "Doorway Chest Stretch", val: "30s each", notes: "Arm at 90°, lean through", type: "static" },
      { name: "Cross-Body Shoulder", val: "30s each", notes: "Keep shoulder down", type: "static" },
      { name: "Overhead Triceps", val: "30s each", notes: "Gentle elbow pull", type: "static" },
      { name: "Lying Pec Stretch", val: "45s each", notes: "Let gravity open chest", type: "static" },
      { name: "Child's Pose", val: "45 sec", notes: "Sink hips back", type: "static" },
      { name: "Deep Breathing", val: "60 sec", notes: "4-4-6 pattern", type: "recovery" }
    ]},
    pull: { name: "Pull Cool-Down (5-6 min)", science: "30-second holds sufficient for flexibility", items: [
      { name: "Child's Pose", val: "45 sec", notes: "Focus on lat stretch", type: "static" },
      { name: "Seated Spinal Twist", val: "30s each", notes: "Rotate from thoracic", type: "static" },
      { name: "Standing Lat Stretch", val: "30s each", notes: "Lean away from door", type: "static" },
      { name: "Bicep Wall Stretch", val: "30s each", notes: "Palm on wall, rotate", type: "static" },
      { name: "Cat-Cow Cooldown", val: "8-10 cycles", notes: "Gentle, breathe", type: "mobility" },
      { name: "Deep Breathing", val: "60 sec", notes: "4-4-6 pattern", type: "recovery" }
    ]},
    legs: { name: "Legs Cool-Down (6 min)", science: "Chronic stretching improves ROM", items: [
      { name: "Standing Quad Stretch", val: "30s each", notes: "Knees together", type: "static" },
      { name: "Seated Hamstring", val: "45 sec", notes: "Hinge at hips", type: "static" },
      { name: "Figure-4/Pigeon", val: "45s each", notes: "Deep glute stretch", type: "static" },
      { name: "Hip Flexor Stretch", val: "30s each", notes: "Posterior pelvic tilt", type: "static" },
      { name: "Lying Spinal Twist", val: "30s each", notes: "Look opposite", type: "static" },
      { name: "Deep Breathing", val: "60 sec", notes: "4-4-6 pattern", type: "recovery" }
    ]},
    arms: { name: "Arms Cool-Down (5 min)", science: "Reverse kegels improve pelvic floor function", items: [
      { name: "Bicep Wall Stretch", val: "30s each", notes: "Full arm stretch", type: "static" },
      { name: "Tricep Overhead", val: "30s each", notes: "Gentle pull", type: "static" },
      { name: "Wrist Flexor Stretch", val: "20s each", notes: "Pull fingers back", type: "static" },
      { name: "Wrist Extensor Stretch", val: "20s each", notes: "Push hand down", type: "static" },
      { name: "90/90 Hip Stretch", val: "45s each", notes: "Internal/external rotation", type: "mobility" },
      { name: "Reverse Kegels", val: "10-15 reps", notes: "Relax on inhale, 3-5s hold", type: "pelvic" },
      { name: "Deep Breathing", val: "60 sec", notes: "Parasympathetic activation", type: "recovery" }
    ]}
  };

  const supps = {
    morning: [
      { name: "Vitamin D3", dose: "2000-4000 IU", ev: "Strong", note: "Target 75-100 nmol/L" },
      { name: "Vitamin K2 (MK-7)", dose: "100-200 μg", ev: "Strong", note: "Directs calcium to bones" },
      { name: "Omega-3 (EPA/DHA)", dose: "2-3g total", ev: "Strong", note: "Higher EPA ratio" },
      { name: "Magnesium L-Threonate", dose: "1000-2000mg", ev: "Moderate", note: "Crosses BBB" }
    ],
    preWorkout: [
      { name: "Creatine Monohydrate", dose: "5g", ev: "Very Strong", note: "Most proven supplement" },
      { name: "Collagen + Vit C", dose: "10-15g + 50mg", ev: "Moderate", note: "Doubles collagen synthesis" },
      { name: "L-Citrulline", dose: "6-8g", ev: "Moderate", note: "Blood flow, pump" }
    ],
    postWorkout: [
      { name: "Whey Protein", dose: "30-40g", ev: "Strong", note: "~3g leucine for MPS" },
      { name: "Creatine (if not pre)", dose: "5g", ev: "Very Strong", note: "Timing flexible" }
    ],
    evening: [
      { name: "Ashwagandha KSM-66", dose: "600mg", ev: "Strong", note: "↓Cortisol, +15% T" },
      { name: "Magnesium Glycinate", dose: "200-400mg", ev: "Strong", note: "Improves sleep" },
      { name: "Zinc", dose: "15-30mg", ev: "Moderate", note: "Only if diet low" }
    ],
    preSleep: [
      { name: "Casein Protein", dose: "30-40g", ev: "Strong", note: "+22% overnight MPS" },
      { name: "Glycine", dose: "3g", ev: "Moderate", note: "Sleep + collagen" }
    ],
    testosterone: [
      { name: "Tongkat Ali", dose: "200-400mg", ev: "Moderate", note: "Best for low-T" },
      { name: "Fenugreek", dose: "500-600mg", ev: "Moderate", note: "Free testosterone" },
      { name: "L-Citrulline", dose: "3-6g daily", ev: "Moderate", note: "Erectile function" }
    ],
    longevity: [
      { name: "Berberine", dose: "500mg 2-3x", ev: "Strong", note: "Like metformin" },
      { name: "CoQ10/Ubiquinol", dose: "100-200mg", ev: "Moderate", note: "Mitochondrial" }
    ]
  };

  const nutrition = {
    targets: { cal: "2800-3000", protein: "170-185g (2.2g/kg)", carbs: "350-400g", fats: "70-90g" },
    window: "12pm - 8pm (16:8)",
    meals: [
      { time: "12pm", name: "Break-Fast", p: "40g", note: "High protein, moderate carbs" },
      { time: "3-4pm", name: "Pre-Workout", p: "40g", note: "Include carbs for fuel" },
      { time: "7:30-8pm", name: "Post-Workout", p: "40-50g", note: "High carbs for recovery" },
      { time: "Before bed", name: "Pre-Sleep", p: "40g casein", note: "Slow-digesting" }
    ]
  };

  const exercises = {
    push: {
      1: [
        { name: "Barbell Bench Press", sets: 4, reps: "6-8", rest: "3 min", notes: "Arch back, leg drive", muscles: ["chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress" },
        { name: "Incline Barbell Press", sets: 4, reps: "8-10", rest: "2.5 min", notes: "30° angle, upper chest", muscles: ["upper_chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralClavicular/BBInclineBenchPress" },
        { name: "Overhead Press", sets: 4, reps: "6-8", rest: "2.5 min", notes: "Shoulder mass", muscles: ["front_delts", "lateral_delts", "triceps", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidAnterior/BBMilitaryPress" },
        { name: "Barbell Shrugs", sets: 4, reps: "10-12", rest: "90 sec", notes: "TRAP PRIORITY", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug" },
        { name: "Lateral Raises", sets: 3, reps: "12-15", rest: "60 sec", notes: "Slight lean forward", muscles: ["lateral_delts"], demo: "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise" },
        { name: "Weighted Dips", sets: 3, reps: "8-10", rest: "2 min", notes: "Forward lean for chest", muscles: ["chest", "triceps", "front_delts"], demo: "https://exrx.net/WeightExercises/PectoralSternal/WtChestDip" }
      ],
      2: [
        { name: "Barbell Bench Press", sets: 5, reps: "6-10", rest: "3 min", notes: "Volume accumulation", muscles: ["chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress" },
        { name: "Incline DB Press", sets: 4, reps: "8-12", rest: "2.5 min", notes: "Upper chest", muscles: ["upper_chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralClavicular/DBInclineBenchPress" },
        { name: "Standing OHP", sets: 4, reps: "8-10", rest: "2.5 min", notes: "Full body stab", muscles: ["front_delts", "lateral_delts", "triceps", "core"], demo: "https://exrx.net/WeightExercises/DeltoidAnterior/BBMilitaryPress" },
        { name: "Barbell Shrugs", sets: 5, reps: "10-15", rest: "90 sec", notes: "TRAP volume", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug" },
        { name: "Farmer's Walks", sets: 3, reps: "40m", rest: "90 sec", notes: "TRAP/GRIP", muscles: ["traps", "forearms", "core"], demo: "" },
        { name: "Lateral Raises", sets: 4, reps: "12-15", rest: "60 sec", notes: "Width", muscles: ["lateral_delts"], demo: "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise" },
        { name: "Cable Crossovers", sets: 3, reps: "12-15", rest: "60 sec", notes: "Chest detail", muscles: ["chest"], demo: "https://exrx.net/WeightExercises/PectoralSternal/CBStandingFly" }
      ],
      3: [
        { name: "Barbell Bench Press", sets: 5, reps: "4-6", rest: "4 min", notes: "Strength focus", muscles: ["chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress" },
        { name: "Incline BB Press", sets: 4, reps: "5-8", rest: "3 min", notes: "Heavy upper", muscles: ["upper_chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralClavicular/BBInclineBenchPress" },
        { name: "Push Press", sets: 4, reps: "5-8", rest: "3 min", notes: "Leg drive allowed", muscles: ["front_delts", "lateral_delts", "triceps", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidAnterior/BBPushPress" },
        { name: "Barbell Shrugs", sets: 4, reps: "8-10", rest: "2 min", notes: "Heavy TRAP", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug" },
        { name: "Lateral Raises", sets: 3, reps: "10-12", rest: "60 sec", notes: "Strict form", muscles: ["lateral_delts"], demo: "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise" }
      ],
      4: [
        { name: "Barbell Bench Press", sets: 5, reps: "8-12", rest: "2.5 min", notes: "Peak volume", muscles: ["chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress" },
        { name: "Incline DB Press", sets: 4, reps: "10-15", rest: "2 min", notes: "High rep", muscles: ["upper_chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralClavicular/DBInclineBenchPress" },
        { name: "Decline Press", sets: 3, reps: "10-12", rest: "2 min", notes: "Lower chest", muscles: ["chest", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBDeclineBenchPress" },
        { name: "OHP", sets: 4, reps: "8-12", rest: "2 min", notes: "Volume shoulders", muscles: ["front_delts", "lateral_delts", "triceps"], demo: "https://exrx.net/WeightExercises/DeltoidAnterior/BBMilitaryPress" },
        { name: "BB Shrugs", sets: 5, reps: "12-15", rest: "90 sec", notes: "Peak TRAP vol", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug" },
        { name: "DB Shrugs", sets: 3, reps: "15-20", rest: "60 sec", notes: "TRAP pump", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/DBShrug" },
        { name: "Lat Raises Drop", sets: 4, reps: "12-15+8", rest: "60 sec", notes: "Drop 30%", muscles: ["lateral_delts"], demo: "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise" },
        { name: "Cable Flyes", sets: 3, reps: "15-20", rest: "60 sec", notes: "Pump", muscles: ["chest"], demo: "https://exrx.net/WeightExercises/PectoralSternal/CBStandingFly" }
      ],
      5: [
        { name: "Barbell Bench Press", sets: 6, reps: "3-5", rest: "4 min", notes: "Peak strength", muscles: ["chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress" },
        { name: "Incline BB Press", sets: 4, reps: "4-6", rest: "3.5 min", notes: "Heavy", muscles: ["upper_chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralClavicular/BBInclineBenchPress" },
        { name: "Push Press", sets: 5, reps: "4-6", rest: "3 min", notes: "Max power", muscles: ["front_delts", "lateral_delts", "triceps", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidAnterior/BBPushPress" },
        { name: "Heavy Shrugs", sets: 4, reps: "6-8", rest: "2.5 min", notes: "Max load", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug" },
        { name: "Lateral Raises", sets: 3, reps: "10-12", rest: "60 sec", notes: "Maint", muscles: ["lateral_delts"], demo: "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise" }
      ],
      6: [
        { name: "Barbell Bench Press", sets: 4, reps: "6-8", rest: "3 min", notes: "Peak perf", muscles: ["chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress" },
        { name: "Incline DB Press", sets: 4, reps: "8-10", rest: "2.5 min", notes: "Refinement", muscles: ["upper_chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralClavicular/DBInclineBenchPress" },
        { name: "OHP", sets: 4, reps: "6-10", rest: "2.5 min", notes: "Shoulder peak", muscles: ["front_delts", "lateral_delts", "triceps"], demo: "https://exrx.net/WeightExercises/DeltoidAnterior/BBMilitaryPress" },
        { name: "Barbell Shrugs", sets: 4, reps: "10-12", rest: "90 sec", notes: "TRAP peak", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug" },
        { name: "Farmer's Walks", sets: 3, reps: "40m", rest: "90 sec", notes: "Finisher", muscles: ["traps", "forearms", "core"], demo: "" },
        { name: "Lateral Raises", sets: 4, reps: "12-15", rest: "60 sec", notes: "Detail", muscles: ["lateral_delts"], demo: "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise" }
      ]
    },
    pull: {
      1: [
        { name: "Deadlift", sets: 4, reps: "5-6", rest: "4 min", notes: "Full posterior chain", muscles: ["back", "lats", "traps", "hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift" },
        { name: "Barbell Rows", sets: 4, reps: "6-8", rest: "2.5 min", notes: "Back thickness", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/BBBentOverRow" },
        { name: "Weighted Pull-Ups", sets: 4, reps: "6-8", rest: "2.5 min", notes: "V-taper width", muscles: ["lats", "biceps", "rear_delts"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/WtPullup" },
        { name: "Seated Cable Rows", sets: 3, reps: "10-12", rest: "2 min", notes: "Mid-back focus", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/CBSeatedRow" },
        { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60 sec", notes: "Rear delt/rotator", muscles: ["rear_delts", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/CBFacePull" },
        { name: "Barbell Curls", sets: 3, reps: "10-12", rest: "90 sec", notes: "Bicep mass", muscles: ["biceps", "forearms"], demo: "https://exrx.net/WeightExercises/Biceps/BBCurl" }
      ],
      2: [
        { name: "Deadlift", sets: 4, reps: "6-8", rest: "3.5 min", notes: "Volume DL", muscles: ["back", "lats", "traps", "hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift" },
        { name: "Weighted Pull-Ups", sets: 5, reps: "6-10", rest: "2.5 min", notes: "Lat width", muscles: ["lats", "biceps", "rear_delts"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/WtPullup" },
        { name: "Barbell Rows", sets: 4, reps: "8-10", rest: "2.5 min", notes: "Row volume", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/BBBentOverRow" },
        { name: "T-Bar Rows", sets: 3, reps: "8-12", rest: "2 min", notes: "Thickness", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/LVTBarRow" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rest: "2 min", notes: "Width", muscles: ["lats", "biceps"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/CBFrontPulldown" },
        { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60 sec", notes: "Rear delt vol", muscles: ["rear_delts", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/CBFacePull" },
        { name: "Rear Delt Flyes", sets: 3, reps: "15-20", rest: "60 sec", notes: "Isolation", muscles: ["rear_delts"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/DBRearDeltRaise" },
        { name: "Barbell Curls", sets: 3, reps: "10-12", rest: "90 sec", notes: "Bicep", muscles: ["biceps", "forearms"], demo: "https://exrx.net/WeightExercises/Biceps/BBCurl" }
      ],
      3: [
        { name: "Deadlift", sets: 5, reps: "3-5", rest: "4.5 min", notes: "Strength DL", muscles: ["back", "lats", "traps", "hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift" },
        { name: "Weighted Pull-Ups", sets: 4, reps: "5-8", rest: "3 min", notes: "Heavy", muscles: ["lats", "biceps", "rear_delts"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/WtPullup" },
        { name: "Pendlay Rows", sets: 4, reps: "5-8", rest: "2.5 min", notes: "Explosive", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/BBPendlayRow" },
        { name: "Rack Pulls", sets: 3, reps: "5-8", rest: "3 min", notes: "Upper back", muscles: ["back", "traps", "erectors"], demo: "https://exrx.net/WeightExercises/ErectorSpinae/BBRackPull" },
        { name: "Face Pulls", sets: 3, reps: "12-15", rest: "60 sec", notes: "Health", muscles: ["rear_delts", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/CBFacePull" },
        { name: "Hammer Curls", sets: 3, reps: "8-10", rest: "90 sec", notes: "Brachialis", muscles: ["biceps", "forearms"], demo: "https://exrx.net/WeightExercises/Brachioradialis/DBHammerCurl" }
      ],
      4: [
        { name: "Deadlift", sets: 4, reps: "8-10", rest: "3 min", notes: "Volume DL", muscles: ["back", "lats", "traps", "hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift" },
        { name: "Lat Pulldowns", sets: 5, reps: "10-15", rest: "90 sec", notes: "High vol lats", muscles: ["lats", "biceps"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/CBFrontPulldown" },
        { name: "Barbell Rows", sets: 4, reps: "10-12", rest: "2 min", notes: "Row vol", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/BBBentOverRow" },
        { name: "Seated Cable Rows", sets: 4, reps: "12-15", rest: "90 sec", notes: "Multiple grips", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/CBSeatedRow" },
        { name: "Straight-Arm Pulldowns", sets: 3, reps: "12-15", rest: "60 sec", notes: "Lat iso", muscles: ["lats"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/CBStraightArmPulldown" },
        { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60 sec", notes: "Peak rear", muscles: ["rear_delts", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/CBFacePull" },
        { name: "Rear Delt Machine", sets: 3, reps: "15-20", rest: "60 sec", notes: "Pump", muscles: ["rear_delts"], demo: "" },
        { name: "Cable Curls", sets: 3, reps: "12-15", rest: "60 sec", notes: "Bicep pump", muscles: ["biceps"], demo: "https://exrx.net/WeightExercises/Biceps/CBStandingCurl" }
      ],
      5: [
        { name: "Deadlift", sets: 6, reps: "2-4", rest: "5 min", notes: "Peak strength", muscles: ["back", "lats", "traps", "hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift" },
        { name: "Weighted Pull-Ups", sets: 5, reps: "4-6", rest: "3 min", notes: "Max load", muscles: ["lats", "biceps", "rear_delts"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/WtPullup" },
        { name: "Barbell Rows", sets: 4, reps: "5-7", rest: "3 min", notes: "Heavy rows", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/BBBentOverRow" },
        { name: "Rack Pulls", sets: 4, reps: "4-6", rest: "3 min", notes: "Max upper", muscles: ["back", "traps", "erectors"], demo: "https://exrx.net/WeightExercises/ErectorSpinae/BBRackPull" },
        { name: "Face Pulls", sets: 3, reps: "12-15", rest: "60 sec", notes: "Health", muscles: ["rear_delts", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/CBFacePull" }
      ],
      6: [
        { name: "Deadlift", sets: 4, reps: "5-6", rest: "4 min", notes: "Peak perf", muscles: ["back", "lats", "traps", "hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift" },
        { name: "Weighted Pull-Ups", sets: 4, reps: "6-8", rest: "2.5 min", notes: "V-taper", muscles: ["lats", "biceps", "rear_delts"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/WtPullup" },
        { name: "Barbell Rows", sets: 4, reps: "8-10", rest: "2.5 min", notes: "Thickness", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/BBBentOverRow" },
        { name: "T-Bar Rows", sets: 3, reps: "8-10", rest: "2 min", notes: "Refine", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/LVTBarRow" },
        { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60 sec", notes: "Detail", muscles: ["rear_delts", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/CBFacePull" },
        { name: "Barbell Curls", sets: 3, reps: "10-12", rest: "90 sec", notes: "Finish", muscles: ["biceps", "forearms"], demo: "https://exrx.net/WeightExercises/Biceps/BBCurl" }
      ]
    },
    legs: {
      1: [
        { name: "Back Squats", sets: 5, reps: "6-8", rest: "3.5 min", notes: "King of mass", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat" },
        { name: "Romanian Deadlifts", sets: 4, reps: "8-10", rest: "2.5 min", notes: "Posterior chain", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift" },
        { name: "Leg Press", sets: 4, reps: "10-12", rest: "2.5 min", notes: "Quad volume", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/SL45LegPress" },
        { name: "Walking Lunges", sets: 3, reps: "12/leg", rest: "2 min", notes: "Unilateral", muscles: ["quads", "glutes", "hamstrings"], demo: "https://exrx.net/WeightExercises/Quadriceps/DBLunge" },
        { name: "Lying Leg Curls", sets: 4, reps: "10-12", rest: "90 sec", notes: "Ham isolation", muscles: ["hamstrings"], demo: "https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl" },
        { name: "Standing Calf Raises", sets: 4, reps: "12-15", rest: "60 sec", notes: "Full ROM", muscles: ["calves"], demo: "https://exrx.net/WeightExercises/Gastrocnemius/LVStandingCalfRaise" }
      ],
      2: [
        { name: "Back Squats", sets: 5, reps: "8-10", rest: "3 min", notes: "Volume squats", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat" },
        { name: "Romanian Deadlifts", sets: 4, reps: "10-12", rest: "2.5 min", notes: "RDL volume", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift" },
        { name: "Front Squats", sets: 4, reps: "8-10", rest: "2.5 min", notes: "Quad dominant", muscles: ["quads", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBFrontSquat" },
        { name: "Leg Press", sets: 4, reps: "12-15", rest: "2 min", notes: "High vol", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/SL45LegPress" },
        { name: "Bulgarian Split Squats", sets: 3, reps: "10-12/leg", rest: "90 sec", notes: "Unilateral", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/DBSingleLegSplitSquat" },
        { name: "Lying Leg Curls", sets: 4, reps: "12-15", rest: "90 sec", notes: "Ham vol", muscles: ["hamstrings"], demo: "https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl" },
        { name: "Leg Extensions", sets: 3, reps: "12-15", rest: "60 sec", notes: "Quad iso", muscles: ["quads"], demo: "https://exrx.net/WeightExercises/Quadriceps/LVLegExtension" },
        { name: "Standing Calf Raises", sets: 4, reps: "15-20", rest: "60 sec", notes: "Vol calves", muscles: ["calves"], demo: "https://exrx.net/WeightExercises/Gastrocnemius/LVStandingCalfRaise" },
        { name: "Seated Calf Raises", sets: 3, reps: "15-20", rest: "60 sec", notes: "Soleus", muscles: ["calves"], demo: "https://exrx.net/WeightExercises/Soleus/LVSeatedCalfRaise" }
      ],
      3: [
        { name: "Back Squats", sets: 6, reps: "4-6", rest: "4 min", notes: "Strength", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat" },
        { name: "Romanian Deadlifts", sets: 4, reps: "6-8", rest: "3 min", notes: "Heavy RDLs", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift" },
        { name: "Hack Squats", sets: 4, reps: "6-10", rest: "2.5 min", notes: "Quad overload", muscles: ["quads"], demo: "https://exrx.net/WeightExercises/Quadriceps/SLHackSquat" },
        { name: "Walking Lunges", sets: 3, reps: "10/leg", rest: "2 min", notes: "Heavy", muscles: ["quads", "glutes", "hamstrings"], demo: "https://exrx.net/WeightExercises/Quadriceps/DBLunge" },
        { name: "Nordic Curls", sets: 3, reps: "6-10", rest: "2 min", notes: "Eccentric ham", muscles: ["hamstrings"], demo: "" },
        { name: "Standing Calf Raises", sets: 4, reps: "10-12", rest: "90 sec", notes: "Heavy", muscles: ["calves"], demo: "https://exrx.net/WeightExercises/Gastrocnemius/LVStandingCalfRaise" }
      ],
      4: [
        { name: "Back Squats", sets: 5, reps: "10-15", rest: "2.5 min", notes: "High rep", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat" },
        { name: "Leg Press", sets: 5, reps: "15-20", rest: "2 min", notes: "Peak vol", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/SL45LegPress" },
        { name: "Romanian Deadlifts", sets: 4, reps: "12-15", rest: "2 min", notes: "Vol RDLs", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift" },
        { name: "Bulgarian Split Squats", sets: 4, reps: "12-15/leg", rest: "90 sec", notes: "Unilat vol", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/DBSingleLegSplitSquat" },
        { name: "Leg Extensions", sets: 4, reps: "15-20", rest: "60 sec", notes: "Quad pump", muscles: ["quads"], demo: "https://exrx.net/WeightExercises/Quadriceps/LVLegExtension" },
        { name: "Lying Leg Curls", sets: 4, reps: "15-20", rest: "60 sec", notes: "Ham pump", muscles: ["hamstrings"], demo: "https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl" },
        { name: "Hip Thrusts", sets: 3, reps: "12-15", rest: "90 sec", notes: "Glute focus", muscles: ["glutes", "hamstrings"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBHipThrust" },
        { name: "Calf Raises Drop", sets: 4, reps: "15+10+10", rest: "30 sec", notes: "Triple drop", muscles: ["calves"], demo: "" }
      ],
      5: [
        { name: "Back Squats", sets: 6, reps: "3-5", rest: "4.5 min", notes: "Peak strength", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat" },
        { name: "Romanian Deadlifts", sets: 5, reps: "4-6", rest: "3.5 min", notes: "Heavy RDLs", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift" },
        { name: "Leg Press", sets: 4, reps: "6-8", rest: "3 min", notes: "Heavy press", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/SL45LegPress" },
        { name: "Walking Lunges", sets: 3, reps: "8/leg", rest: "2 min", notes: "Heavy", muscles: ["quads", "glutes", "hamstrings"], demo: "https://exrx.net/WeightExercises/Quadriceps/DBLunge" },
        { name: "Lying Leg Curls", sets: 3, reps: "8-10", rest: "90 sec", notes: "Heavy", muscles: ["hamstrings"], demo: "https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl" },
        { name: "Standing Calf Raises", sets: 4, reps: "8-12", rest: "90 sec", notes: "Heavy", muscles: ["calves"], demo: "https://exrx.net/WeightExercises/Gastrocnemius/LVStandingCalfRaise" }
      ],
      6: [
        { name: "Back Squats", sets: 5, reps: "6-8", rest: "3.5 min", notes: "Peak perf", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat" },
        { name: "Romanian Deadlifts", sets: 4, reps: "8-10", rest: "2.5 min", notes: "RDL refine", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift" },
        { name: "Front Squats", sets: 3, reps: "8-10", rest: "2.5 min", notes: "Quad detail", muscles: ["quads", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBFrontSquat" },
        { name: "Leg Press", sets: 3, reps: "10-12", rest: "2 min", notes: "Volume", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/SL45LegPress" },
        { name: "Lying Leg Curls", sets: 4, reps: "10-12", rest: "90 sec", notes: "Ham detail", muscles: ["hamstrings"], demo: "https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl" },
        { name: "Standing Calf Raises", sets: 4, reps: "12-15", rest: "60 sec", notes: "Aesthetics", muscles: ["calves"], demo: "https://exrx.net/WeightExercises/Gastrocnemius/LVStandingCalfRaise" }
      ]
    },
    arms: {
      1: [
        { name: "Zone 2 Cardio", sets: 1, reps: "20 min", rest: "-", notes: "60-70% HR", muscles: [], demo: "" },
        { name: "Barbell Shrugs", sets: 4, reps: "10-15", rest: "90 sec", notes: "TRAP FOCUS", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug" },
        { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60 sec", notes: "Rear delt", muscles: ["rear_delts", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/CBFacePull" },
        { name: "Barbell Curls", sets: 3, reps: "10-12", rest: "90 sec", notes: "Bicep", muscles: ["biceps"], demo: "https://exrx.net/WeightExercises/Biceps/BBCurl" },
        { name: "Tricep Pushdowns", sets: 3, reps: "12-15", rest: "60 sec", notes: "Tricep", muscles: ["triceps"], demo: "https://exrx.net/WeightExercises/Triceps/CBPushdown" }
      ],
      2: [
        { name: "Zone 2 Cardio", sets: 1, reps: "20 min", rest: "-", notes: "60-70% HR", muscles: [], demo: "" },
        { name: "VO2 Intervals", sets: 6, reps: "3 min on/2 off", rest: "-", notes: "80-90% HR", muscles: [], demo: "" },
        { name: "Farmer's Walks", sets: 3, reps: "40m", rest: "90 sec", notes: "TRAP/GRIP", muscles: ["traps", "forearms", "core"], demo: "" },
        { name: "Cable Curls", sets: 3, reps: "12-15", rest: "60 sec", notes: "Bicep", muscles: ["biceps"], demo: "" },
        { name: "Overhead Tricep Ext", sets: 3, reps: "12-15", rest: "60 sec", notes: "Tricep", muscles: ["triceps"], demo: "" }
      ],
      3: [
        { name: "Zone 2 Cardio", sets: 1, reps: "20 min", rest: "-", notes: "Recovery", muscles: [], demo: "" },
        { name: "Rack Pulls", sets: 4, reps: "6-8", rest: "3 min", notes: "Heavy BACK/TRAP", muscles: ["back", "traps", "erectors"], demo: "" },
        { name: "Barbell Shrugs", sets: 3, reps: "8-10", rest: "2 min", notes: "Heavy", muscles: ["traps"], demo: "" },
        { name: "Hammer Curls", sets: 3, reps: "8-10", rest: "90 sec", notes: "Brachialis", muscles: ["biceps", "forearms"], demo: "" },
        { name: "Close-Grip Bench", sets: 3, reps: "8-10", rest: "2 min", notes: "Tricep mass", muscles: ["triceps", "chest"], demo: "" }
      ],
      4: [
        { name: "Zone 2 Cardio", sets: 1, reps: "25 min", rest: "-", notes: "Extended", muscles: [], demo: "" },
        { name: "VO2 Intervals", sets: 8, reps: "90s on/90s off", rest: "-", notes: "90%+ HR", muscles: [], demo: "" },
        { name: "Barbell Shrugs", sets: 5, reps: "12-15", rest: "60 sec", notes: "Vol", muscles: ["traps"], demo: "" },
        { name: "21s Curls", sets: 3, reps: "7+7+7", rest: "2 min", notes: "Pump", muscles: ["biceps"], demo: "" },
        { name: "Tricep Dips", sets: 4, reps: "15-20", rest: "60 sec", notes: "Pump", muscles: ["triceps", "chest"], demo: "" }
      ],
      5: [
        { name: "Zone 2 Cardio", sets: 1, reps: "20 min", rest: "-", notes: "Active recovery", muscles: [], demo: "" },
        { name: "Barbell Shrugs", sets: 4, reps: "6-8", rest: "2.5 min", notes: "Heavy", muscles: ["traps"], demo: "" },
        { name: "Barbell Curls", sets: 4, reps: "6-8", rest: "2 min", notes: "Heavy", muscles: ["biceps"], demo: "" },
        { name: "Close-Grip Bench", sets: 4, reps: "6-8", rest: "2.5 min", notes: "Heavy", muscles: ["triceps", "chest"], demo: "" }
      ],
      6: [
        { name: "Zone 2 Cardio", sets: 1, reps: "20 min", rest: "-", notes: "Heart health", muscles: [], demo: "" },
        { name: "VO2 Intervals", sets: 6, reps: "2 min on/2 off", rest: "-", notes: "Peak", muscles: [], demo: "" },
        { name: "Barbell Shrugs", sets: 4, reps: "10-12", rest: "90 sec", notes: "Peak", muscles: ["traps"], demo: "" },
        { name: "Farmer's Walks", sets: 3, reps: "50m", rest: "90 sec", notes: "Peak", muscles: ["traps", "forearms", "core"], demo: "" },
        { name: "Barbell Curls", sets: 3, reps: "10-12", rest: "90 sec", notes: "Finish", muscles: ["biceps"], demo: "" },
        { name: "Tricep Pushdowns", sets: 3, reps: "12-15", rest: "60 sec", notes: "Finish", muscles: ["triceps"], demo: "" }
      ]
    }
  };

  const getExercises = () => {
    const exs = exercises[day as keyof typeof exercises]?.[meso as keyof typeof exercises.push] || [];
    return deload ? exs.map(e => ({ ...e, sets: Math.ceil((typeof e.sets === 'number' ? e.sets : 3) * 0.5), notes: `DELOAD: ${e.notes}` })) : exs;
  };

  const toggle = async (i: number) => {
    const k = `${meso}-${week}-${day}-${i}`;
    const newDone = { ...done, [k]: !done[k] };
    setDone(newDone);
    await saveData({ done: newDone });
  };
  const toggleW = async (i: number) => {
    const k = `${meso}-${week}-${day}-w-${i}`;
    const newDoneWarmup = { ...doneWarmup, [k]: !doneWarmup[k] };
    setDoneWarmup(newDoneWarmup);
    await saveData({ done_warmup: newDoneWarmup });
  };
  const toggleC = async (i: number) => {
    const k = `${meso}-${week}-${day}-c-${i}`;
    const newDoneCool = { ...doneCool, [k]: !doneCool[k] };
    setDoneCool(newDoneCool);
    await saveData({ done_cool: newDoneCool });
  };
  const updateWt = async (i: number, d: number) => {
    const k = `${day}-${i}`;
    const newWeights = { ...weights, [k]: Math.max(0, (weights[k] || 0) + d) };
    setWeights(newWeights);
    await saveData({ weights: newWeights });
  };
  const getWt = (i: number) => weights[`${day}-${i}`] || 0;
  const pct = () => {
    const e = getExercises();
    const d = e.filter((_, i) => done[`${meso}-${week}-${day}-${i}`]).length;
    return Math.round((d / e.length) * 100);
  };

  const days = {
    push: { name: "Push", icon: "💪", color: "bg-red-500" },
    pull: { name: "Pull", icon: "🔙", color: "bg-blue-500" },
    legs: { name: "Legs", icon: "🦵", color: "bg-green-500" },
    arms: { name: "Arms+", icon: "💎", color: "bg-purple-500" }
  };
  const tabs = [
    { id: "warmup", icon: <Flame className="w-4 h-4" />, c: "text-orange-400" },
    { id: "workout", icon: <Dumbbell className="w-4 h-4" />, c: "text-blue-400" },
    { id: "cooldown", icon: <Wind className="w-4 h-4" />, c: "text-cyan-400" },
    { id: "nutrition", icon: <Apple className="w-4 h-4" />, c: "text-green-400" },
    { id: "supps", icon: <Pill className="w-4 h-4" />, c: "text-purple-400" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your training data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 max-w-lg mx-auto">
      <ExerciseModal ex={selEx} onClose={() => setSelEx(null)} />

      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold">🏋️ LUKAS 2026 GYM COMPANION</h1>
        <p className="text-gray-400 text-xs">FFMI 17.5 → 20 | Evidence-Based Protocol</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-3 mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">M{meso} {mesos[meso as keyof typeof mesos]} • Week {week}{deload ? " 🔄" : ""}</span>
          <span className="text-sm text-green-400">{pct()}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${pct()}%` }}></div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <select value={meso} onChange={(e) => {setMeso(Number(e.target.value)); saveData({ meso: Number(e.target.value) });}} className="flex-1 bg-gray-700 rounded px-2 py-1.5 text-xs">
          {Object.entries(mesos).map(([n, name]) => <option key={n} value={n}>M{n}: {name}</option>)}
        </select>
        <select value={week} onChange={(e) => {setWeek(Number(e.target.value)); saveData({ week: Number(e.target.value) });}} className="w-24 bg-gray-700 rounded px-2 py-1.5 text-xs">
          {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Wk {w}{w === 8 ? " 🔄" : ""}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {Object.entries(days).map(([k, d]) => (
          <button key={k} onClick={() => {setDay(k); saveData({ day: k });}} className={`p-2 rounded-lg text-center transition-all ${day === k ? `${d.color} ring-2 ring-white` : 'bg-gray-700'}`}>
            <div className="text-lg">{d.icon}</div>
            <div className="text-xs">{d.name}</div>
          </button>
        ))}
      </div>

      <div className="flex bg-gray-800 rounded-lg p-1 mb-3">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs transition-all ${view === t.id ? 'bg-gray-700 ' + t.c : 'text-gray-400'}`}>
            {t.icon}
          </button>
        ))}
      </div>

      {view === "warmup" && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="font-bold flex items-center gap-2 mb-2"><Flame className="w-5 h-5 text-orange-400" />{warmups[day as keyof typeof warmups].name}</h2>
          <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-2 mb-3 text-xs text-gray-300">📊 {warmups[day as keyof typeof warmups].science}</div>
          <div className="space-y-2">
            {warmups[day as keyof typeof warmups].items.map((ex, i) => {
              const k = `${meso}-${week}-${day}-w-${i}`;
              const d = doneWarmup[k];
              return (
                <div key={i} className={`bg-gray-700 rounded-lg p-2 flex items-center gap-2 ${d ? 'opacity-60 border-l-4 border-green-500' : ''}`}>
                  <button onClick={() => toggleW(i)}>{d ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-500" />}</button>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{ex.name}</div>
                    <div className="text-xs text-gray-400">{ex.val} • {ex.notes}</div>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${ex.type === 'dynamic' ? 'bg-orange-600/30 text-orange-300' : ex.type === 'activation' ? 'bg-green-600/30 text-green-300' : ex.type === 'SMR' ? 'bg-purple-600/30 text-purple-300' : 'bg-blue-600/30 text-blue-300'}`}>{ex.type}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "workout" && (
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold flex items-center gap-2"><Dumbbell className="w-5 h-5 text-blue-400" />{days[day as keyof typeof days].name} Day</h2>
            <button onClick={() => {
              const keys = Object.keys(done).filter(k => k.startsWith(`${meso}-${week}-${day}`));
              const n = { ...done };
              keys.forEach(k => delete n[k]);
              setDone(n);
              saveData({ done: n });
            }} className="text-xs bg-gray-700 px-2 py-1 rounded flex items-center gap-1"><RotateCcw className="w-3 h-3" /></button>
          </div>
          {deload && <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-2 mb-3 text-xs text-yellow-300">🔄 DELOAD: 50% volume, 40-50% weight</div>}
          <div className="space-y-2">
            {getExercises().map((ex, i) => {
              const k = `${meso}-${week}-${day}-${i}`;
              const d = done[k];
              const w = getWt(i);
              const cardio = ex.muscles.length === 0;
              return (
                <div key={i} className={`bg-gray-700 rounded-lg p-3 ${d ? 'opacity-60 border-l-4 border-green-500' : ''}`}>
                  <div className="flex items-start gap-2">
                    <button onClick={() => toggle(i)} className="mt-1">{d ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-500" />}</button>
                    {!cardio && ex.muscles.length > 0 && <button onClick={() => setSelEx(ex)} className="shrink-0 bg-gray-600 rounded p-1"><MuscleMap muscles={ex.muscles} size="small" /></button>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${d ? 'line-through' : ''} cursor-pointer`} onClick={() => setSelEx(ex)}>{ex.name}</span>
                        {ex.demo && <a href={ex.demo} target="_blank" rel="noopener noreferrer" className="text-blue-400"><Play className="w-4 h-4" /></a>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        <span className="font-mono">{ex.sets}×{ex.reps}</span>
                        {ex.rest !== '-' && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ex.rest}</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{ex.notes}</div>
                      {!cardio && (
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateWt(i, -2.5)} className="bg-gray-600 rounded p-1"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-mono w-16 text-center">{w > 0 ? `${w}kg` : '--'}</span>
                          <button onClick={() => updateWt(i, 2.5)} className="bg-gray-600 rounded p-1"><Plus className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "cooldown" && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="font-bold flex items-center gap-2 mb-2"><Wind className="w-5 h-5 text-cyan-400" />{cooldowns[day as keyof typeof cooldowns].name}</h2>
          <div className="bg-cyan-900/20 border border-cyan-700/30 rounded-lg p-2 mb-3 text-xs text-gray-300">📊 {cooldowns[day as keyof typeof cooldowns].science}</div>
          <div className="space-y-2">
            {cooldowns[day as keyof typeof cooldowns].items.map((ex, i) => {
              const k = `${meso}-${week}-${day}-c-${i}`;
              const d = doneCool[k];
              return (
                <div key={i} className={`bg-gray-700 rounded-lg p-2 flex items-center gap-2 ${d ? 'opacity-60 border-l-4 border-green-500' : ''}`}>
                  <button onClick={() => toggleC(i)}>{d ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-500" />}</button>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{ex.name}</div>
                    <div className="text-xs text-gray-400">{ex.val} • {ex.notes}</div>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${ex.type === 'static' ? 'bg-cyan-600/30 text-cyan-300' : ex.type === 'pelvic' ? 'bg-pink-600/30 text-pink-300' : 'bg-green-600/30 text-green-300'}`}>{ex.type}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 p-2 bg-red-900/20 border border-red-700/30 rounded-lg text-xs text-red-300">⚠️ AVOID cold water immersion within 4hrs - blunts hypertrophy ~40%</div>
        </div>
      )}

      {view === "nutrition" && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="font-bold flex items-center gap-2 mb-3"><Apple className="w-5 h-5 text-green-400" />Daily Nutrition</h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-700 rounded-lg p-2"><div className="text-xs text-gray-400">Calories</div><div className="font-bold text-green-400">{nutrition.targets.cal}</div></div>
            <div className="bg-gray-700 rounded-lg p-2"><div className="text-xs text-gray-400">Protein</div><div className="font-bold text-blue-400">{nutrition.targets.protein}</div></div>
            <div className="bg-gray-700 rounded-lg p-2"><div className="text-xs text-gray-400">Carbs</div><div className="font-bold text-yellow-400">{nutrition.targets.carbs}</div></div>
            <div className="bg-gray-700 rounded-lg p-2"><div className="text-xs text-gray-400">Fats</div><div className="font-bold text-orange-400">{nutrition.targets.fats}</div></div>
          </div>
          <div className="bg-green-900/30 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between"><span className="font-medium flex items-center gap-2"><Clock className="w-4 h-4" />Eating Window</span><span className="text-sm bg-green-600/30 text-green-300 px-2 py-1 rounded">12PM - 8PM</span></div>
            <div className="text-xs text-gray-400 mt-1">Accommodates 5-7pm training with post-workout nutrition</div>
          </div>
          <div className="space-y-2">
            {nutrition.meals.map((m, i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-2 flex justify-between items-center">
                <div><div className="font-medium text-sm">{m.name}</div><div className="text-xs text-gray-400">{m.note}</div></div>
                <div className="text-right"><div className="text-sm text-blue-400">{m.time}</div><div className="text-xs text-gray-500">{m.p}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "supps" && (
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="font-bold flex items-center gap-2 mb-3"><Pill className="w-5 h-5 text-purple-400" />Supplements</h2>
          {[
            { t: "Morning", icon: <Sun className="w-4 h-4 text-yellow-400" />, items: supps.morning },
            { t: "Pre-Workout", icon: <Zap className="w-4 h-4 text-orange-400" />, items: supps.preWorkout },
            { t: "Post-Workout", icon: <Dumbbell className="w-4 h-4 text-green-400" />, items: supps.postWorkout },
            { t: "Evening", icon: <Moon className="w-4 h-4 text-blue-400" />, items: supps.evening },
            { t: "Pre-Sleep", icon: <BedDouble className="w-4 h-4 text-indigo-400" />, items: supps.preSleep },
            { t: "Testosterone/Libido", icon: <Heart className="w-4 h-4 text-red-400" />, items: supps.testosterone },
            { t: "Longevity", icon: <Zap className="w-4 h-4 text-emerald-400" />, items: supps.longevity }
          ].map(({ t, icon, items }) => (
            <div key={t} className="mb-3">
              <div className="flex items-center gap-2 mb-1 text-sm font-medium">{icon}{t}</div>
              <div className="space-y-1">
                {items.map((s, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg p-2 flex items-center justify-between">
                    <div>
                      <span className="text-sm">{s.name}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${s.ev === 'Very Strong' ? 'bg-green-600/30 text-green-300' : s.ev === 'Strong' ? 'bg-blue-600/30 text-blue-300' : 'bg-yellow-600/30 text-yellow-300'}`}>{s.ev}</span>
                      <div className="text-xs text-gray-400">{s.note}</div>
                    </div>
                    <span className="text-sm text-purple-400">{s.dose}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-3 mt-3">
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm"><BedDouble className="w-4 h-4 text-indigo-400" />Recovery</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-700 rounded p-2"><div className="text-gray-400">Sleep</div><div className="font-bold text-indigo-400">7.5-8.5 hrs</div><div className="text-gray-500">16-18°C room</div></div>
          <div className="bg-gray-700 rounded p-2"><div className="text-gray-400">Hydration</div><div className="font-bold text-blue-400">3-4L daily</div><div className="text-gray-500">+500ml/hr training</div></div>
        </div>
        <div className="mt-2 p-2 bg-indigo-900/20 border border-indigo-700/30 rounded text-xs text-indigo-300">💤 Sleep deprivation: -18% MPS, -24% testosterone</div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-3 pb-3">Mon/Wed/Fri + Sat • 5-7pm • v3.0 Evidence-Based</div>
    </div>
  );
}