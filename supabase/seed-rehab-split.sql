-- ============================================
-- Rehab 2-Day Split (Public Template)
-- Run this in your Supabase SQL Editor
-- ============================================

DO $$
DECLARE
  v_user_id uuid;
  v_template_id uuid;
  v_day_id uuid;
  -- Exercise IDs
  e_fetch_towel uuid;
  e_alternate_toe_raises uuid;
  e_calf_stretch_straight uuid;
  e_bent_knee_calf_stretch uuid;
  e_90_90_rotations uuid;
  e_asian_squat_hold uuid;
  e_couch_stretch uuid;
  e_glute_bridge uuid;
  e_side_lying_leg_raises uuid;
  e_wall_sits uuid;
  e_one_leg_balance uuid;
  e_heel_raises uuid;
  e_toe_raises uuid;
  e_hamstring_stretch uuid;
  e_spanish_squats uuid;
  e_atg_split_squat uuid;
  e_single_leg_squat uuid;
BEGIN
  v_user_id := 'c318349b-c8f4-4bf8-8aeb-aeea49ddc9f4';

  -- ==========================================
  -- INSERT GLOBAL EXERCISES (skip if exists)
  -- ==========================================

  INSERT INTO exercises (id, name, muscle_group, equipment, exercise_type, is_global, created_by)
  VALUES
    (uuid_generate_v4(), 'Fetch Towel',                'Mobility',    'Towel',      'strength', true, v_user_id),
    (uuid_generate_v4(), 'Alternate Toe Raises',        'Calves',      'Bodyweight', 'strength', true, v_user_id),
    (uuid_generate_v4(), 'Calf Stretch (Straight Leg)', 'Calves',      'Bodyweight', 'duration', true, v_user_id),
    (uuid_generate_v4(), 'Bent Knee Calf Stretch',      'Calves',      'Bodyweight', 'duration', true, v_user_id),
    (uuid_generate_v4(), '90/90 Rotations',             'Mobility',    'Bodyweight', 'strength', true, v_user_id),
    (uuid_generate_v4(), 'Asian Squat Hold',            'Mobility',    'Bodyweight', 'duration', true, v_user_id),
    (uuid_generate_v4(), 'Couch Stretch',               'Quads',       'Bodyweight', 'duration', true, v_user_id),
    (uuid_generate_v4(), 'Glute Bridge',                'Glutes',      'Bodyweight', 'strength', true, v_user_id),
    (uuid_generate_v4(), 'Side-Lying Leg Raises',       'Glutes',      'Bodyweight', 'strength', true, v_user_id),
    (uuid_generate_v4(), 'Wall Sits',                   'Quads',       'Bodyweight', 'duration', true, v_user_id),
    (uuid_generate_v4(), 'One-Leg Balance',             'Stability',   'Bodyweight', 'duration', true, v_user_id),
    (uuid_generate_v4(), 'Heel Raises',                 'Calves',      'Bodyweight', 'strength', true, v_user_id),
    (uuid_generate_v4(), 'Toe Raises',                  'Calves',      'Bodyweight', 'strength', true, v_user_id),
    (uuid_generate_v4(), 'Hamstring Stretch',           'Hamstrings',  'Bodyweight', 'duration', true, v_user_id),
    (uuid_generate_v4(), 'Spanish Squats',              'Quads',       'Band',       'strength', true, v_user_id),
    (uuid_generate_v4(), 'ATG Split Squat',             'Quads',       'Bodyweight', 'strength', true, v_user_id),
    (uuid_generate_v4(), 'Single-Leg Squat',            'Quads',       'Bodyweight', 'strength', true, v_user_id)
  ON CONFLICT DO NOTHING;

  -- Look up exercise IDs by name
  SELECT id INTO e_fetch_towel             FROM exercises WHERE name = 'Fetch Towel'                AND is_global = true LIMIT 1;
  SELECT id INTO e_alternate_toe_raises    FROM exercises WHERE name = 'Alternate Toe Raises'        AND is_global = true LIMIT 1;
  SELECT id INTO e_calf_stretch_straight   FROM exercises WHERE name = 'Calf Stretch (Straight Leg)' AND is_global = true LIMIT 1;
  SELECT id INTO e_bent_knee_calf_stretch  FROM exercises WHERE name = 'Bent Knee Calf Stretch'      AND is_global = true LIMIT 1;
  SELECT id INTO e_90_90_rotations         FROM exercises WHERE name = '90/90 Rotations'             AND is_global = true LIMIT 1;
  SELECT id INTO e_asian_squat_hold        FROM exercises WHERE name = 'Asian Squat Hold'            AND is_global = true LIMIT 1;
  SELECT id INTO e_couch_stretch           FROM exercises WHERE name = 'Couch Stretch'               AND is_global = true LIMIT 1;
  SELECT id INTO e_glute_bridge            FROM exercises WHERE name = 'Glute Bridge'                AND is_global = true LIMIT 1;
  SELECT id INTO e_side_lying_leg_raises   FROM exercises WHERE name = 'Side-Lying Leg Raises'       AND is_global = true LIMIT 1;
  SELECT id INTO e_wall_sits               FROM exercises WHERE name = 'Wall Sits'                   AND is_global = true LIMIT 1;
  SELECT id INTO e_one_leg_balance         FROM exercises WHERE name = 'One-Leg Balance'             AND is_global = true LIMIT 1;
  SELECT id INTO e_heel_raises             FROM exercises WHERE name = 'Heel Raises'                 AND is_global = true LIMIT 1;
  SELECT id INTO e_toe_raises              FROM exercises WHERE name = 'Toe Raises'                  AND is_global = true LIMIT 1;
  SELECT id INTO e_hamstring_stretch       FROM exercises WHERE name = 'Hamstring Stretch'           AND is_global = true LIMIT 1;
  SELECT id INTO e_spanish_squats          FROM exercises WHERE name = 'Spanish Squats'              AND is_global = true LIMIT 1;
  SELECT id INTO e_atg_split_squat         FROM exercises WHERE name = 'ATG Split Squat'             AND is_global = true LIMIT 1;
  SELECT id INTO e_single_leg_squat        FROM exercises WHERE name = 'Single-Leg Squat'            AND is_global = true LIMIT 1;

  -- ==========================================
  -- CREATE TEMPLATE (public)
  -- ==========================================
  v_template_id := uuid_generate_v4();
  INSERT INTO templates (id, name, created_by, is_public)
  VALUES (v_template_id, 'Rehab', v_user_id, true);

  -- ==========================================
  -- DAY A: Mobility + Activation
  -- ==========================================
  v_day_id := uuid_generate_v4();
  INSERT INTO template_days (id, template_id, day_index, name)
  VALUES (v_day_id, v_template_id, 0, 'Mobility + Activation');

  INSERT INTO template_day_exercises (template_day_id, exercise_id, order_index, default_sets, default_reps) VALUES
    (v_day_id, e_fetch_towel,            0, 1, 1),
    (v_day_id, e_alternate_toe_raises,   1, 3, 15),
    (v_day_id, e_calf_stretch_straight,  2, 2, 30),
    (v_day_id, e_bent_knee_calf_stretch, 3, 2, 30),
    (v_day_id, e_90_90_rotations,        4, 2, 10),
    (v_day_id, e_asian_squat_hold,       5, 3, 30),
    (v_day_id, e_couch_stretch,          6, 2, 30),
    (v_day_id, e_glute_bridge,           7, 3, 15),
    (v_day_id, e_side_lying_leg_raises,  8, 3, 15),
    (v_day_id, e_wall_sits,             9, 3, 30),
    (v_day_id, e_one_leg_balance,       10, 2, 30);

  -- ==========================================
  -- DAY B: Strength + Control
  -- ==========================================
  v_day_id := uuid_generate_v4();
  INSERT INTO template_days (id, template_id, day_index, name)
  VALUES (v_day_id, v_template_id, 1, 'Strength + Control');

  INSERT INTO template_day_exercises (template_day_id, exercise_id, order_index, default_sets, default_reps) VALUES
    (v_day_id, e_heel_raises,           0, 3, 15),
    (v_day_id, e_toe_raises,            1, 3, 15),
    (v_day_id, e_90_90_rotations,       2, 2, 10),
    (v_day_id, e_hamstring_stretch,     3, 2, 30),
    (v_day_id, e_spanish_squats,        4, 3, 15),
    (v_day_id, e_atg_split_squat,       5, 3, 10),
    (v_day_id, e_single_leg_squat,      6, 3, 8),
    (v_day_id, e_one_leg_balance,       7, 2, 30);

  RAISE NOTICE 'Rehab 2-Day Split created successfully!';
END $$;
