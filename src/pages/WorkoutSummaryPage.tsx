import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSessionExercises, usePersonalRecords } from "../hooks/useWorkout";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Trophy,
  Dumbbell,
  Clock,
  Flame,
  Hash,
  Weight,
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

  const { exercises: sessionExercises, loading: exLoading } =
    useSessionExercises(sessionId ?? null);

  const exerciseIds = useMemo(
    () => sessionExercises.map((se) => se.exercise_id),
    [sessionExercises],
  );
  const { isPR } = usePersonalRecords(sessionId ?? null, exerciseIds);

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

  const workoutName =
    session.name || session.template_day?.name || "Workout";
  const date = new Date(session.started_at);

  const formatVolume = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${Math.round(v)} kg`;

  return (
    <div className="min-h-svh flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-gray-800 px-4 py-3">
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

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        {/* Title card */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white">{workoutName}</h2>
          <p className="text-gray-400 text-sm">
            {date.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          {session.duration_minutes && (
            <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {session.duration_minutes} min
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {strengthExercises.length > 0 && (
            <>
              <StatCard
                icon={<Weight className="w-4 h-4 text-primary" />}
                label="Total Volume"
                value={formatVolume(totalVolume)}
              />
              <StatCard
                icon={<Hash className="w-4 h-4 text-blue-400" />}
                label="Total Sets"
                value={String(totalSets)}
              />
              <StatCard
                icon={<Flame className="w-4 h-4 text-red-400" />}
                label="Total Reps"
                value={String(totalReps)}
              />
              <StatCard
                icon={<Dumbbell className="w-4 h-4 text-green-400" />}
                label="Exercises"
                value={String(strengthExercises.length)}
              />
            </>
          )}
          {cardioExercises.length > 0 && (
            <>
              <StatCard
                icon={<Clock className="w-4 h-4 text-cyan-400" />}
                label="Cardio Time"
                value={`${Math.round(totalCardioMin)} min`}
              />
              <StatCard
                icon={<Route className="w-4 h-4 text-emerald-400" />}
                label="Distance"
                value={`${totalDistance.toFixed(1)} km`}
              />
              {totalCalories > 0 && (
                <StatCard
                  icon={<Flame className="w-4 h-4 text-orange-400" />}
                  label="Calories"
                  value={String(totalCalories)}
                />
              )}
            </>
          )}
          {prCount > 0 && (
            <StatCard
              icon={<Trophy className="w-4 h-4 text-yellow-400" />}
              label="Personal Records"
              value={String(prCount)}
              highlight
            />
          )}
        </div>

        {/* Exercise breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Exercise Breakdown
          </h3>
          {sessionExercises.map((se) => (
            <ExerciseRow key={se.id} se={se} isPR={isPR} />
          ))}
        </div>

        {/* View full workout button */}
        <button
          onClick={() => navigate(`/workout/${sessionId}`)}
          className="w-full bg-surface hover:bg-surface-light rounded-xl py-3 text-center text-sm font-medium text-primary transition"
        >
          View Full Workout
        </button>
      </main>
    </div>
  );
}

// ── Stat card ──
function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3.5 ${highlight ? "bg-yellow-400/10 ring-1 ring-yellow-400/30" : "bg-surface"}`}
    >
      <div className="flex items-center gap-2 mb-1">{icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className={`text-xl font-bold ${highlight ? "text-yellow-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

// ── Exercise row ──
function ExerciseRow({
  se,
  isPR,
}: {
  se: SessionExercise;
  isPR: (exerciseId: string, weight: number | null, reps: number | null) => boolean;
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
      if (!bestSet || s.weight > bestSet.weight || (s.weight === bestSet.weight && s.reps > bestSet.reps)) {
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
    <div className="bg-surface rounded-xl p-4">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-2"
      >
        {exerciseHasPR && <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />}
        <h4 className="text-white font-medium flex-1 text-left">{ex?.name ?? "Exercise"}</h4>
        <span className="text-xs text-gray-500 mr-1">{sets.length} sets</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        )}
      </button>

      {/* Compact summary (always visible) */}
      {isCardio ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-2">
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
              <Heart className="w-3.5 h-3.5" /> {Math.round(avgHR / hrCount)} bpm
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm text-gray-400 mt-2">
          <span>
            <span className="text-white font-medium">{avgWeight} kg</span> × {totalReps} reps
          </span>
          <span className="text-xs text-gray-500">{Math.round(volume)} kg vol</span>
        </div>
      )}

      {/* Expanded set breakdown */}
      {expanded && !isCardio && (
        <div className="mt-3 pt-3 border-t border-gray-800 space-y-1">
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
                    ? `${s.weight} kg × ${s.reps}`
                    : "—"}
                  {s.rpe != null ? ` @ RPE ${s.rpe}` : ""}
                </span>
              </div>
            );
          })}
          {bestSet && (
            <p className="text-xs text-gray-500 pt-1">
              Best: <span className="text-white font-medium">{bestSet.weight} kg × {bestSet.reps}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
