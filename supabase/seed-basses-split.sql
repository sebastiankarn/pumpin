-- ============================================
-- Basses 5-Day Split (Public Template)
-- Run this in your Supabase SQL Editor
-- ============================================

-- Use the current logged-in user as owner, or replace with your user ID
-- e.g.: SET local app.current_user_id = 'your-uuid-here';

DO $$
DECLARE
  v_user_id uuid;
  v_template_id uuid;
  v_day_id uuid;
  -- Exercise IDs
  e_incline_db_press uuid;
  e_cable_row uuid;
  e_cable_lateral_raise uuid;
  e_back_extension uuid;
  e_ez_curl uuid;
  e_ez_skull_crusher uuid;
  e_power_clean uuid;
  e_bulgarian_split_squat uuid;
  e_rdl uuid;
  e_hip_abduction uuid;
  e_leg_press_calf uuid;
  e_hanging_leg_raise uuid;
  e_weighted_dips uuid;
  e_seated_db_shoulder_press uuid;
  e_cable_chest_fly uuid;
  e_db_lateral_raise uuid;
  e_cable_pressdown uuid;
  e_weighted_pullups uuid;
  e_machine_rear_delt_fly uuid;
  e_seated_cable_row uuid;
  e_seated_incline_hammer_curl uuid;
  e_deep_back_squats uuid;
  e_nordic_ham_curls uuid;
  e_leg_press_calf_bent uuid;
  e_hip_adduction uuid;
  e_cable_crunch uuid;
  e_max_effort_jumps uuid;
BEGIN
  -- Get your user ID (the one running this script)
  SELECT auth.uid() INTO v_user_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to run this script. Use the Supabase SQL Editor while authenticated, or replace auth.uid() with your user UUID.';
  END IF;

  -- ==========================================
  -- INSERT GLOBAL EXERCISES (skip if exists)
  -- ==========================================

  INSERT INTO exercises (id, name, muscle_group, equipment, is_global, created_by)
  VALUES
    (uuid_generate_v4(), 'Incline Dumbbell Press', 'Chest', 'Dumbbells', true, v_user_id),
    (uuid_generate_v4(), 'Cable Row', 'Back', 'Cable', true, v_user_id),
    (uuid_generate_v4(), 'Cable Lateral Raise', 'Shoulders', 'Cable', true, v_user_id),
    (uuid_generate_v4(), 'Back Extension', 'Back', 'Bodyweight', true, v_user_id),
    (uuid_generate_v4(), 'EZ Bar Curl', 'Biceps', 'EZ Bar', true, v_user_id),
    (uuid_generate_v4(), 'EZ Bar Skull Crusher', 'Triceps', 'EZ Bar', true, v_user_id),
    (uuid_generate_v4(), 'Power Clean', 'Legs', 'Barbell', true, v_user_id),
    (uuid_generate_v4(), 'Bulgarian Split Squats', 'Quads', 'Dumbbells', true, v_user_id),
    (uuid_generate_v4(), 'Romanian Deadlift', 'Hamstrings', 'Barbell', true, v_user_id),
    (uuid_generate_v4(), 'Hip Abduction', 'Glutes', 'Machine', true, v_user_id),
    (uuid_generate_v4(), 'Leg Press Calf Raise', 'Calves', 'Machine', true, v_user_id),
    (uuid_generate_v4(), 'Hanging Leg Raise', 'Abs', 'Bodyweight', true, v_user_id),
    (uuid_generate_v4(), 'Weighted Dips', 'Chest', 'Weighted', true, v_user_id),
    (uuid_generate_v4(), 'Seated Dumbbell Shoulder Press', 'Shoulders', 'Dumbbells', true, v_user_id),
    (uuid_generate_v4(), 'Cable Chest Fly', 'Chest', 'Cable', true, v_user_id),
    (uuid_generate_v4(), 'Dumbbell Lateral Raise', 'Shoulders', 'Dumbbells', true, v_user_id),
    (uuid_generate_v4(), 'Cable Press Down', 'Triceps', 'Cable', true, v_user_id),
    (uuid_generate_v4(), 'Weighted Pull-Ups', 'Back', 'Weighted', true, v_user_id),
    (uuid_generate_v4(), 'Machine Rear Delt Fly', 'Shoulders', 'Machine', true, v_user_id),
    (uuid_generate_v4(), 'Seated One Arm Cable Row', 'Back', 'Cable', true, v_user_id),
    (uuid_generate_v4(), 'Seated Incline Hammer Curl', 'Biceps', 'Dumbbells', true, v_user_id),
    (uuid_generate_v4(), 'Deep Back Squats', 'Quads', 'Barbell', true, v_user_id),
    (uuid_generate_v4(), 'Nordic Ham Curls', 'Hamstrings', 'Bodyweight', true, v_user_id),
    (uuid_generate_v4(), 'Leg Press Calf Raise Bent Knee', 'Calves', 'Machine', true, v_user_id),
    (uuid_generate_v4(), 'Hip Adduction', 'Glutes', 'Machine', true, v_user_id),
    (uuid_generate_v4(), 'Cable Crunch', 'Abs', 'Cable', true, v_user_id),
    (uuid_generate_v4(), 'Max Effort Jumps', 'Legs', 'Bodyweight', true, v_user_id)
  ON CONFLICT DO NOTHING;

  -- Look up exercise IDs by name
  SELECT id INTO e_incline_db_press FROM exercises WHERE name = 'Incline Dumbbell Press' AND is_global = true LIMIT 1;
  SELECT id INTO e_cable_row FROM exercises WHERE name = 'Cable Row' AND is_global = true LIMIT 1;
  SELECT id INTO e_cable_lateral_raise FROM exercises WHERE name = 'Cable Lateral Raise' AND is_global = true LIMIT 1;
  SELECT id INTO e_back_extension FROM exercises WHERE name = 'Back Extension' AND is_global = true LIMIT 1;
  SELECT id INTO e_ez_curl FROM exercises WHERE name = 'EZ Bar Curl' AND is_global = true LIMIT 1;
  SELECT id INTO e_ez_skull_crusher FROM exercises WHERE name = 'EZ Bar Skull Crusher' AND is_global = true LIMIT 1;
  SELECT id INTO e_power_clean FROM exercises WHERE name = 'Power Clean' AND is_global = true LIMIT 1;
  SELECT id INTO e_bulgarian_split_squat FROM exercises WHERE name = 'Bulgarian Split Squats' AND is_global = true LIMIT 1;
  SELECT id INTO e_rdl FROM exercises WHERE name = 'Romanian Deadlift' AND is_global = true LIMIT 1;
  SELECT id INTO e_hip_abduction FROM exercises WHERE name = 'Hip Abduction' AND is_global = true LIMIT 1;
  SELECT id INTO e_leg_press_calf FROM exercises WHERE name = 'Leg Press Calf Raise' AND is_global = true LIMIT 1;
  SELECT id INTO e_hanging_leg_raise FROM exercises WHERE name = 'Hanging Leg Raise' AND is_global = true LIMIT 1;
  SELECT id INTO e_weighted_dips FROM exercises WHERE name = 'Weighted Dips' AND is_global = true LIMIT 1;
  SELECT id INTO e_seated_db_shoulder_press FROM exercises WHERE name = 'Seated Dumbbell Shoulder Press' AND is_global = true LIMIT 1;
  SELECT id INTO e_cable_chest_fly FROM exercises WHERE name = 'Cable Chest Fly' AND is_global = true LIMIT 1;
  SELECT id INTO e_db_lateral_raise FROM exercises WHERE name = 'Dumbbell Lateral Raise' AND is_global = true LIMIT 1;
  SELECT id INTO e_cable_pressdown FROM exercises WHERE name = 'Cable Press Down' AND is_global = true LIMIT 1;
  SELECT id INTO e_weighted_pullups FROM exercises WHERE name = 'Weighted Pull-Ups' AND is_global = true LIMIT 1;
  SELECT id INTO e_machine_rear_delt_fly FROM exercises WHERE name = 'Machine Rear Delt Fly' AND is_global = true LIMIT 1;
  SELECT id INTO e_seated_cable_row FROM exercises WHERE name = 'Seated One Arm Cable Row' AND is_global = true LIMIT 1;
  SELECT id INTO e_seated_incline_hammer_curl FROM exercises WHERE name = 'Seated Incline Hammer Curl' AND is_global = true LIMIT 1;
  SELECT id INTO e_deep_back_squats FROM exercises WHERE name = 'Deep Back Squats' AND is_global = true LIMIT 1;
  SELECT id INTO e_nordic_ham_curls FROM exercises WHERE name = 'Nordic Ham Curls' AND is_global = true LIMIT 1;
  SELECT id INTO e_leg_press_calf_bent FROM exercises WHERE name = 'Leg Press Calf Raise Bent Knee' AND is_global = true LIMIT 1;
  SELECT id INTO e_hip_adduction FROM exercises WHERE name = 'Hip Adduction' AND is_global = true LIMIT 1;
  SELECT id INTO e_cable_crunch FROM exercises WHERE name = 'Cable Crunch' AND is_global = true LIMIT 1;
  SELECT id INTO e_max_effort_jumps FROM exercises WHERE name = 'Max Effort Jumps' AND is_global = true LIMIT 1;

  -- ==========================================
  -- CREATE TEMPLATE (public)
  -- ==========================================
  v_template_id := uuid_generate_v4();
  INSERT INTO templates (id, name, created_by, is_public)
  VALUES (v_template_id, 'Basses 5-Day Split', v_user_id, true);

  -- ==========================================
  -- DAY 1: Upper
  -- ==========================================
  v_day_id := uuid_generate_v4();
  INSERT INTO template_days (id, template_id, day_index, name)
  VALUES (v_day_id, v_template_id, 0, 'Upper');

  INSERT INTO template_day_exercises (template_day_id, exercise_id, order_index, default_sets, default_reps) VALUES
    (v_day_id, e_incline_db_press,    0, 4, 8),
    (v_day_id, e_cable_row,           1, 4, 10),
    (v_day_id, e_cable_lateral_raise, 2, 3, 15),
    (v_day_id, e_back_extension,      3, 3, 12),
    (v_day_id, e_ez_curl,             4, 3, 10),
    (v_day_id, e_ez_skull_crusher,    5, 3, 10);

  -- ==========================================
  -- DAY 2: Lower
  -- ==========================================
  v_day_id := uuid_generate_v4();
  INSERT INTO template_days (id, template_id, day_index, name)
  VALUES (v_day_id, v_template_id, 1, 'Lower');

  INSERT INTO template_day_exercises (template_day_id, exercise_id, order_index, default_sets, default_reps) VALUES
    (v_day_id, e_power_clean,            0, 5, 3),
    (v_day_id, e_bulgarian_split_squat,  1, 3, 10),
    (v_day_id, e_rdl,                    2, 4, 8),
    (v_day_id, e_hip_abduction,          3, 3, 15),
    (v_day_id, e_leg_press_calf,         4, 4, 15),
    (v_day_id, e_hanging_leg_raise,      5, 3, 12);

  -- ==========================================
  -- DAY 3: Push
  -- ==========================================
  v_day_id := uuid_generate_v4();
  INSERT INTO template_days (id, template_id, day_index, name)
  VALUES (v_day_id, v_template_id, 2, 'Push');

  INSERT INTO template_day_exercises (template_day_id, exercise_id, order_index, default_sets, default_reps) VALUES
    (v_day_id, e_weighted_dips,             0, 4, 8),
    (v_day_id, e_seated_db_shoulder_press,  1, 4, 8),
    (v_day_id, e_cable_chest_fly,           2, 3, 12),
    (v_day_id, e_db_lateral_raise,          3, 3, 15),
    (v_day_id, e_cable_pressdown,           4, 3, 12);

  -- ==========================================
  -- DAY 4: Pull
  -- ==========================================
  v_day_id := uuid_generate_v4();
  INSERT INTO template_days (id, template_id, day_index, name)
  VALUES (v_day_id, v_template_id, 3, 'Pull');

  INSERT INTO template_day_exercises (template_day_id, exercise_id, order_index, default_sets, default_reps) VALUES
    (v_day_id, e_weighted_pullups,              0, 4, 6),
    (v_day_id, e_machine_rear_delt_fly,         1, 3, 15),
    (v_day_id, e_seated_cable_row,              2, 4, 10),
    (v_day_id, e_seated_incline_hammer_curl,    3, 3, 10);

  -- ==========================================
  -- DAY 5: Legs
  -- ==========================================
  v_day_id := uuid_generate_v4();
  INSERT INTO template_days (id, template_id, day_index, name)
  VALUES (v_day_id, v_template_id, 4, 'Legs');

  INSERT INTO template_day_exercises (template_day_id, exercise_id, order_index, default_sets, default_reps) VALUES
    (v_day_id, e_max_effort_jumps,      0, 3, 5),
    (v_day_id, e_deep_back_squats,      1, 5, 5),
    (v_day_id, e_nordic_ham_curls,      2, 3, 8),
    (v_day_id, e_leg_press_calf_bent,   3, 4, 15),
    (v_day_id, e_hip_adduction,         4, 3, 15),
    (v_day_id, e_cable_crunch,          5, 3, 15);

  RAISE NOTICE 'Basses 5-Day Split created successfully!';
END $$;
