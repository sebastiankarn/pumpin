export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  video_url: string | null;
  created_by: string | null;
  is_global: boolean;
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
}

export interface UserProfile {
  id: string;
  active_template_id: string | null;
  current_day_index: number;
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
