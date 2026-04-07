export type ExerciseType = "strength" | "cardio";

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  video_url: string | null;
  created_by: string | null;
  is_global: boolean;
  exercise_type: ExerciseType;
}

export interface Template {
  id: string;
  name: string;
  created_by: string;
  is_public: boolean;
}

export interface TemplateDay {
  id: string;
  template_id: string;
  day_index: number;
  name: string;
}

export interface TemplateDayExercise {
  id: string;
  template_day_id: string;
  exercise_id: string;
  order_index: number;
  default_sets: number | null;
  default_reps: number | null;
  default_rpe: number | null;
  default_rest_seconds: number | null;
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  template_day_id: string;
  started_at: string;
  finished_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  name: string | null;
  template_day?: TemplateDay;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  order_index: number;
  swapped_from_exercise_id: string | null;
  exercise?: Exercise;
  sets?: SessionSet[];
}

export interface SessionSet {
  id: string;
  session_exercise_id: string;
  set_index: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  rest_seconds: number | null;
  notes: string | null;
  // Cardio fields
  duration_seconds: number | null;
  distance_km: number | null;
  calories: number | null;
  avg_heart_rate: number | null;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  active_template_id: string | null;
  current_day_index: number;
  dashboard_widgets: DashboardWidget[] | null;
  weight_unit: "kg" | "lbs" | null;
}

// For offline sync
export interface PendingChange {
  id: string;
  table: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  data: Record<string, unknown>;
  created_at: string;
}

// Stats
export interface WorkoutStats {
  totalWorkouts: number;
  totalMinutes: number;
  workoutsThisMonth: number;
  minutesThisMonth: number;
  workoutsThisWeek: number;
  currentStreak: number;
}

export interface VolumeDataPoint {
  date: string;
  volume: number;
  minutes: number;
}

export interface VolumeByCategory {
  push: number;
  pull: number;
  legs: number;
  other: number;
}

export type DashboardWidget = "stats" | "volume" | "chart" | "recentWorkouts" | "bodyWeight";

export interface BodyWeightLog {
  id: string;
  user_id: string;
  weight: number;
  unit: "kg" | "lbs";
  logged_at: string;
}
