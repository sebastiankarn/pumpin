import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSessionExercises, usePersonalRecords } from "../hooks/useWorkout";
import { useUserProfile } from "../hooks/useData";
import { useCountUp } from "../hooks/useCountUp";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Trophy,
  Clock,
  Flame,
  Route,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { WorkoutSession, SessionExercise } from "../types";

export default function WorkoutSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useUserProfile();
  const unit = profile?.weight_unit ?? "kg";

  const { exercises: sessionExercises, loading: exLoading } =
    useSessionExercises(sessionId ?? null);

  const exerciseIds = useMemo(
    () => sessionExercises.map((se) => se.exercise_id),
    [sessionExercises],
  );
  const { isPR } = usePersonalRecords(sessionId ?? null, exerciseIds);

  // Must be above early returns — hooks cannot be called conditionally
  const muscleGroups = useMemo(() => {
    const map = new Map<string, { category: string; volume: number }>();
    for (const se of sessionExercises) {
      const mg = se.exercise?.muscle_group;
      if (!mg) continue;
      const mgLower = mg.toLowerCase();
      let cat = "other";
      if (["chest", "shoulders", "triceps"].some((m) => mgLower.includes(m)))
        cat = "push";
      else if (
        ["back", "biceps", "forearms"].some((m) => mgLower.includes(m))
      )
        cat = "pull";
      else if (
        ["quads", "hamstrings", "glutes", "calves", "legs"].some((m) =>
          mgLower.includes(m),
        )
      )
        cat = "legs";
      const vol = (se.sets ?? []).reduce(
        (sum, s) => sum + (s.weight && s.reps ? s.weight * s.reps : 0),
        0,
      );
      const existing = map.get(mg);
      map.set(mg, { category: cat, volume: (existing?.volume ?? 0) + vol });
    }
    return [...map.entries()]
      .sort((a, b) => b[1].volume - a[1].volume)
      .map(([name, { category }]) => ({ name, category }));
  }, [sessionExercises]);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const { data } = await supabase
        .from("workout_sessions")
        .select("*, template_day:template_days(*)")
        .eq("id", sessionId)
        .single();
      if (data) setSession(data as WorkoutSession);
      setLoading(false);
    })();
  }, [sessionId]);

  if (loading || exLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <p className="text-gray-500">Session not found.</p>
      </div>
    );
  }

  // ── Totals ──
  const strengthExercises = sessionExercises.filter(
    (se) => (se.exercise?.exercise_type ?? "strength") === "strength",
  );
  const cardioExercises = sessionExercises.filter(
    (se) => se.exercise?.exercise_type === "cardio",
  );

  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0; // kg
  let prCount = 0;

  for (const se of strengthExercises) {
    for (const s of se.sets ?? []) {
      if (s.weight != null && s.reps != null) {
        totalSets++;
        totalReps += s.reps;
        totalVolume += s.weight * s.reps;
        if (isPR(se.exercise_id, s.weight, s.reps)) prCount++;
      }
    }
  }

  let totalCardioMin = 0;
  let totalDistance = 0;
  let totalCalories = 0;

  for (const se of cardioExercises) {
    for (const s of se.sets ?? []) {
      if (s.duration_seconds) totalCardioMin += s.duration_seconds / 60;
      if (s.distance_km) totalDistance += s.distance_km;
      if (s.calories) totalCalories += s.calories;
    }
  }

  const workoutName = session.name || session.template_day?.name || "Workout";
  const date = new Date(session.started_at);

  const formatVolume = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${Math.round(v)} ${unit}`;

  return (
    <div className="min-h-svh flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-semibold text-lg">Workout Summary</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-3 max-w-lg mx-auto w-full space-y-3 pb-24 stagger">
        {/* Hero Banner */}
        <div className="btn-gradient btn-gradient-glow relative rounded-2xl overflow-hidden">
          <div className="relative px-5 py-5">
            {prCount > 0 && (
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="w-3.5 h-3.5 text-white/80" />
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                  {prCount} personal record{prCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            <h2 className="text-2xl font-black text-white mb-3 leading-tight">
              {workoutName}
            </h2>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span>
                {date.toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
              {session.duration_minutes && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/40 shrink-0" />
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {session.duration_minutes} min
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <SummaryStatsBar
          totalVolume={totalVolume}
          totalSets={totalSets}
          totalReps={totalReps}
          exerciseCount={sessionExercises.length}
          hasStrength={strengthExercises.length > 0}
          totalCardioMin={totalCardioMin}
          totalDistance={totalDistance}
          totalCalories={totalCalories}
          hasCardio={cardioExercises.length > 0}
          prCount={prCount}
          formatVolume={formatVolume}
        />

        {/* Muscle group chips */}
        {muscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {muscleGroups.map(({ name, category }) => (
              <span
                key={name}
                className={`muscle-chip muscle-chip-${category}`}
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Exercise breakdown */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Exercise Breakdown
          </h3>
          {sessionExercises.map((se) => (
            <ExerciseRow key={se.id} se={se} isPR={isPR} unit={unit} />
          ))}
        </div>

        {/* View full workout button */}
        <button
          onClick={() => navigate(`/workout/${sessionId}`)}
          className="w-full glass glass-hover rounded-xl py-3 text-center text-sm font-medium text-primary transition"
        >
          View Full Workout
        </button>
      </main>
    </div>
  );
}

// ── Exercise row ──
function ExerciseRow({
  se,
  isPR,
  unit,
}: {
  se: SessionExercise;
  isPR: (
    exerciseId: string,
    weight: number | null,
    reps: number | null,
  ) => boolean;
  unit: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const ex = se.exercise;
  const sets = se.sets ?? [];
  const isCardio = ex?.exercise_type === "cardio";
  const exerciseHasPR =
    !isCardio && sets.some((s) => isPR(se.exercise_id, s.weight, s.reps));

  // Strength totals
  let volume = 0;
  let totalReps = 0;
  let totalWeight = 0;
  let weightCount = 0;
  let bestSet: { weight: number; reps: number } | null = null;
  for (const s of sets) {
    if (s.weight != null && s.reps != null) {
      volume += s.weight * s.reps;
      totalReps += s.reps;
      totalWeight += s.weight;
      weightCount++;
      if (
        !bestSet ||
        s.weight > bestSet.weight ||
        (s.weight === bestSet.weight && s.reps > bestSet.reps)
      ) {
        bestSet = { weight: s.weight, reps: s.reps };
      }
    }
  }
  const avgWeight = weightCount > 0 ? Math.round(totalWeight / weightCount) : 0;

  // Cardio totals
  let totalMin = 0;
  let totalDist = 0;
  let totalCal = 0;
  let avgHR = 0;
  let hrCount = 0;
  for (const s of sets) {
    if (s.duration_seconds) totalMin += s.duration_seconds / 60;
    if (s.distance_km) totalDist += s.distance_km;
    if (s.calories) totalCal += s.calories;
    if (s.avg_heart_rate) {
      avgHR += s.avg_heart_rate;
      hrCount++;
    }
  }

  return (
    <div className="glass rounded-xl p-3">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2"
      >
        <Trophy
          className={`w-4 h-4 shrink-0 transition-opacity ${exerciseHasPR ? "text-yellow-400" : "opacity-0 pointer-events-none"}`}
        />
        <h4 className="text-white font-medium flex-1 text-left text-sm">
          {ex?.name ?? "Exercise"}
        </h4>
        <span className="text-xs text-gray-500 mr-1">{sets.length} sets</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        )}
      </button>

      {/* Compact summary (always visible) */}
      {isCardio ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-2 pl-6">
          {totalMin > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {Math.round(totalMin)} min
            </span>
          )}
          {totalDist > 0 && (
            <span className="flex items-center gap-1">
              <Route className="w-3.5 h-3.5" /> {totalDist.toFixed(1)} km
            </span>
          )}
          {totalCal > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> {totalCal} kcal
            </span>
          )}
          {hrCount > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" /> {Math.round(avgHR / hrCount)}{" "}
              bpm
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm text-gray-400 mt-2 pl-6">
          <span>
            <span className="text-white font-medium">
              {avgWeight} {unit}
            </span>{" "}
            × {totalReps} reps
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(volume)} {unit} vol
          </span>
        </div>
      )}

      {/* Expanded set breakdown */}
      {expanded && !isCardio && (
        <div className="mt-3 pt-3 space-y-1">
          <div className="gradient-divider mb-3" />
          {sets.map((s, i) => {
            const pr = isPR(se.exercise_id, s.weight, s.reps);
            return (
              <div
                key={s.id}
                className={`flex items-center text-sm ${pr ? "text-yellow-400" : "text-gray-400"}`}
              >
                {pr && <Trophy className="w-3 h-3 mr-1.5 shrink-0" />}
                <span className={pr ? "" : "ml-[18px]"}>
                  Set {i + 1}:{" "}
                  {s.weight != null && s.reps != null
                    ? `${s.weight} ${unit} × ${s.reps}`
                    : "—"}
                  {s.rpe != null ? ` @ RPE ${s.rpe}` : ""}
                </span>
              </div>
            );
          })}
          {bestSet && (
            <p className="text-xs text-gray-500 pt-1">
              Best:{" "}
              <span className="text-white font-medium">
                {bestSet.weight} {unit} × {bestSet.reps}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Summary stats bar with animated numbers ──
function SummaryStatsBar({
  totalVolume,
  totalSets,
  totalReps,
  exerciseCount,
  hasStrength,
  totalCardioMin,
  totalDistance,
  totalCalories,
  hasCardio,
  prCount,
  formatVolume,
}: {
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  exerciseCount: number;
  hasStrength: boolean;
  totalCardioMin: number;
  totalDistance: number;
  totalCalories: number;
  hasCardio: boolean;
  prCount: number;
  formatVolume: (v: number) => string;
}) {
  const animSets = useCountUp(totalSets);
  const animReps = useCountUp(totalReps);
  const animExercises = useCountUp(exerciseCount);
  const animCardioMin = useCountUp(Math.round(totalCardioMin));
  const animCalories = useCountUp(totalCalories);

  return (
    <div className="glass glass-shimmer rounded-2xl p-3">
      {hasStrength && (
        <>
          <div className="grid grid-cols-4 divide-x divide-white/5">
            <div className="text-center px-1">
              <p className="text-lg font-black text-primary tabular-nums">
                {formatVolume(totalVolume)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                volume
              </p>
            </div>
            <div className="text-center px-1">
              <p className="text-lg font-black text-white tabular-nums">
                {animSets}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                sets
              </p>
            </div>
            <div className="text-center px-1">
              <p className="text-lg font-black text-white tabular-nums">
                {animReps}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                reps
              </p>
            </div>
            <div className="text-center px-1">
              <p className="text-lg font-black text-white tabular-nums">
                {animExercises}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                exercises
              </p>
            </div>
          </div>
          {(hasCardio || prCount > 0) && (
            <div className="gradient-divider my-2" />
          )}
        </>
      )}
      {hasCardio && (
        <>
          <div
            className={`grid grid-cols-${totalCalories > 0 ? 3 : 2} divide-x divide-white/5`}
          >
            <div className="text-center px-1">
              <p className="text-lg font-black text-white tabular-nums">
                {animCardioMin}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                cardio min
              </p>
            </div>
            <div className="text-center px-1">
              <p className="text-lg font-black text-white tabular-nums">
                {totalDistance.toFixed(1)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                km
              </p>
            </div>
            {totalCalories > 0 && (
              <div className="text-center px-1">
                <p className="text-lg font-black text-white tabular-nums">
                  {animCalories}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                  kcal
                </p>
              </div>
            )}
          </div>
          {prCount > 0 && <div className="gradient-divider my-2" />}
        </>
      )}
    </div>
  );
}
