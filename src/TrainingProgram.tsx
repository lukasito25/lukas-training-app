import { useState, useEffect } from "react";
import { CheckCircle2, Circle, RotateCcw, Trophy, Calendar, Clock, Plus, Minus, Play, FileText, Save, History, X } from "lucide-react";
import { DatabaseService } from './lib/supabase';

const TrainingProgram = () => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [exerciseWeights, setExerciseWeights] = useState<Record<string, number>>({});
  const [nutritionGoals, setNutritionGoals] = useState<Record<string, boolean>>({});
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load data from Supabase on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading data from Supabase...');
      const [preferences, sessions] = await Promise.all([
        DatabaseService.getPreferences(),
        DatabaseService.getSessions()
      ]);

      console.log('Loaded preferences:', preferences);
      console.log('Loaded sessions:', sessions);

      if (preferences) {
        console.log('Setting preferences:', {
          current_week: preferences.current_week,
          completed_exercises: preferences.completed_exercises,
          exercise_weights: preferences.exercise_weights,
          nutrition_goals: preferences.nutrition_goals
        });

        setCurrentWeek(preferences.current_week);
        setCompletedExercises(preferences.completed_exercises || {});
        setExerciseWeights(preferences.exercise_weights || {});
        setNutritionGoals(preferences.nutrition_goals || {});
      } else {
        console.log('No preferences found, using defaults');
        setCompletedExercises({});
        setExerciseWeights({});
        setNutritionGoals({});
      }

      setCompletedSessions(sessions || []);
      console.log('Data loading completed');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed problematic auto-save useEffect that was causing data loss



  // Progressive program structure - changes every 4 weeks
  const getPhase = (week: number) => {
    if (week <= 4) return "foundation";
    if (week <= 8) return "growth";
    return "intensity";
  };

  const phaseConfig = {
    foundation: {
      name: "Foundation Phase",
      description: "Building movement patterns and base strength",
      color: "bg-blue-600"
    },
    growth: {
      name: "Growth Phase",
      description: "Higher volume for maximum muscle growth",
      color: "bg-green-600"
    },
    intensity: {
      name: "Intensity Phase",
      description: "Advanced techniques and peak strength",
      color: "bg-red-600"
    }
  };

  // Daily nutrition goals
  const dailyNutritionGoals = [
    { name: "Meal 1: Protein (39g)", icon: "🥩", category: "protein" },
    { name: "Meal 2: Protein (39g)", icon: "🍗", category: "protein" },
    { name: "Meal 3: Protein (39g)", icon: "🥛", category: "protein" },
    { name: "Meal 4: Protein (39g)", icon: "🍳", category: "protein" },
    { name: "Water: 2-3 Liters", icon: "💧", category: "hydration" },
    { name: "Vegetables/Fruits", icon: "🥗", category: "micronutrients" },
    { name: "Healthy Fats", icon: "🥑", category: "fats" },
    { name: "Complex Carbs", icon: "🍠", category: "carbs" },
    { name: "Creatine", icon: "💊", category: "supplements" },
    { name: "Omega-3", icon: "🐟", category: "supplements" },
    { name: "Ashwagandha", icon: "🌿", category: "supplements" },
    { name: "Lion's Mane", icon: "🍄", category: "supplements" },
    { name: "B-Complex", icon: "💉", category: "supplements" }
  ];

  const workouts = {
    "Monday - Push Day": {
      color: "bg-red-600",
      exercises: {
        foundation: [
          { name: "Incline Barbell Press", sets: "4 x 8-10", rest: "3 min", notes: "Upper chest priority - 30-45° angle", demo: "incline-barbell-press" },
          { name: "Overhead Press", sets: "4 x 8-10", rest: "2.5 min", notes: "Core tight, drive through legs", demo: "overhead-press" },
          { name: "Incline Dumbbell Press", sets: "3 x 10-12", rest: "2.5 min", notes: "Deep stretch, slow negative", demo: "incline-db-press" },
          { name: "Lateral Raises", sets: "4 x 12-15", rest: "90 sec", notes: "Control weight, slight lean forward", demo: "lateral-raises" },
          { name: "Weighted Dips", sets: "3 x 10-12", rest: "2 min", notes: "Lean forward for chest emphasis", demo: "weighted-dips" },
          { name: "Close-Grip Bench Press", sets: "3 x 10-12", rest: "2 min", notes: "Tricep mass builder", demo: "close-grip-bench" },
          { name: "Overhead Tricep Extension", sets: "3 x 12-15", rest: "90 sec", notes: "ARM FOCUS: Full stretch at bottom", demo: "overhead-tricep-ext" },
          { name: "Rear Delt Flyes", sets: "3 x 15-20", rest: "60 sec", notes: "Light weight, squeeze at top", demo: "rear-delt-flyes" }
        ],
        growth: [
          { name: "Incline Barbell Press", sets: "5 x 6-8", rest: "3 min", notes: "Progressive overload focus", demo: "incline-barbell-press" },
          { name: "Dumbbell Shoulder Press", sets: "4 x 8-10", rest: "2.5 min", notes: "Full ROM, control at top", demo: "db-shoulder-press" },
          { name: "Decline Barbell Press", sets: "4 x 8-10", rest: "2.5 min", notes: "Lower chest development", demo: "decline-barbell-press" },
          { name: "Arnold Press", sets: "3 x 10-12", rest: "2 min", notes: "Rotation for all deltoid heads", demo: "arnold-press" },
          { name: "Superset: Lateral + Rear Raises", sets: "4 x 12+12", rest: "2 min", notes: "No rest between exercises", demo: "lateral-rear-superset" },
          { name: "Weighted Dips", sets: "4 x 8-12", rest: "2.5 min", notes: "Add weight belt/chain", demo: "weighted-dips-heavy" },
          { name: "Diamond Push-ups", sets: "3 x max", rest: "90 sec", notes: "ARM FOCUS: Tricep isolation, to failure", demo: "diamond-pushups" },
          { name: "Cable Tricep Pushdowns", sets: "3 x 12-15", rest: "90 sec", notes: "ARM FOCUS: Rope attachment, full extension", demo: "cable-tricep-pushdowns" },
          { name: "Cable Upright Rows", sets: "3 x 12-15", rest: "60 sec", notes: "Wide grip, pull to chest", demo: "cable-upright-rows" }
        ],
        intensity: [
          { name: "Incline Barbell Press", sets: "6 x 4-6", rest: "4 min", notes: "Heavy singles, spotter needed", demo: "heavy-incline-press" },
          { name: "Push Press", sets: "5 x 3-5", rest: "3 min", notes: "Explosive leg drive", demo: "push-press" },
          { name: "Weighted Dip Clusters", sets: "4 x 3+3+3", rest: "15s between, 3min total", notes: "Heavy dips with mini-rests", demo: "dip-clusters" },
          { name: "Handstand Push-ups", sets: "4 x 5-8", rest: "3 min", notes: "Wall-assisted, full ROM", demo: "handstand-pushups" },
          { name: "Drop Set Lateral Raises", sets: "3 x 10+8+6", rest: "2.5 min", notes: "Heavy to light, no rest", demo: "drop-set-laterals" },
          { name: "Close-Grip Press to Skulls", sets: "4 x 6+8", rest: "2.5 min", notes: "ARM FOCUS: Mechanical drop set", demo: "cgbp-to-skulls" },
          { name: "21s Tricep Extensions", sets: "3 x 21", rest: "2 min", notes: "ARM FOCUS: 7 bottom + 7 top + 7 full", demo: "21s-tricep-ext" },
          { name: "Giant Set: Shoulders", sets: "3 rounds", rest: "3 min", notes: "Press + Lateral + Rear + Upright", demo: "shoulder-giant-set" }
        ]
      }
    },
    "Wednesday - Pull Day + Arms": {
      color: "bg-blue-600",
      exercises: {
        foundation: [
          { name: "Wide-Grip Pull-ups", sets: "4 x 8-12", rest: "3 min", notes: "Full hang, chest to bar", demo: "wide-grip-pullups" },
          { name: "Barbell Rows", sets: "4 x 8-10", rest: "2.5 min", notes: "Pull to lower chest", demo: "barbell-rows" },
          { name: "Cable Rows (Wide Grip)", sets: "3 x 10-12", rest: "2.5 min", notes: "Upper back thickness", demo: "wide-cable-rows" },
          { name: "Lat Pulldown", sets: "3 x 10-12", rest: "2 min", notes: "Pull to upper chest", demo: "lat-pulldown" },
          { name: "Barbell Curls", sets: "4 x 10-12", rest: "2 min", notes: "ARM FOCUS: No swinging", demo: "barbell-curls" },
          { name: "Hammer Curls", sets: "4 x 10-12", rest: "90 sec", notes: "ARM FOCUS: Slow negatives", demo: "hammer-curls" },
          { name: "Cable Curls", sets: "3 x 12-15", rest: "90 sec", notes: "ARM FOCUS: Constant tension", demo: "cable-curls" },
          { name: "Preacher Curls", sets: "3 x 12-15", rest: "90 sec", notes: "ARM FOCUS: Bicep isolation", demo: "preacher-curls" }
        ],
        growth: [
          { name: "Weighted Pull-ups", sets: "5 x 6-8", rest: "3 min", notes: "Add weight when possible", demo: "weighted-pullups" },
          { name: "T-Bar Rows", sets: "4 x 8-10", rest: "2.5 min", notes: "Chest supported, heavy", demo: "t-bar-rows" },
          { name: "Cable Rows (V-Handle)", sets: "4 x 8-10", rest: "2.5 min", notes: "Squeeze shoulder blades", demo: "v-handle-rows" },
          { name: "Reverse Flyes", sets: "3 x 12-15", rest: "90 sec", notes: "Rear delt focus", demo: "reverse-flyes" },
          { name: "Barbell Curls", sets: "5 x 8-10", rest: "2 min", notes: "ARM FOCUS: Progressive overload", demo: "barbell-curls-heavy" },
          { name: "Alternating Dumbbell Curls", sets: "4 x 10-12 each", rest: "2 min", notes: "ARM FOCUS: Peak contraction", demo: "alternating-db-curls" },
          { name: "Cable Hammer Curls", sets: "4 x 10-12", rest: "90 sec", notes: "ARM FOCUS: Rope attachment", demo: "cable-hammer-curls" },
          { name: "Concentration Curls", sets: "3 x 12-15 each", rest: "90 sec", notes: "ARM FOCUS: Isolation", demo: "concentration-curls" },
          { name: "Face Pulls", sets: "3 x 15-20", rest: "60 sec", notes: "High reps, rear delts", demo: "face-pulls" }
        ],
        intensity: [
          { name: "Weighted Pull-up Clusters", sets: "5 x 3+3+3", rest: "15s between, 3min total", notes: "Heavy weight, mini-rests", demo: "pullup-clusters" },
          { name: "Chest-Supported Rows", sets: "5 x 5-7", rest: "3 min", notes: "Maximum weight possible", demo: "chest-supported-rows-heavy" },
          { name: "Single-Arm Dumbbell Rows", sets: "4 x 6-8 each", rest: "2.5 min", notes: "Heavy unilateral work", demo: "single-arm-db-rows" },
          { name: "Wide-Grip Cable Rows", sets: "4 x 8-10", rest: "2.5 min", notes: "Upper back width", demo: "wide-cable-rows-heavy" },
          { name: "21s Barbell Curls", sets: "4 x 21", rest: "2.5 min", notes: "ARM FOCUS: 7+7+7 protocol", demo: "21s-barbell-curls" },
          { name: "Drop Set Hammer Curls", sets: "3 x 8+6+4", rest: "2 min", notes: "ARM FOCUS: Heavy to light", demo: "drop-set-hammers" },
          { name: "Cable Curl 21s", sets: "3 x 21", rest: "2 min", notes: "ARM FOCUS: Cable version", demo: "cable-curl-21s" },
          { name: "Superset: Preacher + Hammer", sets: "3 x 10+10", rest: "2 min", notes: "ARM FOCUS: No rest between", demo: "preacher-hammer-superset" }
        ]
      }
    },
    "Friday - Legs + Cardio + Bonus Arms": {
      color: "bg-green-600",
      exercises: {
        foundation: [
          { name: "Back Squat", sets: "4 x 8-10", rest: "3 min", notes: "Full depth, drive through heels", demo: "back-squat" },
          { name: "Romanian Deadlift", sets: "4 x 8-10", rest: "3 min", notes: "Hinge at hips, feel hamstrings", demo: "romanian-deadlift" },
          { name: "Leg Press", sets: "3 x 12-15", rest: "2.5 min", notes: "Full range of motion", demo: "leg-press" },
          { name: "Walking Lunges", sets: "3 x 12 each leg", rest: "2 min", notes: "Keep torso upright", demo: "walking-lunges" },
          { name: "Leg Curls", sets: "3 x 12-15", rest: "90 sec", notes: "Slow negatives", demo: "leg-curls" },
          { name: "Calf Raises", sets: "4 x 15-20", rest: "90 sec", notes: "Full stretch and squeeze", demo: "calf-raises" },
          { name: "BONUS: Cable Curls", sets: "3 x 12-15", rest: "60 sec", notes: "ARM BONUS: End workout pump", demo: "cable-curls-bonus" },
          { name: "BONUS: Tricep Pushdowns", sets: "3 x 12-15", rest: "60 sec", notes: "ARM BONUS: Tricep pump", demo: "tricep-pushdowns-bonus" }
        ],
        growth: [
          { name: "Front Squats", sets: "4 x 8-10", rest: "3 min", notes: "Quad emphasis, upright torso", demo: "front-squats" },
          { name: "Romanian Deadlift", sets: "5 x 6-8", rest: "3 min", notes: "Progressive overload", demo: "romanian-deadlift-heavy" },
          { name: "Bulgarian Split Squats", sets: "3 x 10-12 each", rest: "2.5 min", notes: "Rear foot elevated", demo: "bulgarian-split-squats" },
          { name: "Hip Thrusts", sets: "4 x 12-15", rest: "2 min", notes: "Squeeze glutes hard", demo: "hip-thrusts" },
          { name: "Stiff-Leg Deadlifts", sets: "3 x 12-15", rest: "2 min", notes: "Hamstring isolation", demo: "stiff-leg-deadlifts" },
          { name: "Single-Leg Calf Raises", sets: "4 x 12-15 each", rest: "90 sec", notes: "Unilateral strength", demo: "single-leg-calves" },
          { name: "Zone 2 Cardio", sets: "15-20 min", rest: "N/A", notes: "Moderate intensity", demo: "zone2-cardio" },
          { name: "BONUS: 21s Curls", sets: "3 x 21", rest: "90 sec", notes: "ARM BONUS: Growth technique", demo: "21s-curls-bonus" },
          { name: "BONUS: Diamond Push-ups", sets: "3 x max", rest: "90 sec", notes: "ARM BONUS: Tricep burnout", demo: "diamond-pushups-bonus" }
        ],
        intensity: [
          { name: "Back Squat", sets: "6 x 4-6", rest: "4 min", notes: "Heavy singles, safety bars", demo: "heavy-back-squats" },
          { name: "Deficit Deadlifts", sets: "5 x 3-5", rest: "3.5 min", notes: "Stand on platform", demo: "deficit-deadlifts" },
          { name: "Pause Squats", sets: "4 x 6-8", rest: "3 min", notes: "3-second pause at bottom", demo: "pause-squats" },
          { name: "Single-Leg Press", sets: "4 x 8-10 each", rest: "2.5 min", notes: "Unilateral leg strength", demo: "single-leg-press" },
          { name: "Jump Squats", sets: "4 x 6", rest: "2 min", notes: "Explosive power", demo: "jump-squats" },
          { name: "1.5 Rep Calf Raises", sets: "4 x 12", rest: "2 min", notes: "Bottom half + full rep", demo: "1-5-rep-calves" },
          { name: "HIIT Cardio", sets: "12 min", rest: "N/A", notes: "30s on / 30s off intervals", demo: "hiit-cardio" },
          { name: "BONUS: Drop Set Curls", sets: "3 x 10+8+6", rest: "2 min", notes: "ARM BONUS: Maximum pump", demo: "drop-set-curls-bonus" },
          { name: "BONUS: Close-Grip Push-ups", sets: "3 x max", rest: "90 sec", notes: "ARM BONUS: Tricep finisher", demo: "close-grip-pushups-bonus" }
        ]
      }
    }
  };

  const updateWeight = async (day: string, exerciseIndex: number, change: number) => {
    const key = `${day}-${exerciseIndex}-week${currentWeek}`;
    const currentValue = exerciseWeights[key] || getLastUsedWeight(day, exerciseIndex, currentWeek);
    const newWeight = Math.max(0, currentValue + change);

    // Update state
    setExerciseWeights(prev => ({
      ...prev,
      [key]: newWeight
    }));

    // Save to Supabase immediately with the new value
    try {
      await DatabaseService.savePreferences({
        current_week: currentWeek,
        completed_exercises: completedExercises,
        exercise_weights: {
          ...exerciseWeights,
          [key]: newWeight
        },
        nutrition_goals: nutritionGoals
      });
    } catch (error) {
      console.error('Failed to save exercise weight:', error);
    }
  };

  const toggleExercise = async (day: string, exerciseIndex: number) => {
    const key = `${day}-${exerciseIndex}-week${currentWeek}`;
    const newValue = !completedExercises[key];

    // Update state
    setCompletedExercises(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Save to Supabase immediately with the new value
    try {
      await DatabaseService.savePreferences({
        current_week: currentWeek,
        completed_exercises: {
          ...completedExercises,
          [key]: newValue
        },
        exercise_weights: exerciseWeights,
        nutrition_goals: nutritionGoals
      });
    } catch (error) {
      console.error('Failed to save exercise completion:', error);
    }
  };

  const toggleNutritionGoal = async (day: string, goalIndex: number) => {
    const key = `${day}-nutrition-${goalIndex}-week${currentWeek}`;
    const newValue = !nutritionGoals[key];

    // Update state
    setNutritionGoals(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Save to Supabase immediately with the new value
    try {
      await DatabaseService.savePreferences({
        current_week: currentWeek,
        completed_exercises: completedExercises,
        exercise_weights: exerciseWeights,
        nutrition_goals: {
          ...nutritionGoals,
          [key]: newValue
        }
      });
    } catch (error) {
      console.error('Failed to save nutrition goal:', error);
    }
  };

  // Get the most recent weight used for this exercise across all previous weeks
  const getLastUsedWeight = (dayName: string, exerciseIndex: number, currentWeek: number) => {
    // Check current week first
    const currentKey = `${dayName}-${exerciseIndex}-week${currentWeek}`;
    if (exerciseWeights[currentKey] && exerciseWeights[currentKey] > 0) {
      return exerciseWeights[currentKey];
    }

    // Look through completed sessions for the same exercise
    for (const session of completedSessions) {
      if (session.day_name === dayName && session.exercises && session.exercises[exerciseIndex]) {
        const exercise = session.exercises[exerciseIndex];
        if (exercise.weight && exercise.weight > 0) {
          return exercise.weight;
        }
      }
    }

    // Look through previous weeks in exerciseWeights
    for (let week = currentWeek - 1; week >= 1; week--) {
      const key = `${dayName}-${exerciseIndex}-week${week}`;
      if (exerciseWeights[key] && exerciseWeights[key] > 0) {
        return exerciseWeights[key];
      }
    }

    return 0; // Default if no previous weight found
  };

  const resetWeek = async () => {
    const newCompletedExercises = { ...completedExercises };
    const newNutritionGoals = { ...nutritionGoals };
    Object.keys(newCompletedExercises).forEach(key => {
      if (key.includes(`week${currentWeek}`)) {
        delete newCompletedExercises[key];
      }
    });
    Object.keys(newNutritionGoals).forEach(key => {
      if (key.includes(`week${currentWeek}`)) {
        delete newNutritionGoals[key];
      }
    });
    setCompletedExercises(newCompletedExercises);
    setNutritionGoals(newNutritionGoals);
  };

  const saveSession = async (dayName: string) => {
    setSaving(true);
    try {
      const currentPhase = getPhase(currentWeek);
      const exercises = (workouts as any)[dayName].exercises[currentPhase];

      // Get completed exercises for this day
      const dayExercises = exercises.map((exercise: any, index: number) => ({
        name: exercise.name,
        sets: exercise.sets,
        weight: exerciseWeights[`${dayName}-${index}-week${currentWeek}`] || 0,
        completed: completedExercises[`${dayName}-${index}-week${currentWeek}`] || false
      }));

      // Get completed nutrition goals for this day
      const dayNutrition = dailyNutritionGoals.map((goal, index) => ({
        name: goal.name,
        icon: goal.icon,
        category: goal.category,
        completed: nutritionGoals[`${dayName}-nutrition-${index}-week${currentWeek}`] || false
      }));

      const sessionData = {
        session_date: new Date().toISOString().split('T')[0],
        session_time: new Date().toTimeString().split(' ')[0],
        week: currentWeek,
        phase: currentPhase,
        day_name: dayName,
        exercises: dayExercises,
        nutrition: dayNutrition,
        exercises_completed: dayExercises.filter((e: any) => e.completed).length,
        total_exercises: dayExercises.length,
        nutrition_completed: dayNutrition.filter(n => n.completed).length,
        total_nutrition: dayNutrition.length
      };

      await DatabaseService.saveSession(sessionData);

      // Refresh sessions list
      const sessions = await DatabaseService.getSessions();
      setCompletedSessions(sessions);

      alert(`✅ Session saved to cloud!\n${dayName}\nExercises: ${sessionData.exercises_completed}/${sessionData.total_exercises}\nNutrition: ${sessionData.nutrition_completed}/${sessionData.total_nutrition}`);
    } catch (error) {
      console.error('Error saving session:', error);
      alert('❌ Failed to save session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getDemoUrl = () => {
    return {
      video: "https://www.youtube.com/results?search_query=",
      guide: "https://www.google.com/search?q="
    };
  };

  const currentPhase = getPhase(currentWeek) as keyof typeof phaseConfig;
  const phaseInfo = phaseConfig[currentPhase];

  const getCompletionStats = () => {
    const currentWorkouts = Object.values(workouts).map(workout => workout.exercises[currentPhase]);
    const totalExercises = currentWorkouts.reduce((sum, exercises) => sum + exercises.length, 0);
    const completedCount = Object.keys(completedExercises).filter(key =>
      key.includes(`week${currentWeek}`) && completedExercises[key]
    ).length;
    return { completed: completedCount, total: totalExercises };
  };

  const stats = getCompletionStats();
  const completionPercentage = Math.round((stats.completed / stats.total) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your training data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-500 w-5 h-5" />
              <h1 className="text-lg font-bold text-gray-800">3x/Week Aesthetic</h1>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">Progress</div>
              <div className="text-xl font-bold text-blue-600">{completionPercentage}%</div>
            </div>
          </div>

          {/* Compact Phase Info */}
          <div className={`${phaseInfo.color} text-white p-3 rounded-lg mb-3`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{phaseInfo.name}</h3>
                <p className="text-xs opacity-90">{phaseInfo.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-75">Weeks {currentPhase === 'foundation' ? '1-4' : currentPhase === 'growth' ? '5-8' : '9-12'}</div>
              </div>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="text-gray-600 w-4 h-4" />
                <span className="text-sm font-semibold">Week {currentWeek}</span>
              </div>
              <select
                value={currentWeek}
                onChange={(e) => setCurrentWeek(Number(e.target.value))}
                className="px-2 py-1 border rounded-lg text-sm min-w-[80px]"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(week => (
                  <option key={week} value={week}>Week {week}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <History className="w-3 h-3" />
                History
              </button>
              <button
                onClick={resetWeek}
                className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>


          {/* Progress Bar */}
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Workout Days */}
      <div className="px-4 pb-4 space-y-4">
        {Object.entries(workouts).map(([dayName, workout]) => {
          const exercises = workout.exercises[currentPhase];
          const dayCompleted = exercises.every((_, index) =>
            completedExercises[`${dayName}-${index}-week${currentWeek}`]
          );
          const dayProgress = exercises.filter((_, index) =>
            completedExercises[`${dayName}-${index}-week${currentWeek}`]
          ).length;

          return (
            <div key={dayName} className="bg-white rounded-xl shadow-sm overflow-hidden border">
              {/* Day Header */}
              <div className={`${workout.color} text-white p-3`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold leading-tight">
                    {dayName.split(' - ')[0]}<br/>
                    <span className="text-xs opacity-90">{dayName.split(' - ')[1]}</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                      {dayProgress}/{exercises.length}
                    </div>
                    {dayCompleted && (
                      <CheckCircle2 className="w-5 h-5 text-green-300" />
                    )}
                  </div>
                </div>
              </div>

              {/* Exercises */}
              <div className="divide-y divide-gray-100">
                {exercises.map((exercise, index) => {
                  const isCompleted = completedExercises[`${dayName}-${index}-week${currentWeek}`];
                  const currentWeight = exerciseWeights[`${dayName}-${index}-week${currentWeek}`] || getLastUsedWeight(dayName, index, currentWeek);
                  const demos = getDemoUrl();
                  const isArmFocus = exercise.notes.includes('ARM FOCUS') || exercise.notes.includes('ARM BONUS');

                  return (
                    <div
                      key={index}
                      className={`p-3 transition-all ${
                        isCompleted ? 'bg-green-50' : 'hover:bg-gray-50'
                      } ${isArmFocus ? 'border-l-4 border-l-orange-400' : ''}`}
                    >
                      {/* Exercise Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <button
                          onClick={() => toggleExercise(dayName, index)}
                          className="mt-1 flex-shrink-0 touch-manipulation"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className={`font-semibold text-sm leading-tight ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>
                              {exercise.name}
                              {isArmFocus && <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-1 rounded">ARM</span>}
                            </h3>
                            <div className="flex items-center gap-1 text-xs ml-2">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                                {exercise.sets}
                              </span>
                            </div>
                          </div>

                          {exercise.rest !== "N/A" && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                              <Clock className="w-3 h-3" />
                              <span>Rest: {exercise.rest}</span>
                            </div>
                          )}

                          <p className="text-xs text-gray-600 mb-3 leading-relaxed">{exercise.notes}</p>
                        </div>
                      </div>

                      {/* Weight Tracking & Controls */}
                      <div className="flex items-center justify-between">
                        {/* Weight Tracking */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700">Weight:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateWeight(dayName, index, -2.5)}
                              className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors touch-manipulation active:scale-95"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-14 text-center font-mono text-sm bg-gray-100 py-2 px-1 rounded-lg">
                              {currentWeight}kg
                            </span>
                            <button
                              onClick={() => updateWeight(dayName, index, 2.5)}
                              className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors touch-manipulation active:scale-95"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Demo Links */}
                        <div className="flex gap-1">
                          <a
                            href={demos.video + exercise.name.replace(/\s+/g, '+')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors touch-manipulation active:scale-95"
                          >
                            <Play className="w-3 h-3" />
                            Video
                          </a>
                          <a
                            href={demos.guide + exercise.name.replace(/\s+/g, '+')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors touch-manipulation active:scale-95"
                          >
                            <FileText className="w-3 h-3" />
                            Guide
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nutrition Tracking Section */}
              <div className="bg-gray-50 border-t border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-gray-800">🍎 Daily Nutrition Goals</span>
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {dailyNutritionGoals.filter((_, index) =>
                      nutritionGoals[`${dayName}-nutrition-${index}-week${currentWeek}`]
                    ).length}/{dailyNutritionGoals.length}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {dailyNutritionGoals.map((goal, index) => {
                    const isCompleted = nutritionGoals[`${dayName}-nutrition-${index}-week${currentWeek}`];
                    const categoryColors = {
                      protein: 'border-l-red-400',
                      hydration: 'border-l-blue-400',
                      micronutrients: 'border-l-green-400',
                      fats: 'border-l-yellow-400',
                      carbs: 'border-l-orange-400',
                      supplements: 'border-l-purple-400'
                    };

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 bg-white rounded-lg border-l-4 ${(categoryColors as any)[goal.category]} ${
                          isCompleted ? 'bg-green-50' : ''
                        } transition-all`}
                      >
                        <button
                          onClick={() => toggleNutritionGoal(dayName, index)}
                          className="flex-shrink-0"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <span className="text-lg">{goal.icon}</span>
                        <span className={`text-xs font-medium leading-tight ${isCompleted ? 'text-green-800' : 'text-gray-700'}`}>
                          {goal.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Nutrition Summary */}
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-800">
                    <div className="grid grid-cols-2 gap-2">
                      <div><strong>Target Protein:</strong> 156g/day</div>
                      <div><strong>Meal Timing:</strong> Every 4-5h</div>
                      <div><strong>Pre-workout:</strong> Light carbs</div>
                      <div><strong>Post-workout:</strong> Protein + carbs</div>
                      <div><strong>Supplements:</strong> Daily stack</div>
                      <div><strong>Best Time:</strong> With meals</div>
                    </div>
                  </div>
                </div>

                {/* Save Session Button */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => saveSession(dayName)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Session to Cloud'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goals & Stats remain the same... */}
      <div className="px-4 pb-6 space-y-4">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
            <div className="text-lg font-bold text-blue-600">{currentWeek}</div>
            <div className="text-xs text-gray-600">Week</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
            <div className="text-lg font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-600">Done</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border">
            <div className="text-lg font-bold text-purple-600">3x</div>
            <div className="text-xs text-gray-600">Per Week</div>
          </div>
        </div>

        {/* 3x/Week Specific Goals */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h3 className="font-bold text-blue-800 text-sm mb-2">3x/Week Realistic Targets</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <div className="flex justify-between">
              <span>Arms (Week 0: 34.5cm):</span>
              <span className="font-mono">Week 12: 36.5cm (+2cm)</span>
            </div>
            <div className="flex justify-between">
              <span>Chest (Week 0: 100.5cm):</span>
              <span className="font-mono">Week 12: 105cm (+4.5cm)</span>
            </div>
            <div className="flex justify-between">
              <span>Weight (Week 0: 77.4kg):</span>
              <span className="font-mono">Week 12: 82-83kg (+5kg)</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Protein:</span>
              <span className="font-mono">156g (39g x 4 meals)</span>
            </div>
            {currentPhase === 'foundation' && <div className="text-xs mt-2 italic bg-blue-100 p-2 rounded">🎯 Focus: Perfect form + arm specialization</div>}
            {currentPhase === 'growth' && <div className="text-xs mt-2 italic bg-green-100 p-2 rounded">🎯 Focus: Volume + progressive overload + arm focus</div>}
            {currentPhase === 'intensity' && <div className="text-xs mt-2 italic bg-red-100 p-2 rounded">🎯 Focus: Heavy lifting + advanced arm techniques</div>}
          </div>
        </div>

        {/* 3x/Week Schedule Reminder */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <h3 className="font-bold text-orange-800 text-sm mb-2">Weekly Schedule</h3>
          <div className="text-xs text-orange-700 space-y-1">
            <div className="flex justify-between">
              <span className="font-semibold">Monday:</span>
              <span>Push Day (90 min)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Wednesday:</span>
              <span>Pull + Arms (90 min)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Friday:</span>
              <span>Legs + Cardio + Arms (75 min)</span>
            </div>
            <div className="text-xs mt-2 italic">🔥 Extra arm volume on every session for maximum growth</div>
          </div>
        </div>

        {/* Success Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h3 className="font-bold text-green-800 text-sm mb-2">3x/Week Success Keys</h3>
          <div className="text-xs text-green-700 space-y-1">
            <div>✅ <strong>Perfect Recovery:</strong> 48h between sessions</div>
            <div>✅ <strong>Nutrition Critical:</strong> Hit protein targets daily</div>
            <div>✅ <strong>Progressive Overload:</strong> Track all weights</div>
            <div>✅ <strong>Arm Priority:</strong> Orange-marked exercises = growth</div>
            <div>✅ <strong>Sleep 7-9h:</strong> Recovery is everything</div>
            <div>✅ <strong>Whoop Guidance:</strong> Red days = rest or light</div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* History Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                <h2 className="text-lg font-bold">Session History</h2>
                <span className="text-sm bg-blue-500 px-2 py-1 rounded-full">
                  {completedSessions.length} sessions
                </span>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* History Content */}
            <div className="overflow-y-auto max-h-[75vh] p-4">
              {completedSessions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No completed sessions yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Complete a workout and save it to see your history!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedSessions.map((session) => (
                    <div key={session.id} className="bg-gray-50 rounded-lg p-4 border">
                      {/* Session Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{session.day_name}</h3>
                          <p className="text-sm text-gray-600">
                            {session.session_date} at {session.session_time} • Week {session.week} ({session.phase} phase)
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600">
                            Exercises: {session.exercises_completed}/{session.total_exercises}
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            Nutrition: {session.nutrition_completed}/{session.total_nutrition}
                          </div>
                        </div>
                      </div>

                      {/* Session Details */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Exercises */}
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            💪 Exercises ({session.exercises_completed}/{session.total_exercises})
                          </h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {session.exercises.map((exercise: any, index: number) => (
                              <div key={index} className={`text-xs p-2 rounded ${exercise.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                <div className="flex items-center gap-2">
                                  {exercise.completed ? (
                                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-3 h-3 flex-shrink-0" />
                                  )}
                                  <span className="font-medium">{exercise.name}</span>
                                  {exercise.weight > 0 && (
                                    <span className="ml-auto font-mono">{exercise.weight}kg</span>
                                  )}
                                </div>
                                <div className="text-xs opacity-75 ml-5">{exercise.sets}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Nutrition */}
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            🍎 Nutrition ({session.nutrition_completed}/{session.total_nutrition})
                          </h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {session.nutrition.map((nutrition: any, index: number) => (
                              <div key={index} className={`text-xs p-2 rounded ${nutrition.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                <div className="flex items-center gap-2">
                                  {nutrition.completed ? (
                                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-3 h-3 flex-shrink-0" />
                                  )}
                                  <span className="text-sm">{nutrition.icon}</span>
                                  <span className="font-medium">{nutrition.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History Footer */}
            <div className="bg-gray-50 p-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total sessions: {completedSessions.length}
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingProgram;