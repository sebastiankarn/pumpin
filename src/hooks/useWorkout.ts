import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchWithCache, mutateWithOffline } from "../lib/sync";
import { removeCache } from "../lib/offlineDb";
import { useAuth } from "../contexts/AuthContext";
import type {
  WorkoutSession,
  SessionExercise,
  SessionSet,
  WorkoutStats,
  VolumeDataPoint,
  VolumeByCategory,
} from "../types";

export function useWorkoutSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchWithCache<WorkoutSession[]>(
      `sessions-${user.id}`,
      () =>
        supabase
          .from("workout_sessions")
          .select("*, template_day:template_days(*)")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(50),
    );
    setSessions(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const startSession = async (templateDayId: string, name?: string) => {
    if (!user) return null;
    const newSession = {
      id: crypto.randomUUID(),
      user_id: user.id,
      template_day_id: templateDayId,
      started_at: new Date().toISOString(),
      finished_at: null,
      duration_minutes: null,
      notes: null,
      name: name ?? null,
    };

    await mutateWithOffline("workout_sessions", "INSERT", newSession, () =>
      supabase.from("workout_sessions").insert(newSession),
    );

    setSessions((prev) => [newSession as WorkoutSession, ...prev]);
    return newSession;
  };

  const finishSession = async (
    sessionId: string,
    durationMinutes: number,
    notes?: string,
  ) => {
    const updates = {
      id: sessionId,
      finished_at: new Date().toISOString(),
      duration_minutes: durationMinutes,
      notes: notes || null,
    };

    await mutateWithOffline("workout_sessions", "UPDATE", updates, () =>
      supabase
        .from("workout_sessions")
        .update({
          finished_at: updates.finished_at,
          duration_minutes: updates.duration_minutes,
          notes: updates.notes,
        })
        .eq("id", sessionId),
    );

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s)),
    );
  };

  const deleteSession = async (sessionId: string) => {
    // Optimistic removal
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    // FK cascades handle session_exercises and session_sets automatically
    await supabase.from("workout_sessions").delete().eq("id", sessionId);

    // Invalidate cache so Dashboard re-fetches fresh data
    if (user) {
      await removeCache(`sessions-${user.id}`);
    }
  };

  return {
    sessions,
    loading,
    startSession,
    finishSession,
    deleteSession,
    reload: load,
  };
}

export function useSessionExercises(sessionId: string | null) {
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sessionId) {
      setExercises([]);
      setLoading(false);
      return;
    }
    const data = await fetchWithCache<SessionExercise[]>(
      `session-exercises-${sessionId}`,
      () =>
        supabase
          .from("session_exercises")
          .select("*, exercise:exercises!exercise_id(*), sets:session_sets(*)")
          .eq("session_id", sessionId)
          .order("order_index"),
    );
    // Sort sets by set_index within each exercise
    const sorted = (data ?? []).map((ex) => ({
      ...ex,
      sets: (ex.sets ?? []).sort(
        (a: SessionSet, b: SessionSet) => a.set_index - b.set_index,
      ),
    }));
    setExercises(sorted);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const addExercise = async (
    exerciseId: string,
    orderIndex: number,
    swappedFrom?: string,
    supersetGroup?: number | null,
  ) => {
    if (!sessionId) return;
    const newItem = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      exercise_id: exerciseId,
      order_index: orderIndex,
      swapped_from_exercise_id: swappedFrom || null,
      superset_group: supersetGroup ?? null,
    };

    mutateWithOffline("session_exercises", "INSERT", newItem, () =>
      supabase.from("session_exercises").insert(newItem),
    );

    // Reload to get the exercise details (need the join data)
    await load();
  };

  const swapExercise = async (
    sessionExerciseId: string,
    newExerciseId: string,
    originalExerciseId: string,
  ) => {
    const updates = {
      id: sessionExerciseId,
      exercise_id: newExerciseId,
      swapped_from_exercise_id: originalExerciseId,
    };

    mutateWithOffline("session_exercises", "UPDATE", updates, () =>
      supabase
        .from("session_exercises")
        .update({
          exercise_id: newExerciseId,
          swapped_from_exercise_id: originalExerciseId,
        })
        .eq("id", sessionExerciseId),
    );

    await load();
  };

  const removeExercise = async (sessionExerciseId: string) => {
    // Optimistic: remove from local state immediately
    setExercises((prev) => prev.filter((e) => e.id !== sessionExerciseId));

    mutateWithOffline(
      "session_exercises",
      "DELETE",
      { id: sessionExerciseId },
      () =>
        supabase.from("session_exercises").delete().eq("id", sessionExerciseId),
    );
  };

  // Optimistic set operations (update local state without full reload)
  const addSetOptimistic = (sessionExerciseId: string, newSet: SessionSet) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === sessionExerciseId
          ? { ...ex, sets: [...(ex.sets ?? []), newSet] }
          : ex,
      ),
    );
  };

  const removeSetOptimistic = (sessionExerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== sessionExerciseId) return ex;
        const remaining = (ex.sets ?? [])
          .filter((s) => s.id !== setId)
          .map((s, i) => ({ ...s, set_index: i }));
        return { ...ex, sets: remaining };
      }),
    );
  };

  const updateSetOptimistic = (setId: string, updates: Partial<SessionSet>) => {
    setExercises((prev) =>
      prev.map((ex) => ({
        ...ex,
        sets: (ex.sets ?? []).map((s) =>
          s.id === setId ? { ...s, ...updates } : s,
        ),
      })),
    );
  };

  return {
    exercises,
    loading,
    addExercise,
    swapExercise,
    removeExercise,
    addSetOptimistic,
    removeSetOptimistic,
    updateSetOptimistic,
    reload: load,
  };
}

export function useWorkoutStats(): {
  stats: WorkoutStats | null;
  loading: boolean;
  reload: () => void;
} {
  const { user } = useAuth();
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState(0);
  const reload = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // Bypass cache by fetching directly
      const { data: sessions, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", user.id)
        .not("finished_at", "is", null)
        .order("started_at", { ascending: false });

      if (error || !sessions) {
        setStats(null);
        setLoading(false);
        return;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      const dow = now.getDay();
      startOfWeek.setDate(now.getDate() - ((dow + 6) % 7));
      startOfWeek.setHours(0, 0, 0, 0);

      const totalWorkouts = sessions.length;
      const totalMinutes = sessions.reduce(
        (sum, s) => sum + (s.duration_minutes ?? 0),
        0,
      );

      const thisMonth = sessions.filter(
        (s) => new Date(s.started_at) >= startOfMonth,
      );
      const thisWeek = sessions.filter(
        (s) => new Date(s.started_at) >= startOfWeek,
      );

      // Calculate streak
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayMs = 86400000;

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today.getTime() - i * dayMs);
        const hasWorkout = sessions.some((s) => {
          const d = new Date(s.started_at);
          return (
            d.getFullYear() === checkDate.getFullYear() &&
            d.getMonth() === checkDate.getMonth() &&
            d.getDate() === checkDate.getDate()
          );
        });
        if (hasWorkout) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
      }

      setStats({
        totalWorkouts,
        totalMinutes,
        workoutsThisMonth: thisMonth.length,
        minutesThisMonth: thisMonth.reduce(
          (sum, s) => sum + (s.duration_minutes ?? 0),
          0,
        ),
        workoutsThisWeek: thisWeek.length,
        minutesThisWeek: thisWeek.reduce(
          (sum, s) => sum + (s.duration_minutes ?? 0),
          0,
        ),
        avgDuration:
          totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0,
        currentStreak,
      });
      setLoading(false);
    })();
  }, [user, trigger]);

  return { stats, loading, reload };
}

const PUSH_MUSCLES = ["chest", "shoulders", "triceps"];
const PULL_MUSCLES = ["back", "biceps", "forearms"];
const LEG_MUSCLES = ["quads", "hamstrings", "glutes", "calves", "legs"];

function categorize(muscleGroup: string): keyof VolumeByCategory {
  const mg = muscleGroup.toLowerCase();
  if (PUSH_MUSCLES.some((m) => mg.includes(m))) return "push";
  if (PULL_MUSCLES.some((m) => mg.includes(m))) return "pull";
  if (LEG_MUSCLES.some((m) => mg.includes(m))) return "legs";
  return "other";
}

export function useVolumeStats(
  range: "week" | "month" | "year" | "total" = "month",
) {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<VolumeDataPoint[]>([]);
  const [volumeByCategory, setVolumeByCategory] = useState<VolumeByCategory>({
    push: 0,
    pull: 0,
    legs: 0,
    other: 0,
  });
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const now = new Date();
      let since: Date | null;
      if (range === "week") {
        since = new Date(now);
        const dow = now.getDay();
        since.setDate(now.getDate() - ((dow + 6) % 7));
        since.setHours(0, 0, 0, 0);
      } else if (range === "month") {
        since = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (range === "year") {
        since = new Date(now.getFullYear(), 0, 1);
      } else {
        since = null;
      }

      // Fetch finished sessions in range
      let query = supabase
        .from("workout_sessions")
        .select("id, started_at, duration_minutes")
        .eq("user_id", user.id)
        .not("finished_at", "is", null)
        .order("started_at");

      if (since) {
        query = query.gte("started_at", since.toISOString());
      }

      const { data: sessions } = await query;

      if (!sessions || sessions.length === 0) {
        setChartData([]);
        setVolumeByCategory({ push: 0, pull: 0, legs: 0, other: 0 });
        setTotalVolume(0);
        setLoading(false);
        return;
      }

      const sessionIds = sessions.map((s) => s.id);

      // Fetch all sets with exercise muscle groups for these sessions
      const { data: exerciseRows } = await supabase
        .from("session_exercises")
        .select(
          "session_id, exercise:exercises!exercise_id(muscle_group), sets:session_sets(weight, reps)",
        )
        .in("session_id", sessionIds);

      // Build per-session volume + category totals
      const sessionVolumeMap = new Map<string, number>();
      const catTotals: VolumeByCategory = {
        push: 0,
        pull: 0,
        legs: 0,
        other: 0,
      };

      for (const se of exerciseRows ?? []) {
        const exerciseData = se.exercise as unknown as {
          muscle_group: string;
        } | null;
        const mg = exerciseData?.muscle_group ?? "";
        const cat = categorize(mg);
        const sets = (se.sets ?? []) as {
          weight: number | null;
          reps: number | null;
        }[];
        let vol = 0;
        for (const s of sets) {
          if (s.weight && s.reps) vol += s.weight * s.reps;
        }
        catTotals[cat] += vol;
        sessionVolumeMap.set(
          se.session_id,
          (sessionVolumeMap.get(se.session_id) ?? 0) + vol,
        );
      }

      const points: VolumeDataPoint[] = sessions.map((s) => ({
        date: new Date(s.started_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        volume: sessionVolumeMap.get(s.id) ?? 0,
        minutes: s.duration_minutes ?? 0,
      }));

      const total =
        catTotals.push + catTotals.pull + catTotals.legs + catTotals.other;

      setChartData(points);
      setVolumeByCategory(catTotals);
      setTotalVolume(total);
      setLoading(false);
    })();
  }, [user, range]);

  return { chartData, volumeByCategory, totalVolume, loading };
}

export function usePreviousSession(
  templateDayId: string | null,
  currentSessionId: string | null,
) {
  const { user } = useAuth();
  const [previousExercises, setPreviousExercises] = useState<SessionExercise[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !templateDayId) {
      setPreviousExercises([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      // Get the most recent completed session for this template day
      const { data: prevSessions } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("template_day_id", templateDayId)
        .not("finished_at", "is", null)
        .neq("id", currentSessionId ?? "")
        .order("started_at", { ascending: false })
        .limit(1);

      if (prevSessions && prevSessions.length > 0) {
        const prevId = prevSessions[0].id;
        const { data } = await supabase
          .from("session_exercises")
          .select("*, exercise:exercises!exercise_id(*), sets:session_sets(*)")
          .eq("session_id", prevId)
          .order("order_index");

        const sorted = (data ?? []).map((ex: SessionExercise) => ({
          ...ex,
          sets: (ex.sets ?? []).sort(
            (a: SessionSet, b: SessionSet) => a.set_index - b.set_index,
          ),
        }));
        setPreviousExercises(sorted);
      } else {
        setPreviousExercises([]);
      }
      setLoading(false);
    })();
  }, [user, templateDayId, currentSessionId]);

  return { previousExercises, loading };
}

/**
 * For each exercise in the current session, load all historical sets from
 * *finished* sessions (excluding the current one) and build a map of the
 * best weight achieved at each rep count or higher.
 *
 * Returns `isPR(exerciseId, weight, reps) → boolean`.
 */
export function usePersonalRecords(
  sessionId: string | null,
  exerciseIds: string[],
) {
  const { user } = useAuth();
  // Map: exerciseId → array of { weight, reps } from all past finished sessions
  const [history, setHistory] = useState<
    Map<string, { weight: number; reps: number }[]>
  >(new Map());

  useEffect(() => {
    if (!user || !sessionId || exerciseIds.length === 0) return;

    (async () => {
      // Get all finished session IDs except current
      const { data: finishedSessions } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", user.id)
        .not("finished_at", "is", null)
        .neq("id", sessionId);

      if (!finishedSessions || finishedSessions.length === 0) {
        setHistory(new Map());
        return;
      }

      const finishedIds = finishedSessions.map((s) => s.id);

      // Get all session_exercises for those sessions that match our exercise IDs
      const { data: rows } = await supabase
        .from("session_exercises")
        .select("exercise_id, sets:session_sets(weight, reps)")
        .in("session_id", finishedIds)
        .in("exercise_id", exerciseIds);

      const map = new Map<string, { weight: number; reps: number }[]>();
      for (const row of rows ?? []) {
        const sets = (row.sets ?? []) as {
          weight: number | null;
          reps: number | null;
        }[];
        const entries = map.get(row.exercise_id) ?? [];
        for (const s of sets) {
          if (s.weight && s.reps) {
            entries.push({ weight: s.weight, reps: s.reps });
          }
        }
        map.set(row.exercise_id, entries);
      }
      setHistory(map);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionId, exerciseIds.join(",")]);

  const isPR = useCallback(
    (
      exerciseId: string,
      weight: number | null,
      reps: number | null,
    ): boolean => {
      if (!weight || !reps || weight <= 0 || reps <= 0) return false;
      const past = history.get(exerciseId);
      if (!past || past.length === 0) return false; // no history = not a PR (first time)
      // PR = no previous set had this weight or more at this many reps or more
      return !past.some((p) => p.weight >= weight && p.reps >= reps);
    },
    [history],
  );

  return { isPR };
}
