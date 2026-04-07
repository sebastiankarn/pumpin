import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Trash2, Trophy } from "lucide-react";
import type { ExerciseType, SessionSet } from "../types";

interface SetRowProps {
  set: SessionSet;
  sessionExerciseId: string;
  disabled: boolean;
  onRemoveSet: (sessionExerciseId: string, setId: string) => void;
  onUpdateSet: (setId: string, updates: Partial<SessionSet>) => void;
  isPR?: boolean;
  exerciseType?: ExerciseType;
}

export default function SetRow({
  set,
  sessionExerciseId,
  disabled,
  onRemoveSet,
  onUpdateSet,
  isPR = false,
  exerciseType = "strength",
}: SetRowProps) {
  // Strength fields
  const [weight, setWeight] = useState(set.weight?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const [rpe, setRpe] = useState(set.rpe?.toString() ?? "");
  const [rest, setRest] = useState(set.rest_seconds?.toString() ?? "");
  // Cardio fields
  const [duration, setDuration] = useState(
    set.duration_seconds
      ? Math.round(set.duration_seconds / 60).toString()
      : "",
  );
  const [distance, setDistance] = useState(set.distance_km?.toString() ?? "");
  const [calories, setCalories] = useState(set.calories?.toString() ?? "");
  const [heartRate, setHeartRate] = useState(
    set.avg_heart_rate?.toString() ?? "",
  );
  // Shared
  const [notes, setNotes] = useState(set.notes ?? "");
  const [showNotes, setShowNotes] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-save on change
  const save = (updates: Partial<SessionSet>) => {
    if (disabled) return;
    // Optimistic: update parent state immediately
    onUpdateSet(set.id, updates);
    // Debounce DB persist
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      supabase.from("session_sets").update(updates).eq("id", set.id).then();
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleDelete = () => {
    // Optimistic: remove from UI immediately
    onRemoveSet(sessionExerciseId, set.id);

    // Persist delete + renumber in background
    (async () => {
      await supabase.from("session_sets").delete().eq("id", set.id);
      const { data: remaining } = await supabase
        .from("session_sets")
        .select("id, set_index")
        .eq("session_exercise_id", sessionExerciseId)
        .order("set_index");
      if (remaining) {
        for (let i = 0; i < remaining.length; i++) {
          if (remaining[i].set_index !== i) {
            await supabase
              .from("session_sets")
              .update({ set_index: i })
              .eq("id", remaining[i].id);
          }
        }
      }
    })();
  };

  const inputClasses =
    "bg-background rounded px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary w-full disabled:opacity-50";

  const cursorToEnd = (e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.target;
    requestAnimationFrame(() => {
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const isCardio = exerciseType === "cardio";

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-12 gap-1 items-center">
        <span className="col-span-1 text-gray-500 text-xs text-center relative">
          {isPR ? (
            <Trophy className="w-3.5 h-3.5 text-yellow-400 mx-auto" />
          ) : (
            set.set_index + 1
          )}
        </span>

        {isCardio ? (
          <>
            <div className="col-span-2">
              <input
                type="number"
                inputMode="numeric"
                value={duration}
                disabled={disabled}
                onFocus={cursorToEnd}
                onChange={(e) => {
                  setDuration(e.target.value);
                  save({
                    duration_seconds: e.target.value
                      ? parseInt(e.target.value) * 60
                      : null,
                  });
                }}
                className={inputClasses}
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                inputMode="decimal"
                value={distance}
                disabled={disabled}
                onFocus={cursorToEnd}
                onChange={(e) => {
                  setDistance(e.target.value);
                  save({
                    distance_km: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  });
                }}
                className={inputClasses}
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                inputMode="numeric"
                value={calories}
                disabled={disabled}
                onFocus={cursorToEnd}
                onChange={(e) => {
                  setCalories(e.target.value);
                  save({
                    calories: e.target.value ? parseInt(e.target.value) : null,
                  });
                }}
                className={inputClasses}
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                inputMode="numeric"
                value={heartRate}
                disabled={disabled}
                onFocus={cursorToEnd}
                onChange={(e) => {
                  setHeartRate(e.target.value);
                  save({
                    avg_heart_rate: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  });
                }}
                className={inputClasses}
                placeholder="—"
              />
            </div>
          </>
        ) : (
          <>
            <div className="col-span-2">
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                disabled={disabled}
                onFocus={cursorToEnd}
                onChange={(e) => {
                  setWeight(e.target.value);
                  save({
                    weight: e.target.value ? parseFloat(e.target.value) : null,
                  });
                }}
                className={inputClasses}
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                disabled={disabled}
                onFocus={cursorToEnd}
                onChange={(e) => {
                  setReps(e.target.value);
                  save({
                    reps: e.target.value ? parseInt(e.target.value) : null,
                  });
                }}
                className={inputClasses}
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                inputMode="decimal"
                value={rpe}
                disabled={disabled}
                onFocus={cursorToEnd}
                onChange={(e) => {
                  setRpe(e.target.value);
                  save({
                    rpe: e.target.value ? parseFloat(e.target.value) : null,
                  });
                }}
                className={inputClasses}
                placeholder="—"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                inputMode="numeric"
                value={rest}
                disabled={disabled}
                onFocus={cursorToEnd}
                onChange={(e) => {
                  setRest(e.target.value);
                  save({
                    rest_seconds: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  });
                }}
                className={inputClasses}
                placeholder="s"
              />
            </div>
          </>
        )}

        <div className="col-span-3 flex gap-1">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`text-xs px-2 py-1.5 rounded flex-1 transition ${
              notes
                ? "bg-primary/20 text-primary"
                : "bg-background text-gray-500"
            }`}
          >
            {notes ? "📝" : "Note"}
          </button>
          {!disabled && (
            <button
              onClick={handleDelete}
              className="text-gray-600 hover:text-danger transition p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {showNotes && (
        <div className="ml-6">
          <input
            type="text"
            value={notes}
            disabled={disabled}
            onChange={(e) => {
              setNotes(e.target.value);
              save({ notes: e.target.value || null });
            }}
            className="w-full bg-background rounded px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Add a note..."
          />
        </div>
      )}
    </div>
  );
}
