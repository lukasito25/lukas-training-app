// AUTO-EXTRACTED from src/TrainingProgram.tsx (legacy hard-coded program).
// Source of truth for the 'lukas-48wk-hypertrophy' template and the exercise-library seed.
export const mesos = { 1: "Foundation", 2: "Volume I", 3: "Intensity I", 4: "Volume II", 5: "Intensity II", 6: "Peak" };
export const warmups = {
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
    { name: "Band Face Pulls", val: "15-20 reps", notes: "External rotate at top", type: "activation", demo: "https://www.youtube.com/results?search_query=resistance+band+face+pulls" },
    { name: "Scapular Pull-Ups", val: "10-12 reps", notes: "No elbow bend", type: "activation" },
    { name: "Dead Hangs", val: "20-30 sec", notes: "Decompress spine", type: "mobility" },
    { name: "Band Rows", val: "15-20 reps", notes: "Feel lats engage", type: "activation" },
    { name: "Hip Hinges", val: "10-12 reps", notes: "PVC on back", type: "movement" }
  ]},
  legs: { name: "Legs Warm-Up (10 min)", science: "Progressive loading through full ROM prevents cartilage damage", items: [
    { name: "Hip Circles", val: "10 each dir", notes: "Large controlled circles", type: "mobility", demo: "https://www.youtube.com/results?search_query=hip+circles+warm+up" },
    { name: "Leg Swings Front/Back", val: "15 each leg", notes: "Keep torso stable", type: "dynamic" },
    { name: "Leg Swings Lateral", val: "15 each leg", notes: "Open hip", type: "dynamic" },
    { name: "Glute Bridges", val: "15-20 reps", notes: "2 sec hold at top", type: "activation", demo: "https://www.youtube.com/results?search_query=glute+bridge+exercise" },
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
  ]},
  active_recovery: { name: "Active Recovery Prep (10 min)", science: "Light movement promotes blood flow & reduces muscle stiffness (Barnett 2006)", items: [
    { name: "Gentle Walking", val: "5 min", notes: "Easy pace, outdoors if possible", type: "cardio" },
    { name: "Full Body Circles", val: "30s each", notes: "Arms, hips, ankles", type: "mobility" },
    { name: "Cat-Cow Stretch", val: "10 cycles", notes: "Gentle spinal movement", type: "mobility" },
    { name: "Deep Breathing", val: "2 min", notes: "4-7-8 pattern for parasympathetic", type: "recovery" },
    { name: "Joint Rotations", val: "30s each", notes: "Shoulders, wrists, ankles", type: "mobility" }
  ]},
  rest: { name: "Recovery Preparation (5 min)", science: "Stress reduction & nervous system recovery optimize adaptation", items: [
    { name: "Deep Breathing", val: "3 min", notes: "4-7-8 pattern", type: "recovery" },
    { name: "Gentle Neck Rolls", val: "30s each dir", notes: "Release tech neck tension", type: "mobility" },
    { name: "Shoulder Shrugs", val: "10 reps", notes: "Hold 3s, release tension", type: "mobility" },
    { name: "Mindful Body Scan", val: "90 sec", notes: "Check in with recovery", type: "recovery" }
  ]},
  full_rest: { name: "Deep Recovery (5 min)", science: "Parasympathetic dominance essential for supercompensation", items: [
    { name: "Box Breathing", val: "4 min", notes: "4-4-4-4 pattern", type: "recovery" },
    { name: "Progressive Muscle Relaxation", val: "60 sec", notes: "Tense 5s, release", type: "recovery" }
  ]}
};

export const cooldowns = {
  push: { name: "Push Cool-Down (5-6 min)", science: "Stretching improves flexibility but does NOT reduce DOMS (Afonso 2021)", items: [
    { name: "Doorway Chest Stretch", val: "30s each", notes: "Arm at 90°, lean through", type: "static", demo: "https://www.youtube.com/results?search_query=doorway+chest+stretch" },
    { name: "Cross-Body Shoulder", val: "30s each", notes: "Keep shoulder down", type: "static" },
    { name: "Overhead Triceps", val: "30s each", notes: "Gentle elbow pull", type: "static" },
    { name: "Lying Pec Stretch", val: "45s each", notes: "Let gravity open chest", type: "static" },
    { name: "Child's Pose", val: "45 sec", notes: "Sink hips back", type: "static", demo: "https://www.youtube.com/results?search_query=child+pose+stretch" },
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
  ]},
  active_recovery: { name: "Active Recovery Wind-Down (8 min)", science: "Gentle stretching maintains mobility without fatigue", items: [
    { name: "Full Body Stretch Flow", val: "3 min", notes: "Slow, flowing movements", type: "flow" },
    { name: "Hip Circles", val: "30s each dir", notes: "Gentle, controlled", type: "mobility" },
    { name: "Spinal Waves", val: "60 sec", notes: "Undulate spine segment by segment", type: "mobility" },
    { name: "Restorative Child's Pose", val: "90 sec", notes: "Focus on deep breathing", type: "static" },
    { name: "Legs-Up-Wall", val: "2 min", notes: "Lymphatic drainage", type: "recovery" }
  ]},
  rest: { name: "Recovery Integration (6 min)", science: "Parasympathetic activation promotes growth hormone release", items: [
    { name: "Gentle Self-Massage", val: "2 min", notes: "Focus on tight areas", type: "recovery" },
    { name: "Meditation/Mindfulness", val: "3 min", notes: "Body awareness, gratitude", type: "recovery" },
    { name: "Recovery Journaling", val: "60 sec", notes: "Rate sleep, stress, energy", type: "recovery" }
  ]},
  full_rest: { name: "Deep Recovery Protocol (8 min)", science: "Extended parasympathetic dominance optimizes adaptation", items: [
    { name: "Yoga Nidra", val: "5 min", notes: "Body scan relaxation", type: "recovery" },
    { name: "Gratitude Practice", val: "2 min", notes: "3 things you're grateful for", type: "recovery" },
    { name: "Sleep Preparation", val: "60 sec", notes: "Set intention for rest", type: "recovery" }
  ]}
};

export const supps = {
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
  ],
  restDay: [
    { name: "Vitamin D3", dose: "2000-4000 IU", ev: "Strong", note: "Immune function, hormone production" },
    { name: "Omega-3 (EPA/DHA)", dose: "2-3g", ev: "Strong", note: "Anti-inflammatory, recovery" },
    { name: "Magnesium Glycinate", dose: "200-400mg", ev: "Strong", note: "Muscle relaxation, sleep quality" },
    { name: "Ashwagandha KSM-66", dose: "600mg", ev: "Strong", note: "Stress reduction, cortisol management" },
    { name: "Tart Cherry Extract", dose: "480mg", ev: "Moderate", note: "Natural melatonin, sleep quality" }
  ],
  activeRecovery: [
    { name: "Electrolyte Blend", dose: "Per bottle", ev: "Moderate", note: "Hydration during light activity" },
    { name: "BCAAs/EAAs", dose: "10-15g", ev: "Moderate", note: "Muscle preservation during light activity" },
    { name: "Glutamine", dose: "10-15g", ev: "Moderate", note: "Immune support, gut health" },
    { name: "Vitamin C", dose: "500-1000mg", ev: "Strong", note: "Antioxidant, immune support" }
  ],
  deepRecovery: [
    { name: "ZMA (Zinc, Magnesium, B6)", dose: "Per label", ev: "Strong", note: "Sleep quality, hormone optimization" },
    { name: "Melatonin", dose: "0.5-3mg", ev: "Strong", note: "Sleep onset, circadian rhythm" },
    { name: "L-Theanine", dose: "200-400mg", ev: "Moderate", note: "Relaxation without drowsiness" },
    { name: "Glycine", dose: "3g", ev: "Moderate", note: "Sleep quality, collagen synthesis" },
    { name: "GABA", dose: "750mg", ev: "Moderate", note: "Nervous system calming" }
  ]
};

export const nutrition = {
  targets: { cal: "2800-3000", protein: "170-185g (2.2g/kg)", carbs: "350-400g", fats: "70-90g" },
  window: "12pm - 8pm (16:8)",
  meals: [
    { time: "12pm", name: "Break-Fast", p: "40g", note: "High protein, moderate carbs" },
    { time: "3-4pm", name: "Pre-Workout", p: "40g", note: "Include carbs for fuel" },
    { time: "7:30-8pm", name: "Post-Workout", p: "40-50g", note: "High carbs for recovery" },
    { time: "Before bed", name: "Pre-Sleep", p: "40g casein", note: "Slow-digesting" }
  ]
};

export const exercises = {
  push: {
    1: [
      { name: "Barbell Bench Press", sets: 4, reps: "6-8", rest: "3 min", notes: "Arch back, leg drive", muscles: ["chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress", plane: "sagittal" },
      { name: "Incline Barbell Press", sets: 4, reps: "8-10", rest: "2.5 min", notes: "30° angle, upper chest", muscles: ["upper_chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralClavicular/BBInclineBenchPress", plane: "sagittal" },
      { name: "Arnold Press", sets: 4, reps: "6-8", rest: "2.5 min", notes: "Multi-planar shoulder mass", muscles: ["front_delts", "lateral_delts", "triceps"], demo: "https://www.youtube.com/results?search_query=arnold+press+technique", plane: "multi" },
      { name: "Barbell Shrugs", sets: 4, reps: "10-12", rest: "90 sec", notes: "TRAP PRIORITY", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug", plane: "sagittal" },
      { name: "Lateral Raises", sets: 3, reps: "12-15", rest: "60 sec", notes: "Slight lean forward", muscles: ["lateral_delts"], demo: "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise", plane: "frontal" },
      { name: "Weighted Dips", sets: 3, reps: "8-10", rest: "2 min", notes: "Forward lean for chest", muscles: ["chest", "triceps", "front_delts"], demo: "https://exrx.net/WeightExercises/PectoralSternal/WtChestDip", plane: "sagittal" }
    ],
    2: [
      { name: "Barbell Bench Press", sets: 5, reps: "6-10", rest: "3 min", notes: "Volume accumulation", muscles: ["chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress", plane: "sagittal" },
      { name: "Incline DB Press", sets: 4, reps: "8-12", rest: "2.5 min", notes: "Upper chest", muscles: ["upper_chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralClavicular/DBInclineBenchPress", plane: "sagittal" },
      { name: "Landmine Press", sets: 4, reps: "8-10", rest: "2.5 min", notes: "Multi-planar shoulder mass", muscles: ["front_delts", "lateral_delts", "triceps", "core"], demo: "https://www.youtube.com/results?search_query=landmine+press+technique", plane: "multi" },
      { name: "Barbell Shrugs", sets: 5, reps: "10-15", rest: "90 sec", notes: "TRAP volume", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug", plane: "sagittal" },
      { name: "Farmer's Walks", sets: 3, reps: "40m", rest: "90 sec", notes: "TRAP/GRIP", muscles: ["traps", "forearms", "core"], demo: "", plane: "sagittal" },
      { name: "Lateral Raises", sets: 4, reps: "12-15", rest: "60 sec", notes: "Width", muscles: ["lateral_delts"], demo: "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise", plane: "frontal" },
      { name: "Cable Crossovers", sets: 3, reps: "12-15", rest: "60 sec", notes: "Chest detail", muscles: ["chest"], demo: "https://exrx.net/WeightExercises/PectoralSternal/CBStandingFly", plane: "transverse" }
    ],
    3: [
      { name: "Barbell Bench Press", sets: 5, reps: "4-6", rest: "4 min", notes: "Strength focus", muscles: ["chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress", plane: "sagittal" },
      { name: "Incline BB Press", sets: 4, reps: "5-8", rest: "3 min", notes: "Heavy upper", muscles: ["upper_chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralClavicular/BBInclineBenchPress", plane: "sagittal" },
      { name: "Single-Arm DB Press", sets: 4, reps: "5-8", rest: "3 min", notes: "Anti-rotation core challenge", muscles: ["front_delts", "lateral_delts", "triceps", "core"], demo: "https://www.youtube.com/results?search_query=single+arm+dumbbell+press", plane: "multi" },
      { name: "Barbell Shrugs", sets: 4, reps: "8-10", rest: "2 min", notes: "Heavy TRAP", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug", plane: "sagittal" },
      { name: "Lateral Raises", sets: 3, reps: "10-12", rest: "60 sec", notes: "Strict form", muscles: ["lateral_delts"], demo: "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise", plane: "frontal" }
    ],
    4: [
      { name: "Barbell Bench Press", sets: 5, reps: "8-12", rest: "2.5 min", notes: "Peak volume", muscles: ["chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress", plane: "sagittal" },
      { name: "Incline DB Press", sets: 4, reps: "10-15", rest: "2 min", notes: "High rep", muscles: ["upper_chest", "front_delts", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralClavicular/DBInclineBenchPress", plane: "sagittal" },
      { name: "Decline Press", sets: 3, reps: "10-12", rest: "2 min", notes: "Lower chest", muscles: ["chest", "triceps"], demo: "https://exrx.net/WeightExercises/PectoralSternal/BBDeclineBenchPress", plane: "sagittal" },
      { name: "Z-Press", sets: 4, reps: "8-12", rest: "2 min", notes: "Core-integrated shoulder work", muscles: ["front_delts", "lateral_delts", "triceps", "core"], demo: "https://www.youtube.com/results?search_query=z+press+technique", plane: "multi" },
      { name: "BB Shrugs", sets: 5, reps: "12-15", rest: "90 sec", notes: "Peak TRAP vol", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug", plane: "sagittal" },
      { name: "DB Shrugs", sets: 3, reps: "15-20", rest: "60 sec", notes: "TRAP pump", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/DBShrug", plane: "sagittal" },
      { name: "Lat Raises Drop", sets: 4, reps: "12-15+8", rest: "60 sec", notes: "Drop 30%", muscles: ["lateral_delts"], demo: "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise", plane: "frontal" },
      { name: "Cable Flyes", sets: 3, reps: "15-20", rest: "60 sec", notes: "Pump", muscles: ["chest"], demo: "https://exrx.net/WeightExercises/PectoralSternal/CBStandingFly", plane: "transverse" }
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
      { name: "Deadlift", sets: 4, reps: "5-6", rest: "4 min", notes: "Full posterior chain", muscles: ["back", "lats", "traps", "hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift", plane: "sagittal" },
      { name: "Single-Arm DB Row", sets: 4, reps: "6-8", rest: "2.5 min", notes: "Anti-rotation + back thickness", muscles: ["back", "lats", "traps", "biceps", "core"], demo: "https://www.youtube.com/results?search_query=single+arm+dumbbell+row", plane: "multi" },
      { name: "Weighted Pull-Ups", sets: 4, reps: "6-8", rest: "2.5 min", notes: "V-taper width", muscles: ["lats", "biceps", "rear_delts"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/WtPullup", plane: "sagittal" },
      { name: "T-Bar Row", sets: 3, reps: "10-12", rest: "2 min", notes: "Mid-back focus + stability", muscles: ["back", "lats", "traps", "biceps", "core"], demo: "https://www.youtube.com/results?search_query=t+bar+row+technique", plane: "multi" },
      { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60 sec", notes: "Rear delt/rotator", muscles: ["rear_delts", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/CBFacePull", plane: "transverse" },
      { name: "Hammer Curls to Press", sets: 3, reps: "10-12", rest: "90 sec", notes: "Multi-planar bicep + shoulder", muscles: ["biceps", "forearms", "front_delts"], demo: "https://www.youtube.com/results?search_query=hammer+curl+to+press", plane: "multi" }
    ],
    2: [
      { name: "Deadlift", sets: 4, reps: "6-8", rest: "3.5 min", notes: "Volume DL", muscles: ["back", "lats", "traps", "hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift" },
      { name: "Weighted Pull-Ups", sets: 5, reps: "6-10", rest: "2.5 min", notes: "Lat width", muscles: ["lats", "biceps", "rear_delts"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/WtPullup" },
      { name: "Barbell Rows", sets: 4, reps: "8-10", rest: "2.5 min", notes: "Row volume", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/BBBentOverRow" },
      { name: "T-Bar Rows", sets: 3, reps: "8-12", rest: "2 min", notes: "Thickness", muscles: ["back", "lats", "traps", "biceps"], demo: "https://exrx.net/WeightExercises/BackGeneral/LVTBarRow" },
      { name: "Lat Pulldowns", sets: 3, reps: "10-12", rest: "2 min", notes: "Width", muscles: ["lats", "biceps"], demo: "https://exrx.net/WeightExercises/LatissimusDorsi/CBFrontPulldown" },
      { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60 sec", notes: "Rear delt vol", muscles: ["rear_delts", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/CBFacePull" },
      { name: "Rear Delt Flyes", sets: 3, reps: "15-20", rest: "60 sec", notes: "Isolation", muscles: ["rear_delts"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/DBRearDeltRaise" },
      { name: "21s Bicep Curls", sets: 3, reps: "21 total", rest: "90 sec", notes: "7 bottom + 7 top + 7 full", muscles: ["biceps", "forearms"], demo: "https://www.youtube.com/results?search_query=21s+bicep+curls", plane: "sagittal" }
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
      { name: "Cable Hammer Curls", sets: 3, reps: "10-12", rest: "90 sec", notes: "Constant tension finish", muscles: ["biceps", "forearms"], demo: "https://www.youtube.com/results?search_query=cable+hammer+curls", plane: "sagittal" }
    ]
  },
  legs: {
    1: [
      { name: "Back Squats", sets: 5, reps: "6-8", rest: "3.5 min", notes: "King of mass", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat", plane: "sagittal" },
      { name: "Romanian Deadlifts", sets: 4, reps: "8-10", rest: "2.5 min", notes: "Posterior chain", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift", plane: "sagittal" },
      { name: "Lateral Lunges", sets: 4, reps: "10-12", rest: "2.5 min", notes: "Frontal plane glute activation", muscles: ["quads", "glutes", "adductors"], demo: "https://www.youtube.com/results?search_query=lateral+lunges+technique", plane: "frontal" },
      { name: "Walking Lunges", sets: 3, reps: "12/leg", rest: "2 min", notes: "Unilateral", muscles: ["quads", "glutes", "hamstrings"], demo: "https://exrx.net/WeightExercises/Quadriceps/DBLunge" },
      { name: "Lying Leg Curls", sets: 4, reps: "10-12", rest: "90 sec", notes: "Ham isolation", muscles: ["hamstrings"], demo: "https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl" },
      { name: "Reverse Lunges to Knee Drive", sets: 4, reps: "12-15", rest: "60 sec", notes: "Multi-planar stability", muscles: ["glutes", "quads", "core", "calves"], demo: "https://www.youtube.com/results?search_query=reverse+lunge+knee+drive", plane: "multi" }
    ],
    2: [
      { name: "Back Squats", sets: 5, reps: "8-10", rest: "3 min", notes: "Volume squats", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat", plane: "sagittal" },
      { name: "Romanian Deadlifts", sets: 4, reps: "10-12", rest: "2.5 min", notes: "RDL volume", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift", plane: "sagittal" },
      { name: "Front Squats", sets: 4, reps: "8-10", rest: "2.5 min", notes: "Quad dominant", muscles: ["quads", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBFrontSquat", plane: "sagittal" },
      { name: "Leg Press", sets: 4, reps: "12-15", rest: "2 min", notes: "High vol", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/SL45LegPress", plane: "sagittal" },
      { name: "Cossack Squats", sets: 3, reps: "10-12/leg", rest: "90 sec", notes: "Frontal plane mobility + strength", muscles: ["quads", "glutes", "adductors"], demo: "https://www.youtube.com/results?search_query=cossack+squat+technique", plane: "frontal" },
      { name: "Lying Leg Curls", sets: 4, reps: "12-15", rest: "90 sec", notes: "Ham vol", muscles: ["hamstrings"], demo: "https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl", plane: "sagittal" },
      { name: "Leg Extensions", sets: 3, reps: "12-15", rest: "60 sec", notes: "Quad iso", muscles: ["quads"], demo: "https://exrx.net/WeightExercises/Quadriceps/LVLegExtension", plane: "sagittal" },
      { name: "Standing Calf Raises", sets: 4, reps: "15-20", rest: "60 sec", notes: "Vol calves", muscles: ["calves"], demo: "https://exrx.net/WeightExercises/Gastrocnemius/LVStandingCalfRaise" },
      { name: "Seated Calf Raises", sets: 3, reps: "15-20", rest: "60 sec", notes: "Soleus", muscles: ["calves"], demo: "https://exrx.net/WeightExercises/Soleus/LVSeatedCalfRaise" }
    ],
    3: [
      { name: "Back Squats", sets: 6, reps: "4-6", rest: "4 min", notes: "Strength", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat", plane: "sagittal" },
      { name: "Romanian Deadlifts", sets: 4, reps: "6-8", rest: "3 min", notes: "Heavy RDLs", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift", plane: "sagittal" },
      { name: "Hack Squats", sets: 4, reps: "6-10", rest: "2.5 min", notes: "Quad overload", muscles: ["quads"], demo: "https://exrx.net/WeightExercises/Quadriceps/SLHackSquat", plane: "sagittal" },
      { name: "360° Lunges", sets: 3, reps: "10/leg", rest: "2 min", notes: "Multi-planar strength", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://www.youtube.com/results?search_query=360+degree+lunges", plane: "multi" },
      { name: "Nordic Curls", sets: 3, reps: "6-10", rest: "2 min", notes: "Eccentric ham", muscles: ["hamstrings"], demo: "https://www.youtube.com/results?search_query=nordic+curls+technique", plane: "sagittal" },
      { name: "Single-Leg Calf Raises", sets: 4, reps: "10-12", rest: "90 sec", notes: "Unilateral stability", muscles: ["calves", "core"], demo: "https://www.youtube.com/results?search_query=single+leg+calf+raises", plane: "multi" }
    ],
    4: [
      { name: "Back Squats", sets: 5, reps: "10-15", rest: "2.5 min", notes: "High rep", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat", plane: "sagittal" },
      { name: "Leg Press", sets: 5, reps: "15-20", rest: "2 min", notes: "Peak vol", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/SL45LegPress", plane: "sagittal" },
      { name: "Romanian Deadlifts", sets: 4, reps: "12-15", rest: "2 min", notes: "Vol RDLs", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift", plane: "sagittal" },
      { name: "Curtsy Lunges", sets: 4, reps: "12-15/leg", rest: "90 sec", notes: "Transverse plane glute activation", muscles: ["quads", "glutes", "adductors"], demo: "https://www.youtube.com/results?search_query=curtsy+lunge+technique", plane: "transverse" },
      { name: "Leg Extensions", sets: 4, reps: "15-20", rest: "60 sec", notes: "Quad pump", muscles: ["quads"], demo: "https://exrx.net/WeightExercises/Quadriceps/LVLegExtension", plane: "sagittal" },
      { name: "Lying Leg Curls", sets: 4, reps: "15-20", rest: "60 sec", notes: "Ham pump", muscles: ["hamstrings"], demo: "https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl", plane: "sagittal" },
      { name: "Hip Thrusts", sets: 3, reps: "12-15", rest: "90 sec", notes: "Glute focus", muscles: ["glutes", "hamstrings"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBHipThrust" },
      { name: "Multi-Directional Calf Raises", sets: 4, reps: "15+10+10", rest: "30 sec", notes: "All planes (toes in/out/neutral)", muscles: ["calves"], demo: "https://www.youtube.com/results?search_query=multi+directional+calf+raises", plane: "multi" }
    ],
    5: [
      { name: "Back Squats", sets: 6, reps: "3-5", rest: "4.5 min", notes: "Peak strength", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat", plane: "sagittal" },
      { name: "Romanian Deadlifts", sets: 5, reps: "4-6", rest: "3.5 min", notes: "Heavy RDLs", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift", plane: "sagittal" },
      { name: "Leg Press", sets: 4, reps: "6-8", rest: "3 min", notes: "Heavy press", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/SL45LegPress", plane: "sagittal" },
      { name: "Walking Lunges", sets: 3, reps: "8/leg", rest: "2 min", notes: "Heavy", muscles: ["quads", "glutes", "hamstrings"], demo: "https://exrx.net/WeightExercises/Quadriceps/DBLunge" },
      { name: "Lying Leg Curls", sets: 3, reps: "8-10", rest: "90 sec", notes: "Heavy", muscles: ["hamstrings"], demo: "https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl" },
      { name: "Standing Calf Raises", sets: 4, reps: "8-12", rest: "90 sec", notes: "Heavy", muscles: ["calves"], demo: "https://exrx.net/WeightExercises/Gastrocnemius/LVStandingCalfRaise", plane: "sagittal" }
    ],
    6: [
      { name: "Back Squats", sets: 5, reps: "6-8", rest: "3.5 min", notes: "Peak perf", muscles: ["quads", "glutes", "hamstrings", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBSquat", plane: "sagittal" },
      { name: "Romanian Deadlifts", sets: 4, reps: "8-10", rest: "2.5 min", notes: "RDL refine", muscles: ["hamstrings", "glutes", "erectors"], demo: "https://exrx.net/WeightExercises/GluteusMaximus/BBRomanianDeadlift", plane: "sagittal" },
      { name: "Front Squats", sets: 3, reps: "8-10", rest: "2.5 min", notes: "Quad detail", muscles: ["quads", "core"], demo: "https://exrx.net/WeightExercises/Quadriceps/BBFrontSquat", plane: "sagittal" },
      { name: "Leg Press", sets: 3, reps: "10-12", rest: "2 min", notes: "Volume", muscles: ["quads", "glutes"], demo: "https://exrx.net/WeightExercises/Quadriceps/SL45LegPress", plane: "sagittal" },
      { name: "Lying Leg Curls", sets: 4, reps: "10-12", rest: "90 sec", notes: "Ham detail", muscles: ["hamstrings"], demo: "https://exrx.net/WeightExercises/Hamstrings/LVLyingLegCurl", plane: "sagittal" },
      { name: "Standing Calf Raises", sets: 4, reps: "12-15", rest: "60 sec", notes: "Aesthetics", muscles: ["calves"], demo: "https://exrx.net/WeightExercises/Gastrocnemius/LVStandingCalfRaise", plane: "sagittal" }
    ]
  },
  arms: {
    1: [
      { name: "Zone 2 Cardio", sets: 1, reps: "20 min", rest: "-", notes: "60-70% HR", muscles: [], demo: "" },
      { name: "Barbell Shrugs", sets: 4, reps: "10-15", rest: "90 sec", notes: "TRAP FOCUS", muscles: ["traps"], demo: "https://exrx.net/WeightExercises/TrapeziusUpper/BBShrug" },
      { name: "Face Pulls", sets: 4, reps: "15-20", rest: "60 sec", notes: "Rear delt", muscles: ["rear_delts", "traps"], demo: "https://exrx.net/WeightExercises/DeltoidPosterior/CBFacePull" },
      { name: "Zottman Curls", sets: 3, reps: "10-12", rest: "90 sec", notes: "Eccentric + concentric emphasis", muscles: ["biceps", "forearms"], demo: "https://www.youtube.com/results?search_query=zottman+curls", plane: "multi" },
      { name: "Overhead Cable Extension", sets: 3, reps: "12-15", rest: "60 sec", notes: "Long head emphasis", muscles: ["triceps"], demo: "https://www.youtube.com/results?search_query=overhead+cable+tricep+extension", plane: "sagittal" }
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
      { name: "Barbell Curls", sets: 4, reps: "6-8", rest: "2 min", notes: "Heavy", muscles: ["biceps"], demo: "https://exrx.net/WeightExercises/Biceps/BBCurl", plane: "sagittal" },
      { name: "Close-Grip Bench", sets: 4, reps: "6-8", rest: "2.5 min", notes: "Heavy", muscles: ["triceps", "chest"], demo: "https://exrx.net/WeightExercises/Triceps/BBBenchPressCloseGrip", plane: "sagittal" }
    ],
    6: [
      { name: "Zone 2 Cardio", sets: 1, reps: "20 min", rest: "-", notes: "Heart health", muscles: [], demo: "" },
      { name: "VO2 Intervals", sets: 6, reps: "2 min on/2 off", rest: "-", notes: "Peak", muscles: [], demo: "" },
      { name: "Barbell Shrugs", sets: 4, reps: "10-12", rest: "90 sec", notes: "Peak", muscles: ["traps"], demo: "" },
      { name: "Farmer's Walks", sets: 3, reps: "50m", rest: "90 sec", notes: "Peak", muscles: ["traps", "forearms", "core"], demo: "" },
      { name: "Barbell Curls", sets: 3, reps: "10-12", rest: "90 sec", notes: "Finish", muscles: ["biceps"], demo: "https://exrx.net/WeightExercises/Biceps/BBCurl", plane: "sagittal" },
      { name: "Diamond Push-Ups", sets: 3, reps: "12-15", rest: "60 sec", notes: "Bodyweight finish", muscles: ["triceps", "chest", "core"], demo: "https://www.youtube.com/results?search_query=diamond+push+ups", plane: "sagittal" }
    ]
  },
  active_recovery: {
    1: [
      { name: "Light Walking/Movement", sets: 1, reps: "20-30 min", rest: "-", notes: "Zone 1 HR (50-60%), outdoors preferred", muscles: [], demo: "https://www.youtube.com/results?search_query=zone+1+walking+benefits", plane: "sagittal" },
      { name: "Gentle Yoga Flow", sets: 1, reps: "15-20 min", rest: "-", notes: "Focus on mobility, avoid intense poses", muscles: ["core"], demo: "https://www.youtube.com/results?search_query=gentle+yoga+flow", plane: "multi" },
      { name: "Breathing Exercises", sets: 3, reps: "5 min each", rest: "2 min", notes: "4-7-8 pattern, parasympathetic activation", muscles: [], demo: "https://www.youtube.com/results?search_query=4+7+8+breathing", plane: "sagittal" }
    ],
    2: [
      { name: "Nature Walk", sets: 1, reps: "30-40 min", rest: "-", notes: "Vitamin D + nature benefits, Zone 1 HR", muscles: [], demo: "", plane: "sagittal" },
      { name: "Dynamic Stretching", sets: 1, reps: "12-15 min", rest: "-", notes: "Joint mobility, blood flow without fatigue", muscles: [], demo: "https://www.youtube.com/results?search_query=dynamic+stretching+routine", plane: "multi" },
      { name: "Foam Rolling", sets: 1, reps: "10-15 min", rest: "-", notes: "Focus on tight areas from training", muscles: [], demo: "https://www.youtube.com/results?search_query=foam+rolling+routine", plane: "sagittal" }
    ],
    3: [
      { name: "Swimming/Water Walking", sets: 1, reps: "25-30 min", rest: "-", notes: "Low impact, full body recovery", muscles: [], demo: "", plane: "multi" },
      { name: "Meditation/Mindfulness", sets: 1, reps: "10-15 min", rest: "-", notes: "Stress reduction, cortisol management", muscles: [], demo: "https://www.youtube.com/results?search_query=meditation+for+athletes", plane: "sagittal" }
    ],
    4: [
      { name: "Light Cycling", sets: 1, reps: "25-35 min", rest: "-", notes: "Zone 1 HR, promote blood flow", muscles: [], demo: "", plane: "sagittal" },
      { name: "Stretching + Recovery", sets: 1, reps: "15-20 min", rest: "-", notes: "Static stretches + deep breathing", muscles: [], demo: "https://www.youtube.com/results?search_query=recovery+stretching+routine", plane: "multi" }
    ],
    5: [
      { name: "Tai Chi/Qi Gong", sets: 1, reps: "20-25 min", rest: "-", notes: "Mind-body connection, gentle movement", muscles: [], demo: "https://www.youtube.com/results?search_query=tai+chi+for+recovery", plane: "multi" },
      { name: "Light Bodyweight Movement", sets: 1, reps: "10-12 min", rest: "-", notes: "Gentle calisthenics, joint health", muscles: [], demo: "", plane: "multi" }
    ],
    6: [
      { name: "Leisurely Walk + Reflection", sets: 1, reps: "30-40 min", rest: "-", notes: "Peak phase recovery, journal thoughts", muscles: [], demo: "", plane: "sagittal" },
      { name: "Restorative Yoga", sets: 1, reps: "20-25 min", rest: "-", notes: "Deep relaxation poses", muscles: [], demo: "https://www.youtube.com/results?search_query=restorative+yoga", plane: "multi" }
    ]
  },
  rest: {
    1: [
      { name: "Sleep Quality Assessment", sets: 1, reps: "2 min", rest: "-", notes: "Track: duration, quality, morning energy 1-10", muscles: [], demo: "", plane: "sagittal" },
      { name: "Stress Level Check-In", sets: 1, reps: "3 min", rest: "-", notes: "Rate stress 1-10, identify sources", muscles: [], demo: "", plane: "sagittal" },
      { name: "Hydration Focus", sets: 8, reps: "250-300ml", rest: "hourly", notes: "Clear urine = adequate hydration", muscles: [], demo: "", plane: "sagittal" },
      { name: "Nutrition Planning", sets: 1, reps: "10 min", rest: "-", notes: "Plan next day's meals, prep if needed", muscles: [], demo: "", plane: "sagittal" }
    ],
    2: [
      { name: "Recovery Metrics", sets: 1, reps: "5 min", rest: "-", notes: "HRV, RHR, subjective recovery 1-10", muscles: [], demo: "", plane: "sagittal" },
      { name: "Gentle Self-Massage", sets: 1, reps: "15-20 min", rest: "-", notes: "Lacrosse ball, focus on trouble spots", muscles: [], demo: "https://www.youtube.com/results?search_query=self+massage+recovery", plane: "sagittal" },
      { name: "Reading/Learning", sets: 1, reps: "30+ min", rest: "-", notes: "Fitness knowledge, personal development", muscles: [], demo: "", plane: "sagittal" }
    ],
    3: [
      { name: "Complete Rest Focus", sets: 1, reps: "Full day", rest: "-", notes: "Minimize physical stress, prioritize rest", muscles: [], demo: "", plane: "sagittal" },
      { name: "Social Connection", sets: 1, reps: "60+ min", rest: "-", notes: "Friends, family - mental health support", muscles: [], demo: "", plane: "sagittal" }
    ],
    4: [
      { name: "Body Composition Check", sets: 1, reps: "5 min", rest: "-", notes: "Progress photos, measurements if scheduled", muscles: [], demo: "", plane: "sagittal" },
      { name: "Program Reflection", sets: 1, reps: "10 min", rest: "-", notes: "What's working? What needs adjustment?", muscles: [], demo: "", plane: "sagittal" },
      { name: "Meal Prep", sets: 1, reps: "60-90 min", rest: "-", notes: "Prepare protein sources, vegetables", muscles: [], demo: "", plane: "sagittal" }
    ],
    5: [
      { name: "Recovery Prioritization", sets: 1, reps: "Full day", rest: "-", notes: "Maximum rest for adaptation", muscles: [], demo: "", plane: "sagittal" },
      { name: "Supplement Inventory", sets: 1, reps: "10 min", rest: "-", notes: "Restock needed items", muscles: [], demo: "", plane: "sagittal" }
    ],
    6: [
      { name: "Peak Phase Rest", sets: 1, reps: "Full day", rest: "-", notes: "Competition prep recovery", muscles: [], demo: "", plane: "sagittal" },
      { name: "Mental Preparation", sets: 1, reps: "15 min", rest: "-", notes: "Visualization, goal reinforcement", muscles: [], demo: "", plane: "sagittal" }
    ]
  },
  full_rest: {
    1: [
      { name: "Extended Sleep", sets: 1, reps: "8-9 hours", rest: "-", notes: "Foundation phase recovery", muscles: [], demo: "", plane: "sagittal" },
      { name: "Complete Physical Rest", sets: 1, reps: "Full day", rest: "-", notes: "No structured exercise, gentle movement only", muscles: [], demo: "", plane: "sagittal" },
      { name: "Stress Management", sets: 1, reps: "30+ min", rest: "-", notes: "Meditation, hobbies, relaxation", muscles: [], demo: "", plane: "sagittal" }
    ],
    2: [
      { name: "Recovery Sleep", sets: 1, reps: "8-9 hours", rest: "-", notes: "Growth hormone optimization", muscles: [], demo: "", plane: "sagittal" },
      { name: "Creative Pursuits", sets: 1, reps: "60+ min", rest: "-", notes: "Art, music, writing - mental recovery", muscles: [], demo: "", plane: "sagittal" }
    ],
    3: [
      { name: "Deep Recovery Sleep", sets: 1, reps: "8.5-9+ hours", rest: "-", notes: "Intensity phase demands more rest", muscles: [], demo: "", plane: "sagittal" },
      { name: "Weekend Reflection", sets: 1, reps: "20 min", rest: "-", notes: "Weekly review, gratitude practice", muscles: [], demo: "", plane: "sagittal" }
    ],
    4: [
      { name: "Volume Phase Recovery", sets: 1, reps: "9+ hours", rest: "-", notes: "Peak volume requires maximum rest", muscles: [], demo: "", plane: "sagittal" },
      { name: "Social Activities", sets: 1, reps: "2+ hours", rest: "-", notes: "Maintain relationships, stress relief", muscles: [], demo: "", plane: "sagittal" }
    ],
    5: [
      { name: "Intensity Recovery Sleep", sets: 1, reps: "9+ hours", rest: "-", notes: "Neural recovery from heavy training", muscles: [], demo: "", plane: "sagittal" },
      { name: "Passive Recovery", sets: 1, reps: "Full day", rest: "-", notes: "Massage, sauna, complete relaxation", muscles: [], demo: "", plane: "sagittal" }
    ],
    6: [
      { name: "Competition Prep Rest", sets: 1, reps: "9+ hours", rest: "-", notes: "Peak performance requires peak rest", muscles: [], demo: "", plane: "sagittal" },
      { name: "Mental Relaxation", sets: 1, reps: "2+ hours", rest: "-", notes: "Unstructured time, fun activities", muscles: [], demo: "", plane: "sagittal" }
    ]
  }
};
