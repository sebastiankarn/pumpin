-- ============================================
-- GymTrack Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Global exercise library
create table exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  muscle_group text not null,
  equipment text,
  exercise_type text not null default 'strength',
  created_by uuid references auth.users(id),
  is_global boolean default false,
  created_at timestamptz default now()
);

-- Workout templates (e.g. "Upper Lower PPL")
create table templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid not null references auth.users(id),
  is_public boolean default false,
  created_at timestamptz default now()
);

-- Days within a template
create table template_days (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references templates(id) on delete cascade,
  day_index integer not null,
  name text not null
);

-- Default exercises for each template day
create table template_day_exercises (
  id uuid primary key default uuid_generate_v4(),
  template_day_id uuid not null references template_days(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  order_index integer not null,
  default_sets integer,
  default_reps integer,
  default_rpe numeric,
  default_rest_seconds integer
);

-- User profile & schedule state
create table user_profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  active_template_id uuid references templates(id),
  current_day_index integer default 0,
  dashboard_widgets jsonb,
  weight_unit text,
  created_at timestamptz default now()
);

-- Logged workout sessions
create table workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  template_day_id uuid not null references template_days(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_minutes integer,
  notes text
);

-- Exercises performed in a session
create table session_exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  order_index integer not null,
  swapped_from_exercise_id uuid references exercises(id)
);

-- Individual sets within a session exercise
create table session_sets (
  id uuid primary key default uuid_generate_v4(),
  session_exercise_id uuid not null references session_exercises(id) on delete cascade,
  set_index integer not null,
  weight numeric,
  reps integer,
  rpe numeric,
  rest_seconds integer,
  notes text,
  -- Cardio fields
  duration_seconds integer,
  distance_km numeric,
  calories integer,
  avg_heart_rate integer
);

-- Body weight log
create table body_weight_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  weight numeric not null,
  unit text not null,
  logged_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_workout_sessions_user on workout_sessions(user_id, started_at desc);
create index idx_workout_sessions_template_day on workout_sessions(template_day_id);
create index idx_session_exercises_session on session_exercises(session_id);
create index idx_session_sets_exercise on session_sets(session_exercise_id);
create index idx_template_days_template on template_days(template_id);
create index idx_body_weight_logs_user on body_weight_logs(user_id, logged_at desc);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table exercises enable row level security;
alter table templates enable row level security;
alter table template_days enable row level security;
alter table template_day_exercises enable row level security;
alter table user_profiles enable row level security;
alter table workout_sessions enable row level security;
alter table session_exercises enable row level security;
alter table session_sets enable row level security;
alter table body_weight_logs enable row level security;

-- Exercises: anyone can read, authenticated users can insert
create policy "Exercises are viewable by everyone"
  on exercises for select using (true);

create policy "Authenticated users can insert exercises"
  on exercises for insert with check (auth.uid() is not null);

create policy "Users can update own exercises"
  on exercises for update using (created_by = auth.uid());

create policy "Users can delete own exercises"
  on exercises for delete using (created_by = auth.uid());

-- Templates: see own + public templates
create policy "Users can view own and public templates"
  on templates for select using (
    created_by = auth.uid() or is_public = true
  );

create policy "Users can create templates"
  on templates for insert with check (created_by = auth.uid());

create policy "Users can update own templates"
  on templates for update using (created_by = auth.uid());

create policy "Users can delete own templates"
  on templates for delete using (created_by = auth.uid());

-- Template days: follow template visibility
create policy "Template days follow template access"
  on template_days for select using (
    exists (
      select 1 from templates
      where templates.id = template_days.template_id
      and (templates.created_by = auth.uid() or templates.is_public = true)
    )
  );

create policy "Users can manage template days for own templates"
  on template_days for insert with check (
    exists (
      select 1 from templates
      where templates.id = template_days.template_id
      and templates.created_by = auth.uid()
    )
  );

create policy "Users can update template days for own templates"
  on template_days for update using (
    exists (
      select 1 from templates
      where templates.id = template_days.template_id
      and templates.created_by = auth.uid()
    )
  );

create policy "Users can delete template days for own templates"
  on template_days for delete using (
    exists (
      select 1 from templates
      where templates.id = template_days.template_id
      and templates.created_by = auth.uid()
    )
  );

-- Template day exercises: follow template visibility
create policy "Template day exercises follow template access"
  on template_day_exercises for select using (
    exists (
      select 1 from template_days
      join templates on templates.id = template_days.template_id
      where template_days.id = template_day_exercises.template_day_id
      and (templates.created_by = auth.uid() or templates.is_public = true)
    )
  );

create policy "Users can manage template day exercises"
  on template_day_exercises for insert with check (
    exists (
      select 1 from template_days
      join templates on templates.id = template_days.template_id
      where template_days.id = template_day_exercises.template_day_id
      and templates.created_by = auth.uid()
    )
  );

create policy "Users can update template day exercises"
  on template_day_exercises for update using (
    exists (
      select 1 from template_days
      join templates on templates.id = template_days.template_id
      where template_days.id = template_day_exercises.template_day_id
      and templates.created_by = auth.uid()
    )
  );

create policy "Users can delete template day exercises"
  on template_day_exercises for delete using (
    exists (
      select 1 from template_days
      join templates on templates.id = template_days.template_id
      where template_days.id = template_day_exercises.template_day_id
      and templates.created_by = auth.uid()
    )
  );

-- User profiles: own data only
create policy "Users can view own profile"
  on user_profiles for select using (id = auth.uid());

create policy "Users can insert own profile"
  on user_profiles for insert with check (id = auth.uid());

create policy "Users can update own profile"
  on user_profiles for update using (id = auth.uid());

-- Workout sessions: own data only
create policy "Users can view own sessions"
  on workout_sessions for select using (user_id = auth.uid());

create policy "Users can create own sessions"
  on workout_sessions for insert with check (user_id = auth.uid());

create policy "Users can update own sessions"
  on workout_sessions for update using (user_id = auth.uid());

-- Session exercises: follow session ownership
create policy "Users can view own session exercises"
  on session_exercises for select using (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = session_exercises.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can manage own session exercises"
  on session_exercises for insert with check (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = session_exercises.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update own session exercises"
  on session_exercises for update using (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = session_exercises.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can delete own session exercises"
  on session_exercises for delete using (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = session_exercises.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

-- Session sets: follow session ownership
create policy "Users can view own session sets"
  on session_sets for select using (
    exists (
      select 1 from session_exercises
      join workout_sessions on workout_sessions.id = session_exercises.session_id
      where session_exercises.id = session_sets.session_exercise_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can manage own session sets"
  on session_sets for insert with check (
    exists (
      select 1 from session_exercises
      join workout_sessions on workout_sessions.id = session_exercises.session_id
      where session_exercises.id = session_sets.session_exercise_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update own session sets"
  on session_sets for update using (
    exists (
      select 1 from session_exercises
      join workout_sessions on workout_sessions.id = session_exercises.session_id
      where session_exercises.id = session_sets.session_exercise_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "Users can delete own session sets"
  on session_sets for delete using (
    exists (
      select 1 from session_exercises
      join workout_sessions on workout_sessions.id = session_exercises.session_id
      where session_exercises.id = session_sets.session_exercise_id
      and workout_sessions.user_id = auth.uid()
    )
  );

-- Body weight logs: own data only
create policy "Users can view own body weight logs"
  on body_weight_logs for select using (user_id = auth.uid());

create policy "Users can insert own body weight logs"
  on body_weight_logs for insert with check (user_id = auth.uid());

create policy "Users can delete own body weight logs"
  on body_weight_logs for delete using (user_id = auth.uid());

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, current_day_index)
  values (new.id, 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- SEED: EXERCISE LIBRARY
-- ============================================

insert into exercises (name, muscle_group, equipment, is_global) values
  -- Chest
  ('Barbell Bench Press', 'Chest', 'Barbell', true),
  ('Incline Dumbbell Press', 'Chest', 'Dumbbells', true),
  ('Dumbbell Flyes', 'Chest', 'Dumbbells', true),
  ('Cable Crossover', 'Chest', 'Cable', true),
  ('Push-Ups', 'Chest', 'Bodyweight', true),
  ('Incline Barbell Press', 'Chest', 'Barbell', true),
  ('Machine Chest Press', 'Chest', 'Machine', true),
  ('Decline Bench Press', 'Chest', 'Barbell', true),

  -- Back
  ('Barbell Row', 'Back', 'Barbell', true),
  ('Pull-Ups', 'Back', 'Bodyweight', true),
  ('Lat Pulldown', 'Back', 'Cable', true),
  ('Seated Cable Row', 'Back', 'Cable', true),
  ('Dumbbell Row', 'Back', 'Dumbbells', true),
  ('T-Bar Row', 'Back', 'Barbell', true),
  ('Face Pulls', 'Back', 'Cable', true),
  ('Deadlift', 'Back', 'Barbell', true),

  -- Shoulders
  ('Overhead Press', 'Shoulders', 'Barbell', true),
  ('Lateral Raises', 'Shoulders', 'Dumbbells', true),
  ('Front Raises', 'Shoulders', 'Dumbbells', true),
  ('Rear Delt Flyes', 'Shoulders', 'Dumbbells', true),
  ('Arnold Press', 'Shoulders', 'Dumbbells', true),
  ('Dumbbell Shoulder Press', 'Shoulders', 'Dumbbells', true),
  ('Cable Lateral Raise', 'Shoulders', 'Cable', true),
  ('Upright Row', 'Shoulders', 'Barbell', true),

  -- Biceps
  ('Barbell Curl', 'Biceps', 'Barbell', true),
  ('Dumbbell Curl', 'Biceps', 'Dumbbells', true),
  ('Hammer Curl', 'Biceps', 'Dumbbells', true),
  ('Preacher Curl', 'Biceps', 'Barbell', true),
  ('Cable Curl', 'Biceps', 'Cable', true),
  ('Incline Dumbbell Curl', 'Biceps', 'Dumbbells', true),

  -- Triceps
  ('Tricep Pushdown', 'Triceps', 'Cable', true),
  ('Overhead Tricep Extension', 'Triceps', 'Dumbbells', true),
  ('Skull Crushers', 'Triceps', 'Barbell', true),
  ('Dips', 'Triceps', 'Bodyweight', true),
  ('Close Grip Bench Press', 'Triceps', 'Barbell', true),
  ('Cable Overhead Extension', 'Triceps', 'Cable', true),

  -- Quadriceps
  ('Barbell Squat', 'Quadriceps', 'Barbell', true),
  ('Leg Press', 'Quadriceps', 'Machine', true),
  ('Leg Extension', 'Quadriceps', 'Machine', true),
  ('Front Squat', 'Quadriceps', 'Barbell', true),
  ('Bulgarian Split Squat', 'Quadriceps', 'Dumbbells', true),
  ('Hack Squat', 'Quadriceps', 'Machine', true),
  ('Goblet Squat', 'Quadriceps', 'Dumbbells', true),

  -- Hamstrings
  ('Romanian Deadlift', 'Hamstrings', 'Barbell', true),
  ('Leg Curl', 'Hamstrings', 'Machine', true),
  ('Stiff-Leg Deadlift', 'Hamstrings', 'Barbell', true),
  ('Nordic Curl', 'Hamstrings', 'Bodyweight', true),
  ('Glute-Ham Raise', 'Hamstrings', 'Machine', true),

  -- Glutes
  ('Hip Thrust', 'Glutes', 'Barbell', true),
  ('Cable Pull-Through', 'Glutes', 'Cable', true),
  ('Glute Bridge', 'Glutes', 'Barbell', true),
  ('Sumo Deadlift', 'Glutes', 'Barbell', true),

  -- Calves
  ('Standing Calf Raise', 'Calves', 'Machine', true),
  ('Seated Calf Raise', 'Calves', 'Machine', true),

  -- Core
  ('Plank', 'Core', 'Bodyweight', true),
  ('Hanging Leg Raise', 'Core', 'Bodyweight', true),
  ('Cable Crunch', 'Core', 'Cable', true),
  ('Ab Wheel Rollout', 'Core', 'Ab Wheel', true),
  ('Russian Twist', 'Core', 'Bodyweight', true);
