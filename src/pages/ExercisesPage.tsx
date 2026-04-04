import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExercises } from "../hooks/useData";
import { ArrowLeft, Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { Exercise } from "../types";

export default function ExercisesPage() {
  const navigate = useNavigate();
  const { exercises, loading, addExercise, updateExercise, deleteExercise } =
    useExercises();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const handleAdd = async () => {
    if (!newName.trim() || !newMuscle.trim()) return;
    await addExercise({
      name: newName.trim(),
      muscle_group: newMuscle.trim(),
      equipment: newEquipment.trim() || null,
      video_url: newVideoUrl.trim() || null,
    });
    setNewName("");
    setNewMuscle("");
    setNewEquipment("");
    setNewVideoUrl("");
    setShowAdd(false);
  };

  const startEdit = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setNewName(exercise.name);
    setNewMuscle(exercise.muscle_group);
    setNewEquipment(exercise.equipment ?? "");
    setNewVideoUrl(exercise.video_url ?? "");
  };

  const handleEdit = async () => {
    if (!editingId || !newName.trim() || !newMuscle.trim()) return;
    await updateExercise(editingId, {
      name: newName.trim(),
      muscle_group: newMuscle.trim(),
      equipment: newEquipment.trim() || null,
      video_url: newVideoUrl.trim() || null,
    });
    cancelEdit();
  };

  const handleDelete = async (id: string) => {
    await deleteExercise(id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName("");
    setNewMuscle("");
    setNewEquipment("");
    setNewVideoUrl("");
  };

  const exerciseForm = (
    onSave: () => void,
    onCancel: () => void,
    saveLabel: string,
  ) => (
    <div className="bg-surface rounded-xl p-4 mb-4 space-y-2">
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
          list="muscle-groups-page"
        />
        <datalist id="muscle-groups-page">
          {muscleGroups.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <input
          type="text"
          value={newEquipment}
          onChange={(e) => setNewEquipment(e.target.value)}
          className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Equipment"
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
          onClick={onCancel}
          className="flex-1 bg-surface-light text-gray-300 py-2 rounded-lg text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!newName.trim() || !newMuscle.trim()}
          className="flex-1 bg-primary text-white py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 -ml-2 text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-semibold text-lg">Exercises</h1>
          <div className="flex-1" />
          <button
            onClick={() => {
              cancelEdit();
              setShowAdd(true);
            }}
            className="p-2 text-primary"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search exercises..."
          />
        </div>

        {showAdd &&
          exerciseForm(handleAdd, () => setShowAdd(false), "Add Exercise")}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          muscleGroups.map((group) => {
            const groupExercises = filtered.filter(
              (e) => e.muscle_group === group,
            );
            if (groupExercises.length === 0) return null;
            return (
              <div key={group} className="mb-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  {group}
                </p>
                <div className="space-y-1">
                  {groupExercises.map((exercise) =>
                    editingId === exercise.id ? (
                      <div key={exercise.id}>
                        {exerciseForm(handleEdit, cancelEdit, "Save")}
                      </div>
                    ) : (
                      <div
                        key={exercise.id}
                        className="bg-surface rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">
                              {exercise.name}
                            </p>
                            <div className="flex items-center gap-2">
                              {exercise.equipment && (
                                <p className="text-gray-500 text-xs">
                                  {exercise.equipment}
                                </p>
                              )}
                              {exercise.video_url && (
                                <a
                                  href={exercise.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-red-400 hover:text-red-300 text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  ▶ Video
                                </a>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => startEdit(exercise)}
                            className="text-gray-500 hover:text-primary p-1 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!exercise.is_global && (
                            <button
                              onClick={() => handleDelete(exercise.id)}
                              className="text-gray-500 hover:text-danger p-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
