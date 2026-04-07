import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  useSessionExercises,
  usePreviousSession,
  useWorkoutSessions,
  usePersonalRecords,
} from "../hooks/useWorkout";
import {
  useExercises,
  useUserProfile,
  useTemplateDays,
} from "../hooks/useData";
import { supabase } from "../lib/supabase";
import SetRow from "../components/SetRow";
import ExercisePicker from "../components/ExercisePicker";
import {
  ArrowLeft,
  Plus,
  Check,
  Timer,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pause,
  Play,
  Pencil,
  Link2,
} from "lucide-react";
import type { SessionExercise, SessionSet, WorkoutSession } from "../types";
import LoadingScreen from "../components/LoadingScreen";

export default function WorkoutSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isScheduled = searchParams.get("scheduled") !== "false";
  const isBlank = searchParams.get("blank") === "true";
  const { exercises: allExercises } = useExercises();
  const {
    exercises: sessionExercises,
    loading: exercisesLoading,
    addExercise,
    swapExercise,
    removeExercise,
    addSetOptimistic,
    removeSetOptimistic,
    updateSetOptimistic,
    reload: reloadExercises,
  } = useSessionExercises(sessionId ?? null);
  const { finishSession, deleteSession } = useWorkoutSessions();
  const { profile, updateProfile } = useUserProfile();
  const { days } = useTemplateDays(profile?.active_template_id ?? null);

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [swapTarget, setSwapTarget] = useState<SessionExercise | null>(null);
  const [supersetMode, setSupersetMode] = useState<{
    step: "first" | "second";
    firstExerciseId?: string;
  } | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [customDuration, setCustomDuration] = useState("");
  const [populating, setPopulating] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { previousExercises } = usePreviousSession(
    session?.template_day_id ?? null,
    sessionId ?? null,
  );

  // Load session and populate exercises from template if empty
  const populatingRef = useRef(false);
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    (async () => {
      // 1. Load the session
      const { data: sessionData } = await supabase
        .from("workout_sessions")
        .select("*, template_day:template_days(*)")
        .eq("id", sessionId)
        .single();
      if (!sessionData || cancelled) return;
      setSession(sessionData);

      // Skip population entirely for blank sessions
      if (isBlank) {
        setPopulating(false);
        return;
      }

      // 2. Populate from template if needed (guard against StrictMode double-run)
      if (populatingRef.current) return;
      populatingRef.current = true;

      // Check if session already has exercises
      const { count } = await supabase
        .from("session_exercises")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId);
      if (cancelled) {
        populatingRef.current = false;
        return;
      }
      if (count && count > 0) {
        // Already has exercises, just load them
        await reloadExercises();
        setPopulating(false);
        return;
      }

      // Fetch template exercises with defaults
      const { data: templateExercises } = await supabase
        .from("template_day_exercises")
        .select(
          "exercise_id, order_index, default_sets, default_reps, default_rpe, default_rest_seconds, superset_group",
        )
        .eq("template_day_id", sessionData.template_day_id)
        .order("order_index");

      if (cancelled) {
        populatingRef.current = false;
        return;
      }
      if (templateExercises && templateExercises.length > 0) {
        // Insert all session exercises and their default sets
        for (const te of templateExercises) {
          const seId = crypto.randomUUID();
          await supabase.from("session_exercises").insert({
            id: seId,
            session_id: sessionId,
            exercise_id: te.exercise_id,
            order_index: te.order_index,
            swapped_from_exercise_id: null,
            superset_group: te.superset_group ?? null,
          });

          // Pre-fill sets from template defaults
          if (te.default_sets && te.default_sets > 0) {
            const setsToInsert = Array.from(
              { length: te.default_sets },
              (_, i) => ({
                id: crypto.randomUUID(),
                session_exercise_id: seId,
                set_index: i,
                weight: null,
                reps: te.default_reps ?? null,
                rpe: te.default_rpe ?? null,
                rest_seconds: te.default_rest_seconds ?? null,
                notes: null,
              }),
            );
            await supabase.from("session_sets").insert(setsToInsert);
          }
        }
      }

      if (!cancelled) {
        await reloadExercises();
      }
      setPopulating(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, reloadExercises, isBlank]);

  // Timer
  useEffect(() => {
    if (!session || session.finished_at || paused) return;
    const startTime = new Date(session.started_at).getTime();
    const tick = () => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session, paused]);

  const togglePause = () => {
    if (paused) {
      setPaused(false);
    } else {
      setPausedAt(elapsed);
      setPaused(true);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleFinish = async () => {
    if (!sessionId) return;
    const durationMinutes = customDuration
      ? parseInt(customDuration)
      : Math.round(elapsed / 60);
    await finishSession(sessionId, durationMinutes);

    // Auto-advance to next day only for scheduled workouts
    if (isScheduled && profile && days.length > 0) {
      const nextIndex = (profile.current_day_index + 1) % days.length;
      await updateProfile({ current_day_index: nextIndex });
    }

    navigate(`/workout/${sessionId}/summary`, { replace: true });
  };

  const handleAddExercise = async (exerciseId: string) => {
    if (swapTarget) {
      await swapExercise(swapTarget.id, exerciseId, swapTarget.exercise_id);
      setSwapTarget(null);
      setShowExercisePicker(false);
    } else if (supersetMode) {
      if (supersetMode.step === "first") {
        // Got first exercise, now pick second
        setSupersetMode({ step: "second", firstExerciseId: exerciseId });
        return; // Keep picker open
      } else {
        // Got second exercise, create the superset
        const existingGroups = sessionExercises
          .map((se) => se.superset_group)
          .filter((g): g is number => g != null);
        const nextGroup =
          existingGroups.length > 0 ? Math.max(...existingGroups) + 1 : 1;
        const baseIndex = sessionExercises.length;
        await addExercise(
          supersetMode.firstExerciseId!,
          baseIndex,
          undefined,
          nextGroup,
        );
        await addExercise(exerciseId, baseIndex + 1, undefined, nextGroup);
        setSupersetMode(null);
        setShowExercisePicker(false);
      }
    } else {
      await addExercise(exerciseId, sessionExercises.length);
      setShowExercisePicker(false);
    }
  };

  const getPreviousData = useCallback(
    (exerciseId: string): SessionSet[] => {
      const prev = previousExercises.find(
        (pe) => pe.exercise_id === exerciseId,
      );
      return prev?.sets ?? [];
    },
    [previousExercises],
  );

  const isFinished = !!session?.finished_at;
  const readOnly = isFinished && !editing;

  const exerciseIds = useMemo(
    () => sessionExercises.map((se) => se.exercise_id),
    [sessionExercises],
  );
  const { isPR } = usePersonalRecords(sessionId ?? null, exerciseIds);

  if (!session || exercisesLoading || populating) return <LoadingScreen />;

  return (
    <div className="min-h-svh flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="p-2 -ml-2 text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-white font-semibold">
              {isBlank
                ? session?.name || "Blank Session"
                : (session?.name ?? session?.template_day?.name ?? "Workout")}
            </p>
            {!isFinished && (
              <button
                onClick={togglePause}
                className="flex items-center gap-1.5 text-primary text-sm font-mono"
              >
                {paused ? (
                  <Play className="w-3.5 h-3.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
                <Timer className="w-3 h-3" />
                <span className={`tracking-wide ${paused ? "opacity-50" : ""}`}>
                  {formatTime(paused ? pausedAt : elapsed)}
                </span>
              </button>
            )}
            {isFinished && (
              <p className="text-gray-500 text-xs">
                {session?.duration_minutes} min ·{" "}
                {new Date(session!.started_at).toLocaleDateString()}
              </p>
            )}
          </div>
          {isFinished ? (
            <div className="flex items-center gap-1 -mr-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-400 hover:text-danger transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditing(!editing)}
                className={`p-2 ${editing ? "text-primary" : "text-gray-400"}`}
              >
                {editing ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Pencil className="w-5 h-5" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 -mr-2 text-gray-400 hover:text-danger transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-32">
        {(() => {
          // Group exercises: standalone (null superset_group) rendered individually,
          // exercises with the same superset_group rendered together
          const rendered: (
            | { type: "single"; exercise: SessionExercise }
            | { type: "superset"; group: number; exercises: SessionExercise[] }
          )[] = [];
          const supersetGroups = new Map<number, SessionExercise[]>();

          for (const se of sessionExercises) {
            if (se.superset_group != null) {
              const group = supersetGroups.get(se.superset_group);
              if (group) {
                group.push(se);
              } else {
                supersetGroups.set(se.superset_group, [se]);
              }
            }
          }

          const renderedGroups = new Set<number>();

          for (const se of sessionExercises) {
            if (se.superset_group != null) {
              if (renderedGroups.has(se.superset_group)) continue;
              renderedGroups.add(se.superset_group);
              rendered.push({
                type: "superset",
                group: se.superset_group,
                exercises: supersetGroups.get(se.superset_group)!,
              });
            } else {
              rendered.push({ type: "single", exercise: se });
            }
          }

          return rendered.map((item) => {
            if (item.type === "single") {
              const se = item.exercise;
              const prevSets = getPreviousData(se.exercise_id);
              const isExpanded = expandedExercise === se.id;
              return (
                <ExerciseCard
                  key={se.id}
                  sessionExercise={se}
                  previousSets={prevSets}
                  isExpanded={isExpanded}
                  isFinished={readOnly}
                  allExercises={allExercises}
                  onToggle={() =>
                    setExpandedExercise(isExpanded ? null : se.id)
                  }
                  onSwap={() => {
                    setSwapTarget(se);
                    setShowExercisePicker(true);
                  }}
                  onRemove={() => removeExercise(se.id)}
                  onAddSet={addSetOptimistic}
                  onRemoveSet={removeSetOptimistic}
                  onUpdateSet={updateSetOptimistic}
                  isPR={isPR}
                  weightUnit={profile?.weight_unit ?? "kg"}
                />
              );
            } else {
              return (
                <div
                  key={`ss-${item.group}`}
                  className="relative rounded-2xl border border-primary/20 p-1 space-y-1"
                >
                  <div className="flex items-center gap-1.5 px-3 py-1">
                    <Link2 className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Superset
                    </span>
                  </div>
                  {item.exercises.map((se) => {
                    const prevSets = getPreviousData(se.exercise_id);
                    const isExpanded = expandedExercise === se.id;
                    return (
                      <ExerciseCard
                        key={se.id}
                        sessionExercise={se}
                        previousSets={prevSets}
                        isExpanded={isExpanded}
                        isFinished={readOnly}
                        allExercises={allExercises}
                        onToggle={() =>
                          setExpandedExercise(isExpanded ? null : se.id)
                        }
                        onSwap={() => {
                          setSwapTarget(se);
                          setShowExercisePicker(true);
                        }}
                        onRemove={() => removeExercise(se.id)}
                        onAddSet={addSetOptimistic}
                        onRemoveSet={removeSetOptimistic}
                        onUpdateSet={updateSetOptimistic}
                        isPR={isPR}
                        weightUnit={profile?.weight_unit ?? "kg"}
                      />
                    );
                  })}
                </div>
              );
            }
          });
        })()}

        {!readOnly && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSwapTarget(null);
                setSupersetMode(null);
                setShowExercisePicker(true);
              }}
              className="flex-1 border-2 border-dashed border-gray-700 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add Exercise</span>
            </button>
            <button
              onClick={() => {
                setSwapTarget(null);
                setSupersetMode({ step: "first" });
                setShowExercisePicker(true);
              }}
              className="flex-1 border-2 border-dashed border-gray-700 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition"
            >
              <Link2 className="w-5 h-5" />
              <span>Add Superset</span>
            </button>
          </div>
        )}
      </main>

      {/* Finish Button */}
      {!isFinished && (
        <div
          className="fixed bottom-0 left-0 right-0 glass-header px-4 py-4"
          style={{ borderTop: "none", borderBottom: "none" }}
        >
          <div className="max-w-lg mx-auto">
            {showFinishConfirm ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                  <Timer className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Duration (minutes)</p>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="bg-transparent text-white text-lg font-semibold w-full focus:outline-none"
                    />
                  </div>
                  <span className="text-gray-500 text-sm">min</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowFinishConfirm(false);
                      setCustomDuration("");
                    }}
                    className="flex-1 glass text-gray-300 font-semibold py-3 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinish}
                    className="flex-1 bg-success text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Finish
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setCustomDuration(Math.round(elapsed / 60).toString());
                  setShowFinishConfirm(true);
                }}
                className="w-full btn-gradient btn-gradient-glow text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Check className="w-5 h-5" />
                Finish Workout ({formatTime(elapsed)})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <ExercisePicker
          exercises={allExercises}
          onSelect={handleAddExercise}
          onClose={() => {
            setShowExercisePicker(false);
            setSwapTarget(null);
            setSupersetMode(null);
          }}
          title={
            swapTarget
              ? "Swap Exercise"
              : supersetMode?.step === "first"
                ? "Superset — Pick 1st Exercise"
                : supersetMode?.step === "second"
                  ? "Superset — Pick 2nd Exercise"
                  : "Add Exercise"
          }
          selectedExerciseName={
            supersetMode?.step === "second"
              ? allExercises.find((e) => e.id === supersetMode.firstExerciseId)
                  ?.name
              : undefined
          }
        />
      )}

      {/* Delete Workout Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-elevated rounded-2xl w-full max-w-sm p-6 space-y-4 animate-fade-in-up">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-danger" />
              </div>
              <h3 className="text-white font-semibold text-lg">
                {isFinished ? "Delete Workout?" : "Discard Workout?"}
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                This will permanently delete this workout and all logged sets.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 glass text-gray-300 font-medium py-2.5 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (sessionId) {
                    await deleteSession(sessionId);
                  }
                  navigate("/", { replace: true });
                }}
                className="flex-1 bg-danger text-white font-medium py-2.5 rounded-xl text-sm"
              >
                {isFinished ? "Delete" : "Discard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({
  sessionExercise,
  previousSets,
  isExpanded,
  isFinished,
  onToggle,
  onSwap,
  onRemove,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  isPR,
  weightUnit,
}: {
  sessionExercise: SessionExercise;
  previousSets: SessionSet[];
  isExpanded: boolean;
  isFinished: boolean;
  allExercises: { id: string; name: string }[];
  onToggle: () => void;
  onSwap: () => void;
  onRemove: () => void;
  onAddSet: (sessionExerciseId: string, newSet: SessionSet) => void;
  onRemoveSet: (sessionExerciseId: string, setId: string) => void;
  onUpdateSet: (setId: string, updates: Partial<SessionSet>) => void;
  isPR: (
    exerciseId: string,
    weight: number | null,
    reps: number | null,
  ) => boolean;
  weightUnit: string;
}) {
  const sets = sessionExercise.sets ?? [];
  const [showVideo, setShowVideo] = useState(false);
  const videoUrl = sessionExercise.exercise?.video_url;
  const exType = sessionExercise.exercise?.exercise_type ?? "strength";
  const isCardio = exType === "cardio";
  const isDuration = exType === "duration";
  const repsLabel = isDuration ? "Sec" : "Reps";

  const getYouTubeId = (url: string): string | null => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/,
    );
    return match ? match[1] : null;
  };

  return (
    <div
      className={`glass glass-shimmer rounded-2xl overflow-hidden ${!isFinished ? "accent-stripe" : ""}`}
    >
      {/* Exercise Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <div className="flex-1">
          <p className="text-white font-medium">
            {sessionExercise.exercise?.name ?? "Unknown Exercise"}
          </p>
          <p className="text-gray-500 text-xs">
            {sessionExercise.exercise?.muscle_group}
            {sessionExercise.swapped_from_exercise_id && (
              <span className="text-warning ml-2">· swapped</span>
            )}
          </p>
        </div>
        <span className="text-gray-500 text-sm">{sets.length} sets</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* YouTube Video */}
          {videoUrl && (
            <div>
              {showVideo ? (
                <div className="space-y-2">
                  <div
                    className="relative w-full rounded-lg overflow-hidden"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl) ?? ""}?rel=0`}
                      title="Exercise video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <button
                    onClick={() => setShowVideo(false)}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    Hide video
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowVideo(true)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
                >
                  <span>▶</span> Watch form video
                </button>
              )}
            </div>
          )}

          {/* Previous performance hint */}
          {previousSets.length > 0 && (
            <div className="bg-surface-light rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">📊 Last session:</p>
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-1 text-[10px] text-gray-500 px-1">
                  <span className="col-span-1">#</span>
                  {isCardio ? (
                    <>
                      <span className="col-span-2">Min</span>
                      <span className="col-span-2">km</span>
                      <span className="col-span-2">kcal</span>
                      <span className="col-span-2">HR</span>
                    </>
                  ) : (
                    <>
                      <span className="col-span-2">{weightUnit}</span>
                      <span className="col-span-2">{repsLabel}</span>
                      <span className="col-span-2">RPE</span>
                      <span className="col-span-2">Rest</span>
                    </>
                  )}
                  <span className="col-span-3">Note</span>
                </div>
                {previousSets.map((ps, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-1 text-xs text-gray-400 bg-background rounded px-1 py-1"
                  >
                    <span className="col-span-1 text-gray-500">{i + 1}</span>
                    {isCardio ? (
                      <>
                        <span className="col-span-2">
                          {ps.duration_seconds
                            ? Math.round(ps.duration_seconds / 60)
                            : "–"}
                        </span>
                        <span className="col-span-2">
                          {ps.distance_km ?? "–"}
                        </span>
                        <span className="col-span-2">{ps.calories ?? "–"}</span>
                        <span className="col-span-2">
                          {ps.avg_heart_rate ?? "–"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="col-span-2">{ps.weight ?? "–"}</span>
                        <span className="col-span-2">
                          {ps.reps != null
                            ? isDuration
                              ? `${ps.reps}s`
                              : ps.reps
                            : "–"}
                        </span>
                        <span className="col-span-2">{ps.rpe ?? "–"}</span>
                        <span className="col-span-2">
                          {ps.rest_seconds ? `${ps.rest_seconds}s` : "–"}
                        </span>
                      </>
                    )}
                    <span className="col-span-3 truncate">
                      {ps.notes || "–"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sets */}
          <div className="space-y-2">
            {/* Header row */}
            {sets.length > 0 && (
              <div className="grid grid-cols-12 gap-1 text-xs text-gray-500 px-1">
                <span className="col-span-1">#</span>
                {isCardio ? (
                  <>
                    <span className="col-span-2">Min</span>
                    <span className="col-span-2">km</span>
                    <span className="col-span-2">kcal</span>
                    <span className="col-span-2">HR</span>
                  </>
                ) : (
                  <>
                    <span className="col-span-2">{weightUnit}</span>
                    <span className="col-span-2">{repsLabel}</span>
                    <span className="col-span-2">RPE</span>
                    <span className="col-span-2">Rest</span>
                  </>
                )}
                <span className="col-span-3">Note</span>
              </div>
            )}
            {sets.map((set) => (
              <SetRow
                key={set.id}
                set={set}
                sessionExerciseId={sessionExercise.id}
                disabled={isFinished}
                onRemoveSet={onRemoveSet}
                onUpdateSet={onUpdateSet}
                isPR={
                  !isCardio &&
                  isPR(sessionExercise.exercise_id, set.weight, set.reps)
                }
                exerciseType={exType}
              />
            ))}
          </div>

          {/* Actions */}
          {!isFinished && (
            <div className="flex gap-2">
              <AddSetButton
                sessionExerciseId={sessionExercise.id}
                nextIndex={sets.length}
                previousSet={previousSets[sets.length] ?? sets[sets.length - 1]}
                onAddSet={onAddSet}
              />
              <button
                onClick={onSwap}
                className="flex items-center gap-1 text-gray-400 hover:text-warning text-sm px-3 py-2 bg-surface-light rounded-lg transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Swap
              </button>
              <button
                onClick={onRemove}
                className="flex items-center gap-1 text-gray-400 hover:text-danger text-sm px-3 py-2 bg-surface-light rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddSetButton({
  sessionExerciseId,
  nextIndex,
  previousSet,
  onAddSet,
}: {
  sessionExerciseId: string;
  nextIndex: number;
  previousSet?: SessionSet;
  onAddSet: (sessionExerciseId: string, newSet: SessionSet) => void;
}) {
  const handleAdd = () => {
    const id = crypto.randomUUID();
    const newSet: SessionSet = {
      id,
      session_exercise_id: sessionExerciseId,
      set_index: nextIndex,
      weight: previousSet?.weight ?? null,
      reps: previousSet?.reps ?? null,
      rpe: null,
      rest_seconds: null,
      notes: null,
      duration_seconds: previousSet?.duration_seconds ?? null,
      distance_km: previousSet?.distance_km ?? null,
      calories: previousSet?.calories ?? null,
      avg_heart_rate: previousSet?.avg_heart_rate ?? null,
    };

    // Optimistic: update UI immediately
    onAddSet(sessionExerciseId, newSet);

    // Persist to DB in background
    supabase.from("session_sets").insert(newSet).then();
  };

  return (
    <button
      onClick={handleAdd}
      className="flex-1 flex items-center justify-center gap-1 text-primary text-sm py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition"
    >
      <Plus className="w-4 h-4" />
      Add Set
    </button>
  );
}
