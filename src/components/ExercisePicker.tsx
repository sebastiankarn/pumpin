import { useState } from "react";
import { X, Plus, Search } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Exercise } from "../types";

interface ExercisePickerProps {
  exercises: Exercise[];
  onSelect: (exerciseId: string) => void;
  onClose: () => void;
  title?: string;
}

export default function ExercisePicker({
  exercises,
  onSelect,
  onClose,
  title = "Select Exercise",
}: ExercisePickerProps) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("");
  const [newEquipment, setNewEquipment] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscle_group.toLowerCase().includes(search.toLowerCase()),
  );

  const muscleGroups = [
    ...new Set(exercises.map((e) => e.muscle_group)),
  ].sort();

  const handleAddNew = async () => {
    if (!newName.trim() || !newMuscle.trim()) return;
    // Insert the new exercise
    const { data } = await supabase
      .from("exercises")
      .insert({
        name: newName.trim(),
        muscle_group: newMuscle.trim(),
        equipment: newEquipment.trim() || null,
        video_url: newVideoUrl.trim() || null,
        is_global: false,
      })
      .select()
      .single();

    if (data) {
      onSelect(data.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center">
      <div className="bg-surface w-full max-w-lg max-h-[85svh] rounded-t-2xl sm:rounded-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-light rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Search exercises..."
              autoFocus
            />
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {muscleGroups.map((group) => {
            const groupExercises = filtered.filter(
              (e) => e.muscle_group === group,
            );
            if (groupExercises.length === 0) return null;
            return (
              <div key={group} className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  {group}
                </p>
                <div className="space-y-1">
                  {groupExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => onSelect(exercise.id)}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-white hover:bg-surface-light active:bg-primary/20 transition"
                    >
                      <span className="text-sm">{exercise.name}</span>
                      {exercise.equipment && (
                        <span className="text-xs text-gray-500 ml-2">
                          {exercise.equipment}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && !showAdd && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-3">No exercises found</p>
              <button
                onClick={() => setShowAdd(true)}
                className="text-primary text-sm"
              >
                Create a new exercise
              </button>
            </div>
          )}
        </div>

        {/* Add New Exercise */}
        {!showAdd ? (
          <div className="px-4 py-3 border-t border-gray-700">
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 text-primary text-sm py-2"
            >
              <Plus className="w-4 h-4" />
              Add New Exercise
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-gray-700 space-y-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-surface-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Exercise name"
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newMuscle}
                onChange={(e) => setNewMuscle(e.target.value)}
                className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Muscle group"
                list="muscle-groups"
              />
              <datalist id="muscle-groups">
                {muscleGroups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
              <input
                type="text"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Equipment (optional)"
              />
            </div>
            <input
              type="url"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="w-full bg-surface-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="YouTube link (optional)"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 bg-surface-light text-gray-300 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNew}
                disabled={!newName.trim() || !newMuscle.trim()}
                className="flex-1 bg-primary text-white py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Create & Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
