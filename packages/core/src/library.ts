/**
 * Curated exercise library used by the program generator.
 * Seeded from the legacy program's lifts plus machine / band / bodyweight options so any
 * equipment setup gets a complete program. In Phase 1 this becomes the `exercise_library` table.
 */
import type { Plane } from "./types";

export const MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "traps", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "calves", "core",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = ["barbell", "dumbbell", "cable", "machine", "pullup_bar", "band"] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: "Barbell", dumbbell: "Dumbbells", cable: "Cables", machine: "Machines", pullup_bar: "Pull-up bar", band: "Bands",
};

/** Body areas a user can flag; exercises list the areas they load heavily. */
export const INJURY_AREAS = ["shoulder", "elbow", "wrist", "lower_back", "knee", "hip", "neck"] as const;
export type InjuryArea = (typeof INJURY_AREAS)[number];

export interface ExerciseDef {
  id: string;
  name: string;
  primary: MuscleGroup;
  /** Groups that get half credit for volume counting. */
  secondary: MuscleGroup[];
  /** Fine-grained muscles for the muscle map (legacy naming). */
  muscles: string[];
  /** All of these are needed. Empty = bodyweight. */
  equipment: Equipment[];
  compound: boolean;
  plane: Plane;
  avoidFor: InjuryArea[];
  /** Tags for specific movements users ask to avoid ("overhead", "behind_neck", "deep_knee_flexion"). */
  tags?: string[];
}

const E = (
  id: string, name: string, primary: MuscleGroup, secondary: MuscleGroup[], muscles: string[],
  equipment: Equipment[], compound: boolean, plane: Plane, avoidFor: InjuryArea[] = [], tags: string[] = [],
): ExerciseDef => ({ id, name, primary, secondary, muscles, equipment, compound, plane, avoidFor, tags });

export const LIBRARY: ExerciseDef[] = [
  // ---- chest
  E("barbell-bench-press", "Barbell Bench Press", "chest", ["triceps", "shoulders"], ["chest", "front_delts", "triceps"], ["barbell"], true, "sagittal", ["shoulder"]),
  E("incline-db-press", "Incline DB Press", "chest", ["triceps", "shoulders"], ["upper_chest", "front_delts", "triceps"], ["dumbbell"], true, "sagittal"),
  E("incline-barbell-press", "Incline Barbell Press", "chest", ["triceps", "shoulders"], ["upper_chest", "front_delts", "triceps"], ["barbell"], true, "sagittal", ["shoulder"]),
  E("db-bench-press", "Dumbbell Bench Press", "chest", ["triceps", "shoulders"], ["chest", "front_delts", "triceps"], ["dumbbell"], true, "sagittal"),
  E("machine-chest-press", "Machine Chest Press", "chest", ["triceps", "shoulders"], ["chest", "front_delts", "triceps"], ["machine"], true, "sagittal"),
  // Needs parallel bars: grouped with the pull-up bar (power towers have both). Add load with a belt when strong enough.
  E("weighted-dips", "Dips", "chest", ["triceps", "shoulders"], ["chest", "triceps", "front_delts"], ["pullup_bar"], true, "sagittal", ["shoulder", "elbow"]),
  E("cable-crossovers", "Cable Crossovers", "chest", [], ["chest"], ["cable"], false, "transverse"),
  E("db-flyes", "Dumbbell Flyes", "chest", [], ["chest"], ["dumbbell"], false, "transverse", ["shoulder"]),
  E("push-ups", "Push-Ups", "chest", ["triceps", "shoulders", "core"], ["chest", "triceps", "front_delts", "core"], [], true, "sagittal", ["wrist"]),
  E("band-chest-press", "Band Chest Press", "chest", ["triceps"], ["chest", "triceps"], ["band"], true, "sagittal"),
  // ---- back
  E("weighted-pull-ups", "Weighted Pull-Ups", "back", ["biceps"], ["lats", "biceps", "rear_delts"], ["pullup_bar"], true, "sagittal", ["shoulder", "elbow"]),
  E("pull-ups", "Pull-Ups", "back", ["biceps"], ["lats", "biceps"], ["pullup_bar"], true, "sagittal", ["shoulder", "elbow"]),
  E("lat-pulldowns", "Lat Pulldowns", "back", ["biceps"], ["lats", "biceps"], ["cable"], true, "sagittal"),
  E("barbell-rows", "Barbell Rows", "back", ["biceps", "traps"], ["back", "lats", "traps", "biceps"], ["barbell"], true, "sagittal", ["lower_back"]),
  E("single-arm-db-row", "Single-Arm DB Row", "back", ["biceps", "core"], ["back", "lats", "traps", "biceps", "core"], ["dumbbell"], true, "multi"),
  E("seated-cable-rows", "Seated Cable Rows", "back", ["biceps", "traps"], ["back", "lats", "traps", "biceps"], ["cable"], true, "sagittal"),
  E("chest-supported-machine-row", "Chest-Supported Machine Row", "back", ["biceps", "traps"], ["back", "lats", "traps", "biceps"], ["machine"], true, "sagittal"),
  E("t-bar-row", "T-Bar Row", "back", ["biceps", "traps"], ["back", "lats", "traps", "biceps", "core"], ["barbell"], true, "multi", ["lower_back"]),
  E("straight-arm-pulldowns", "Straight-Arm Pulldowns", "back", [], ["lats"], ["cable"], false, "sagittal"),
  E("band-rows", "Band Rows", "back", ["biceps"], ["back", "lats", "biceps"], ["band"], true, "sagittal"),
  E("table-rows", "Table Rows", "back", ["biceps"], ["back", "lats", "biceps"], [], true, "sagittal"),
  E("inverted-rows", "Inverted Rows", "back", ["biceps", "core"], ["back", "lats", "biceps", "core"], ["pullup_bar"], true, "sagittal"),
  // ---- shoulders
  E("overhead-press", "Overhead Press", "shoulders", ["triceps", "core"], ["front_delts", "lateral_delts", "triceps"], ["barbell"], true, "sagittal", ["shoulder", "lower_back"], ["overhead", "overhead_barbell"]),
  E("arnold-press", "Arnold Press", "shoulders", ["triceps"], ["front_delts", "lateral_delts", "triceps"], ["dumbbell"], true, "multi", [], ["overhead"]),
  E("landmine-press", "Landmine Press", "shoulders", ["triceps", "chest", "core"], ["front_delts", "lateral_delts", "triceps", "core"], ["barbell"], true, "multi"),
  E("machine-shoulder-press", "Machine Shoulder Press", "shoulders", ["triceps"], ["front_delts", "lateral_delts", "triceps"], ["machine"], true, "sagittal", ["shoulder"], ["overhead"]),
  E("pike-push-ups", "Pike Push-Ups", "shoulders", ["triceps"], ["front_delts", "lateral_delts", "triceps"], [], true, "sagittal", ["shoulder", "wrist"], ["overhead"]),
  E("prone-ytw-raises", "Prone Y-T-W Raises", "shoulders", ["traps"], ["rear_delts", "lateral_delts", "traps"], [], false, "frontal"),
  E("lateral-raises", "Lateral Raises", "shoulders", [], ["lateral_delts"], ["dumbbell"], false, "frontal"),
  E("cable-lateral-raises", "Cable Lateral Raises", "shoulders", [], ["lateral_delts"], ["cable"], false, "frontal"),
  E("band-lateral-raises", "Band Lateral Raises", "shoulders", [], ["lateral_delts"], ["band"], false, "frontal"),
  E("face-pulls", "Face Pulls", "shoulders", ["traps"], ["rear_delts", "traps"], ["cable"], false, "transverse"),
  E("rear-delt-flyes", "Rear Delt Flyes", "shoulders", [], ["rear_delts"], ["dumbbell"], false, "transverse"),
  E("band-pull-aparts", "Band Pull-Aparts", "shoulders", ["traps"], ["rear_delts", "traps"], ["band"], false, "transverse"),
  // ---- traps
  E("barbell-shrugs", "Barbell Shrugs", "traps", [], ["traps"], ["barbell"], false, "sagittal", ["neck"]),
  E("db-shrugs", "DB Shrugs", "traps", [], ["traps"], ["dumbbell"], false, "sagittal", ["neck"]),
  E("farmers-walks", "Farmer's Walks", "traps", ["core"], ["traps", "forearms", "core"], ["dumbbell"], true, "sagittal", [], ["carry"]),
  // ---- biceps
  E("barbell-curls", "Barbell Curls", "biceps", [], ["biceps"], ["barbell"], false, "sagittal", ["elbow", "wrist"]),
  E("incline-db-curls", "Incline DB Curls", "biceps", [], ["biceps"], ["dumbbell"], false, "sagittal", ["elbow"]),
  E("hammer-curls", "Hammer Curls", "biceps", [], ["biceps", "forearms"], ["dumbbell"], false, "sagittal"),
  E("cable-curls", "Cable Curls", "biceps", [], ["biceps"], ["cable"], false, "sagittal"),
  E("band-curls", "Band Curls", "biceps", [], ["biceps"], ["band"], false, "sagittal"),
  E("chin-ups", "Chin-Ups", "biceps", ["back"], ["biceps", "lats"], ["pullup_bar"], true, "sagittal", ["elbow", "shoulder"]),
  // ---- triceps
  E("close-grip-bench", "Close-Grip Bench", "triceps", ["chest"], ["triceps", "chest"], ["barbell"], true, "sagittal", ["wrist", "elbow"]),
  E("overhead-cable-extension", "Overhead Cable Extension", "triceps", [], ["triceps"], ["cable"], false, "sagittal", ["elbow"], ["overhead"]),
  E("cable-pushdowns", "Cable Pushdowns", "triceps", [], ["triceps"], ["cable"], false, "sagittal"),
  E("overhead-db-extension", "Overhead DB Extension", "triceps", [], ["triceps"], ["dumbbell"], false, "sagittal", ["elbow", "shoulder"], ["overhead"]),
  E("band-pushdowns", "Band Pushdowns", "triceps", [], ["triceps"], ["band"], false, "sagittal"),
  E("diamond-push-ups", "Diamond Push-Ups", "triceps", ["chest"], ["triceps", "chest", "core"], [], true, "sagittal", ["wrist", "elbow"]),
  // ---- quads
  E("back-squats", "Back Squats", "quads", ["glutes", "hamstrings", "core"], ["quads", "glutes", "hamstrings", "core"], ["barbell"], true, "sagittal", ["knee", "lower_back"], ["deep_knee_flexion"]),
  E("front-squats", "Front Squats", "quads", ["glutes", "core"], ["quads", "core"], ["barbell"], true, "sagittal", ["knee", "wrist"], ["deep_knee_flexion"]),
  E("goblet-squats", "Goblet Squats", "quads", ["glutes", "core"], ["quads", "glutes", "core"], ["dumbbell"], true, "sagittal", ["knee"]),
  E("leg-press", "Leg Press", "quads", ["glutes"], ["quads", "glutes"], ["machine"], true, "sagittal"),
  E("hack-squats", "Hack Squats", "quads", ["glutes"], ["quads"], ["machine"], true, "sagittal", ["knee"]),
  E("bulgarian-split-squats", "Bulgarian Split Squats", "quads", ["glutes"], ["quads", "glutes", "core"], ["dumbbell"], true, "sagittal", ["knee"]),
  E("walking-lunges", "Walking Lunges", "quads", ["glutes", "hamstrings"], ["quads", "glutes", "hamstrings"], ["dumbbell"], true, "sagittal", ["knee"]),
  E("leg-extensions", "Leg Extensions", "quads", [], ["quads"], ["machine"], false, "sagittal", ["knee"]),
  E("bodyweight-split-squats", "Split Squats", "quads", ["glutes"], ["quads", "glutes"], [], true, "sagittal", ["knee"]),
  // ---- hamstrings / glutes
  E("romanian-deadlifts", "Romanian Deadlifts", "hamstrings", ["glutes", "back"], ["hamstrings", "glutes", "erectors"], ["barbell"], true, "sagittal", ["lower_back"]),
  E("db-romanian-deadlifts", "DB Romanian Deadlifts", "hamstrings", ["glutes"], ["hamstrings", "glutes", "erectors"], ["dumbbell"], true, "sagittal", ["lower_back"]),
  E("lying-leg-curls", "Lying Leg Curls", "hamstrings", [], ["hamstrings"], ["machine"], false, "sagittal"),
  E("nordic-curls", "Nordic Curls", "hamstrings", [], ["hamstrings"], [], false, "sagittal", ["knee"]),
  E("band-leg-curls", "Band Leg Curls", "hamstrings", [], ["hamstrings"], ["band"], false, "sagittal"),
  E("deadlift", "Deadlift", "hamstrings", ["back", "glutes", "traps"], ["back", "lats", "traps", "hamstrings", "glutes", "erectors"], ["barbell"], true, "sagittal", ["lower_back"]),
  E("hip-thrusts", "Hip Thrusts", "glutes", ["hamstrings"], ["glutes", "hamstrings"], ["barbell"], true, "sagittal", ["hip"]),
  E("db-hip-thrusts", "DB Hip Thrusts", "glutes", ["hamstrings"], ["glutes", "hamstrings"], ["dumbbell"], true, "sagittal", ["hip"]),
  E("glute-bridges", "Glute Bridges", "glutes", ["hamstrings"], ["glutes", "hamstrings"], [], false, "sagittal"),
  E("cable-pull-throughs", "Cable Pull-Throughs", "glutes", ["hamstrings"], ["glutes", "hamstrings"], ["cable"], false, "sagittal"),
  // ---- calves
  E("standing-calf-raises", "Standing Calf Raises", "calves", [], ["calves"], ["machine"], false, "sagittal"),
  E("seated-calf-raises", "Seated Calf Raises", "calves", [], ["calves"], ["machine"], false, "sagittal"),
  E("single-leg-calf-raises", "Single-Leg Calf Raises", "calves", [], ["calves", "core"], [], false, "sagittal"),
  E("db-calf-raises", "DB Calf Raises", "calves", [], ["calves"], ["dumbbell"], false, "sagittal"),
  // ---- core
  E("hanging-leg-raises", "Hanging Leg Raises", "core", [], ["core"], ["pullup_bar"], false, "sagittal", ["shoulder"]),
  E("cable-crunches", "Cable Crunches", "core", [], ["core"], ["cable"], false, "sagittal", ["lower_back"]),
  E("pallof-press", "Pallof Press", "core", [], ["core"], ["cable"], false, "transverse"),
  E("band-pallof-press", "Band Pallof Press", "core", [], ["core"], ["band"], false, "transverse"),
  E("plank", "Plank", "core", [], ["core"], [], false, "sagittal"),
  E("dead-bug", "Dead Bug", "core", [], ["core"], [], false, "sagittal"),
];

export const LIBRARY_BY_ID = new Map(LIBRARY.map((e) => [e.id, e]));

export const GROUP_LABEL: Record<MuscleGroup, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", traps: "Traps", biceps: "Biceps", triceps: "Triceps",
  quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves", core: "Core",
};

export interface ExerciseFilter {
  equipment: Equipment[];
  injuries: InjuryArea[];
  avoidTags: string[];
  avoidIds: string[];
}

export function isAllowed(e: ExerciseDef, f: ExerciseFilter): boolean {
  if (f.avoidIds.includes(e.id)) return false;
  if (!e.equipment.every((q) => f.equipment.includes(q))) return false;
  if (e.avoidFor.some((a) => f.injuries.includes(a))) return false;
  if ((e.tags ?? []).some((t) => f.avoidTags.includes(t))) return false;
  return true;
}

/**
 * Turns free text like "Left shoulder: no behind-the-neck pressing" into structured limits.
 * Deliberately conservative: anything that matches an area excludes lifts that load it.
 */
export function parseLimitations(text: string): { injuries: InjuryArea[]; avoidTags: string[]; avoidIds: string[] } {
  const t = text.toLowerCase();
  const injuries = new Set<InjuryArea>();
  const avoidTags = new Set<string>();
  const rules: [RegExp, InjuryArea][] = [
    [/shoulder|rotator|labrum/, "shoulder"], [/elbow|tennis|golfer/, "elbow"], [/wrist/, "wrist"],
    [/lower back|low back|lumbar|disc|sciatica/, "lower_back"], [/knee|acl|menisc|patell/, "knee"],
    [/\bhip\b|hips/, "hip"], [/neck|cervical/, "neck"],
  ];
  for (const [re, area] of rules) if (re.test(t)) injuries.add(area);
  if (/overhead/.test(t)) avoidTags.add("overhead");
  if (/behind[- ]the[- ]neck/.test(t)) avoidTags.add("behind_neck");
  if (/deep squat|knee flexion/.test(t)) avoidTags.add("deep_knee_flexion");
  const avoidIds = LIBRARY.filter((e) => {
    const n = e.name.toLowerCase();
    return t.includes(`no ${n}`) || t.includes(`avoid ${n}`) || t.includes(`no ${n.replace(/s$/, "")}`);
  }).map((e) => e.id);

  // A specific restriction ("no behind-the-neck pressing") narrows the exclusion to those
  // movements; the shoulder additionally loses heavy overhead barbell work. A bare area
  // ("bad knee") excludes every lift that loads that area.
  if (avoidTags.size > 0 || avoidIds.length > 0) {
    if (injuries.has("shoulder")) avoidTags.add("overhead_barbell");
    return { injuries: [], avoidTags: [...avoidTags], avoidIds };
  }
  return { injuries: [...injuries], avoidTags: [...avoidTags], avoidIds };
}
