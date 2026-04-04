import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  useTemplates,
  useTemplateDays,
  useTemplateDayExercises,
  useExercises,
  useUserProfile,
} from "../hooks/useData";
import { supabase } from "../lib/supabase";
import ExercisePicker from "../components/ExercisePicker";
import {
  ArrowLeft,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { TemplateDayExercise } from "../types";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    templates,
    loading,
    setTemplates,
    reload: reloadTemplates,
  } = useTemplates();
  const { profile, updateProfile } = useUserProfile();
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleSelectTemplate = async (templateId: string) => {
    await updateProfile({
      active_template_id: templateId,
      current_day_index: 0,
    });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (profile?.active_template_id === templateId) {
      await updateProfile({ active_template_id: null, current_day_index: 0 });
    }
    await supabase.from("templates").delete().eq("id", templateId);
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const handleRenameTemplate = async (templateId: string, newName: string) => {
    await supabase
      .from("templates")
      .update({ name: newName })
      .eq("id", templateId);
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, name: newName } : t)),
    );
  };

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
          <h1 className="text-white font-semibold text-lg">Workout Splits</h1>
          <div className="flex-1" />
          <button
            onClick={() => setShowCreate(true)}
            className="p-2 text-primary"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-3">
        {showCreate && user && (
          <CreateTemplate
            userId={user.id}
            onCreated={() => {
              setShowCreate(false);
              reloadTemplates();
            }}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-3">No workout splits yet.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-primary text-sm"
            >
              Create your first split
            </button>
          </div>
        ) : (
          templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isActive={profile?.active_template_id === template.id}
              isExpanded={expandedTemplate === template.id}
              onToggle={() =>
                setExpandedTemplate(
                  expandedTemplate === template.id ? null : template.id,
                )
              }
              onSelect={() => handleSelectTemplate(template.id)}
              onDelete={() => handleDeleteTemplate(template.id)}
              onRename={(name) => handleRenameTemplate(template.id, name)}
            />
          ))
        )}
      </main>
    </div>
  );
}

function TemplateCard({
  template,
  isActive,
  isExpanded,
  onToggle,
  onSelect,
  onDelete,
  onRename,
}: {
  template: { id: string; name: string; is_public: boolean };
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const {
    days,
    loading: daysLoading,
    reload: reloadDays,
  } = useTemplateDays(isExpanded ? template.id : null);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(template.name);
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const [editingDayName, setEditingDayName] = useState<string | null>(null);
  const [dayNameValue, setDayNameValue] = useState("");

  const handleRename = () => {
    if (renameValue.trim()) {
      onRename(renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleAddDay = async () => {
    if (!newDayName.trim()) return;
    await supabase.from("template_days").insert({
      id: crypto.randomUUID(),
      template_id: template.id,
      day_index: days.length,
      name: newDayName.trim(),
    });
    setNewDayName("");
    setShowAddDay(false);
    reloadDays();
  };

  const handleDeleteDay = async (dayId: string) => {
    await supabase.from("template_days").delete().eq("id", dayId);
    reloadDays();
  };

  const handleRenameDayStart = (dayId: string, currentName: string) => {
    setEditingDayName(dayId);
    setDayNameValue(currentName);
  };

  const handleRenameDaySave = async (dayId: string) => {
    if (dayNameValue.trim()) {
      await supabase
        .from("template_days")
        .update({ name: dayNameValue.trim() })
        .eq("id", dayId);
      reloadDays();
    }
    setEditingDayName(null);
  };

  const handleMoveDay = async (dayIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? dayIndex - 1 : dayIndex + 1;
    const current = days.find((d) => d.day_index === dayIndex);
    const target = days.find((d) => d.day_index === targetIndex);
    if (!current || !target) return;
    await Promise.all([
      supabase
        .from("template_days")
        .update({ day_index: targetIndex })
        .eq("id", current.id),
      supabase
        .from("template_days")
        .update({ day_index: dayIndex })
        .eq("id", target.id),
    ]);
    reloadDays();
  };

  return (
    <div
      className={`bg-surface rounded-xl overflow-hidden ${
        isActive ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex-1 px-4 py-3 flex items-center gap-3 text-left"
        >
          <div className="flex-1">
            {isRenaming ? (
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  className="bg-surface-light rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename();
                  }}
                  className="text-primary p-1"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{template.name}</p>
                {isActive && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            )}
            {template.is_public && (
              <p className="text-gray-500 text-xs">Public template</p>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {/* Split actions */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => {
                setRenameValue(template.name);
                setIsRenaming(true);
              }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary px-2 py-1 bg-surface-light rounded-lg transition"
            >
              <Pencil className="w-3 h-3" />
              Rename
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-danger px-2 py-1 bg-surface-light rounded-lg transition"
            >
              <Trash2 className="w-3 h-3" />
              Delete Split
            </button>
          </div>

          {daysLoading ? (
            <div className="flex justify-center py-3">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            days.map((day) => (
              <div key={day.id}>
                <div className="flex items-center gap-1">
                  {editingDayName === day.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={dayNameValue}
                        onChange={(e) => setDayNameValue(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleRenameDaySave(day.id)
                        }
                        className="flex-1 bg-surface-light rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameDaySave(day.id)}
                        className="text-primary p-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setEditingDayId(editingDayId === day.id ? null : day.id)
                      }
                      className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-sm flex items-center justify-between"
                    >
                      <span>
                        <span className="text-gray-400">
                          Day {day.day_index + 1}:
                        </span>{" "}
                        <span className="text-white">{day.name}</span>
                      </span>
                      {editingDayId === day.id ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                  )}
                  {editingDayName !== day.id && (
                    <>
                      <button
                        onClick={() => handleMoveDay(day.day_index, "up")}
                        disabled={day.day_index === 0}
                        className="text-gray-600 hover:text-primary p-1 transition disabled:opacity-20 disabled:hover:text-gray-600"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveDay(day.day_index, "down")}
                        disabled={day.day_index === days.length - 1}
                        className="text-gray-600 hover:text-primary p-1 transition disabled:opacity-20 disabled:hover:text-gray-600"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRenameDayStart(day.id, day.name)}
                        className="text-gray-600 hover:text-primary p-1 transition"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteDay(day.id)}
                        className="text-gray-600 hover:text-danger p-1 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
                {editingDayId === day.id && (
                  <TemplateDayEditor templateDayId={day.id} />
                )}
              </div>
            ))
          )}

          {/* Add Day */}
          {showAddDay ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDay()}
                className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Day name"
                autoFocus
              />
              <button
                onClick={handleAddDay}
                disabled={!newDayName.trim()}
                className="text-primary px-3 py-2 text-sm disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddDay(false);
                  setNewDayName("");
                }}
                className="text-gray-400 px-2 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddDay(true)}
              className="w-full border border-dashed border-gray-700 rounded-lg py-2 flex items-center justify-center gap-1 text-gray-500 hover:border-primary hover:text-primary text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Day
            </button>
          )}

          {!isActive && (
            <button
              onClick={onSelect}
              className="w-full bg-primary text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 mt-2"
            >
              <Check className="w-4 h-4" />
              Use This Split
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateDayEditor({ templateDayId }: { templateDayId: string }) {
  const {
    exercises: dayExercises,
    loading,
    reload,
  } = useTemplateDayExercises(templateDayId);
  const { exercises: allExercises } = useExercises();
  const [showPicker, setShowPicker] = useState(false);
  const [editingDefaults, setEditingDefaults] = useState<string | null>(null);

  const handleAddExercise = async (exerciseId: string) => {
    await supabase.from("template_day_exercises").insert({
      id: crypto.randomUUID(),
      template_day_id: templateDayId,
      exercise_id: exerciseId,
      order_index: dayExercises.length,
      default_sets: null,
      default_reps: null,
      default_rpe: null,
      default_rest_seconds: null,
    });
    setShowPicker(false);
    reload();
  };

  const handleRemoveExercise = async (id: string) => {
    await supabase.from("template_day_exercises").delete().eq("id", id);
    reload();
  };

  const handleUpdateDefaults = async (
    id: string,
    updates: Partial<TemplateDayExercise>,
  ) => {
    const { default_sets, default_reps, default_rpe, default_rest_seconds } =
      updates;
    await supabase
      .from("template_day_exercises")
      .update({ default_sets, default_reps, default_rpe, default_rest_seconds })
      .eq("id", id);
    reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-1 ml-2 border-l-2 border-gray-700 pl-3 space-y-2 py-2">
      {dayExercises.map((de) => (
        <div key={de.id} className="bg-background rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">
                {de.exercise?.name ?? "Unknown"}
              </p>
              <p className="text-gray-500 text-xs">
                {de.exercise?.muscle_group}
              </p>
            </div>
            <button
              onClick={() =>
                setEditingDefaults(editingDefaults === de.id ? null : de.id)
              }
              className="text-xs text-gray-400 hover:text-primary px-2 py-1 rounded transition"
            >
              {de.default_sets || de.default_reps ? "✓ Defaults" : "Defaults"}
            </button>
            <button
              onClick={() => handleRemoveExercise(de.id)}
              className="text-gray-600 hover:text-danger p-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {editingDefaults === de.id && (
            <DefaultsEditor
              exercise={de}
              onSave={(updates) => handleUpdateDefaults(de.id, updates)}
              onClose={() => setEditingDefaults(null)}
            />
          )}
        </div>
      ))}

      <button
        onClick={() => setShowPicker(true)}
        className="w-full border border-dashed border-gray-700 rounded-lg py-2 flex items-center justify-center gap-1 text-gray-500 hover:border-primary hover:text-primary text-xs transition"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Exercise
      </button>

      {showPicker && (
        <ExercisePicker
          exercises={allExercises}
          onSelect={handleAddExercise}
          onClose={() => setShowPicker(false)}
          title="Add Exercise to Day"
        />
      )}
    </div>
  );
}

function DefaultsEditor({
  exercise,
  onSave,
  onClose,
}: {
  exercise: TemplateDayExercise;
  onSave: (updates: Partial<TemplateDayExercise>) => void;
  onClose: () => void;
}) {
  const [sets, setSets] = useState(exercise.default_sets?.toString() ?? "");
  const [reps, setReps] = useState(exercise.default_reps?.toString() ?? "");
  const [rpe, setRpe] = useState(exercise.default_rpe?.toString() ?? "");
  const [rest, setRest] = useState(
    exercise.default_rest_seconds?.toString() ?? "",
  );

  const handleSave = () => {
    onSave({
      default_sets: sets ? parseInt(sets) : null,
      default_reps: reps ? parseInt(reps) : null,
      default_rpe: rpe ? parseFloat(rpe) : null,
      default_rest_seconds: rest ? parseInt(rest) : null,
    });
    onClose();
  };

  const inputClasses =
    "w-full bg-surface-light rounded px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-gray-400">
        Pre-fill these when starting a workout:
      </p>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Sets</label>
          <input
            type="number"
            inputMode="numeric"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className={inputClasses}
            placeholder="—"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Reps</label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className={inputClasses}
            placeholder="—"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">RPE</label>
          <input
            type="number"
            inputMode="decimal"
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            className={inputClasses}
            placeholder="—"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Rest (s)</label>
          <input
            type="number"
            inputMode="numeric"
            value={rest}
            onChange={(e) => setRest(e.target.value)}
            className={inputClasses}
            placeholder="—"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 text-gray-400 text-xs py-1.5 rounded-lg bg-surface-light"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 text-primary text-xs py-1.5 rounded-lg bg-primary/10"
        >
          Save Defaults
        </button>
      </div>
    </div>
  );
}

function CreateTemplate({
  userId,
  onCreated,
  onCancel,
}: {
  userId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [dayNames, setDayNames] = useState([""]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || dayNames.every((d) => !d.trim())) return;
    setSaving(true);

    const templateId = crypto.randomUUID();
    await supabase.from("templates").insert({
      id: templateId,
      name: name.trim(),
      created_by: userId,
      is_public: false,
    });

    const days = dayNames
      .filter((d) => d.trim())
      .map((d, i) => ({
        id: crypto.randomUUID(),
        template_id: templateId,
        day_index: i,
        name: d.trim(),
      }));

    if (days.length > 0) {
      await supabase.from("template_days").insert(days);
    }

    setSaving(false);
    onCreated();
  };

  return (
    <div className="bg-surface rounded-xl p-4 space-y-3">
      <h3 className="text-white font-medium">New Workout Split</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-surface-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Split name (e.g. Upper Lower PPL)"
        autoFocus
      />
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Workout Days:</p>
        {dayNames.map((day, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-gray-500 text-sm py-2 w-6 text-center">
              {i + 1}
            </span>
            <input
              type="text"
              value={day}
              onChange={(e) => {
                const updated = [...dayNames];
                updated[i] = e.target.value;
                setDayNames(updated);
              }}
              className="flex-1 bg-surface-light rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={`Day ${i + 1} name`}
            />
          </div>
        ))}
        <button
          onClick={() => setDayNames([...dayNames, ""])}
          className="text-primary text-sm flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Day
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-surface-light text-gray-300 py-2 rounded-lg text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="flex-1 bg-primary text-white py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}
