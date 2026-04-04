import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Trash2 } from "lucide-react";
import type { SessionSet } from "../types";

interface SetRowProps {
  set: SessionSet;
  sessionExerciseId: string;
  disabled: boolean;
  onRemoveSet: (sessionExerciseId: string, setId: string) => void;
  onUpdateSet: (setId: string, updates: Partial<SessionSet>) => void;
}

export default function SetRow({
  set,
  sessionExerciseId,
  disabled,
  onRemoveSet,
  onUpdateSet,
}: SetRowProps) {
  const [weight, setWeight] = useState(set.weight?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const [rpe, setRpe] = useState(set.rpe?.toString() ?? "");
  const [rest, setRest] = useState(set.rest_seconds?.toString() ?? "");
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

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-12 gap-1 items-center">
        <span className="col-span-1 text-gray-500 text-xs text-center">
          {set.set_index + 1}
        </span>
        <div className="col-span-2">
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            disabled={disabled}
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
            onChange={(e) => {
              setReps(e.target.value);
              save({ reps: e.target.value ? parseInt(e.target.value) : null });
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
            onChange={(e) => {
              setRpe(e.target.value);
              save({ rpe: e.target.value ? parseFloat(e.target.value) : null });
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
            onChange={(e) => {
              setRest(e.target.value);
              save({
                rest_seconds: e.target.value ? parseInt(e.target.value) : null,
              });
            }}
            className={inputClasses}
            placeholder="s"
          />
        </div>
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
