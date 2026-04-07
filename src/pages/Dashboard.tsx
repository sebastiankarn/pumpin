import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  useUserProfile,
  useTemplateDays,
  useTemplates,
} from "../hooks/useData";
import {
  useWorkoutSessions,
  useWorkoutStats,
  useVolumeStats,
} from "../hooks/useWorkout";
import {
  Dumbbell,
  Clock,
  Flame,
  TrendingUp,
  ChevronRight,
  CalendarDays,
  Timer,
  List,
  X,
  SkipForward,
  Sun,
  Moon,
  Monitor,
  Settings,
} from "lucide-react";
import { syncPendingChanges } from "../lib/sync";
import { supabase } from "../lib/supabase";
import type { DashboardWidget, TemplateDay } from "../types";
import LoadingScreen from "../components/LoadingScreen";
import PumpkinLogo from "../components/PumpkinLogo";
import VolumeChart from "../components/VolumeChart";
import VolumeSummary from "../components/VolumeSummary";
import BodyWeightWidget from "../components/BodyWeightWidget";
import { useBodyWeight } from "../hooks/useBodyWeight";
import { useTheme } from "../contexts/ThemeContext";

const DEFAULT_WIDGETS: DashboardWidget[] = [
  "stats",
  "volume",
  "chart",
  "recentWorkouts",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode, setMode } = useTheme();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const {
    sessions,
    loading: sessionsLoading,
    startSession,
    reload: reloadSessions,
  } = useWorkoutSessions();
  const { stats, loading: statsLoading } = useWorkoutStats();
  const { days, loading: daysLoading } = useTemplateDays(
    profile?.active_template_id ?? null,
  );
  const { templates } = useTemplates();
  const [syncing, setSyncing] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [blankName, setBlankName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [promptName, setPromptName] = useState("");
  const [volumeRange, setVolumeRange] = useState<"week" | "month" | "year">(
    "month",
  );
  const {
    chartData,
    volumeByCategory,
    totalVolume,
    loading: volumeLoading,
  } = useVolumeStats(volumeRange);
  const { logs: bodyWeightLogs, addLog: addBodyWeightLog } = useBodyWeight();
  const weightUnit = profile?.weight_unit ?? "kg";
  const widgets: DashboardWidget[] =
    profile?.dashboard_widgets ?? DEFAULT_WIDGETS;
  const [allTemplateDays, setAllTemplateDays] = useState<
    Record<string, TemplateDay[]>
  >({});

  // Load days for all templates when picker opens
  useEffect(() => {
    if (!showDayPicker || templates.length === 0) return;
    (async () => {
      const templateIds = templates.map((t) => t.id);
      const { data } = await supabase
        .from("template_days")
        .select("*")
        .in("template_id", templateIds)
        .order("day_index");
      if (data) {
        const grouped: Record<string, TemplateDay[]> = {};
        for (const d of data) {
          (grouped[d.template_id] ??= []).push(d);
        }
        setAllTemplateDays(grouped);
      }
    })();
  }, [showDayPicker, templates]);

  // Sync pending changes when online
  useEffect(() => {
    const handleOnline = async () => {
      setSyncing(true);
      await syncPendingChanges();
      await reloadSessions();
      setSyncing(false);
    };

    window.addEventListener("online", handleOnline);
    // Also try syncing on mount
    handleOnline();

    return () => window.removeEventListener("online", handleOnline);
  }, [reloadSessions]);

  // Show first-login name prompt once profile loads without a display_name
  useEffect(() => {
    if (
      !profileLoading &&
      profile &&
      profile.display_name === null &&
      !sessionStorage.getItem("name-prompt-dismissed")
    ) {
      setShowNamePrompt(true);
    }
  }, [profileLoading, profile]);

  const handleSetName = async () => {
    const trimmed = promptName.trim();
    if (trimmed) {
      await updateProfile({ display_name: trimmed });
    }
    sessionStorage.setItem("name-prompt-dismissed", "1");
    setShowNamePrompt(false);
  };

  const pageLoading = profileLoading || sessionsLoading || daysLoading;
  if (pageLoading) return <LoadingScreen />;

  const greeting = profile?.display_name ?? user?.email?.split("@")[0] ?? "";

  const currentDay = days[profile?.current_day_index ?? 0];
  const activeSession = sessions.find((s) => !s.finished_at);

  const handleStartWorkout = async () => {
    if (activeSession) {
      navigate(`/workout/${activeSession.id}`);
      return;
    }
    if (!currentDay) {
      navigate("/templates");
      return;
    }

    const session = await startSession(currentDay.id);
    if (session) {
      navigate(`/workout/${session.id}`);
    }
  };

  const handleStartOtherWorkout = async (
    dayId: string,
    blank: boolean,
    sessionName?: string,
  ) => {
    setShowDayPicker(false);
    setBlankName("");
    const name = sessionName?.trim() || (blank ? "Blank Session" : undefined);
    const session = await startSession(dayId, name);
    if (session) {
      const params = new URLSearchParams();
      params.set("scheduled", "false");
      if (blank) params.set("blank", "true");
      navigate(`/workout/${session.id}?${params.toString()}`);
    }
  };

  const handleContinueWorkout = () => {
    if (activeSession) {
      navigate(`/workout/${activeSession.id}`);
    }
  };

  const advanceDay = async () => {
    if (!days.length || !profile) return;
    const nextIndex = (profile.current_day_index + 1) % days.length;
    await updateProfile({ current_day_index: nextIndex });
  };

  return (
    <div className="min-h-svh flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <PumpkinLogo className="w-7 h-7 text-primary" />
          <span className="font-bold text-lg text-white">Pumpin</span>
        </div>
        <div className="flex items-center gap-2">
          {syncing && (
            <span className="text-xs text-warning animate-pulse">
              Syncing...
            </span>
          )}
          <button
            onClick={() =>
              setMode(
                mode === "auto" ? "light" : mode === "light" ? "dark" : "auto",
              )
            }
            className="text-gray-400 hover:text-white transition p-2"
            title={`Theme: ${mode}`}
          >
            {mode === "light" ? (
              <Sun className="w-4.5 h-4.5" />
            ) : mode === "dark" ? (
              <Moon className="w-4.5 h-4.5" />
            ) : (
              <Monitor className="w-4.5 h-4.5" />
            )}
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="text-gray-400 hover:text-white transition p-2"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hey{greeting ? `, ${greeting}` : ""}! 💪
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {activeSession
              ? "You have an active workout — let's finish it!"
              : "Ready to crush today's workout?"}
          </p>
        </div>

        {/* Next Workout CTA */}
        {activeSession ? (
          <button
            onClick={handleContinueWorkout}
            className="w-full bg-warning/20 border border-warning/40 rounded-2xl p-5 text-left flex items-center gap-4 active:scale-[0.98] transition"
          >
            <div className="bg-warning/20 rounded-xl p-3">
              <Timer className="w-7 h-7 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-lg">
                Workout in Progress
              </p>
              <p className="text-gray-400 text-sm">
                {activeSession.name ??
                  activeSession.template_day?.name ??
                  "Active session"}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleStartWorkout}
                className="flex-1 bg-primary/20 border border-primary/40 rounded-2xl p-5 text-left flex items-center gap-4 active:scale-[0.98] transition"
              >
                <div className="bg-primary/20 rounded-xl p-3">
                  <Dumbbell className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-lg truncate">
                    {currentDay
                      ? `Start: ${currentDay.name}`
                      : "Set up a split first"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {currentDay
                      ? `Day ${(profile?.current_day_index ?? 0) + 1} of ${days.length}`
                      : "Go to settings"}
                  </p>
                </div>
              </button>
              {(days.length > 0 || templates.length > 0) && (
                <button
                  onClick={() => setShowDayPicker(true)}
                  className="bg-surface border border-gray-700 rounded-2xl px-4 flex flex-col items-center justify-center gap-1 active:scale-[0.98] transition"
                  title="Choose another workout"
                >
                  <List className="w-5 h-5 text-gray-300" />
                  <span className="text-[10px] text-gray-400">Other</span>
                </button>
              )}
            </div>
            {days.length > 1 && (
              <button
                onClick={advanceDay}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition mx-auto"
              >
                <SkipForward className="w-3 h-3" />
                Skip to next day
              </button>
            )}
          </div>
        )}

        {/* Day Picker Modal */}
        {showDayPicker && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-surface rounded-2xl w-full max-w-md max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold">Choose a workout</h3>
                <button
                  onClick={() => {
                    setShowDayPicker(false);
                    setBlankName("");
                  }}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 space-y-1">
                {templates.map((template) => {
                  const templateDays = allTemplateDays[template.id] ?? [];
                  if (templateDays.length === 0) return null;
                  const isActive = template.id === profile?.active_template_id;
                  return (
                    <div key={template.id}>
                      <p className="text-xs text-gray-500 uppercase tracking-wide px-4 pt-3 pb-1 flex items-center gap-2">
                        {template.name}
                        {isActive && (
                          <span className="text-[10px] text-primary normal-case tracking-normal bg-primary/10 px-1.5 py-0.5 rounded-full">
                            active
                          </span>
                        )}
                      </p>
                      {templateDays.map((day, i) => (
                        <button
                          key={day.id}
                          onClick={() => handleStartOtherWorkout(day.id, false)}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-surface-light transition flex items-center gap-3"
                        >
                          <span className="text-xs text-gray-500 w-6">
                            D{i + 1}
                          </span>
                          <span className="text-white flex-1">{day.name}</span>
                          {isActive &&
                            i === (profile?.current_day_index ?? 0) && (
                              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                Next up
                              </span>
                            )}
                        </button>
                      ))}
                    </div>
                  );
                })}

                {/* Blank session */}
                {currentDay && (
                  <div className="border-t border-gray-700 mt-2 pt-3 px-4 pb-2 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Blank session
                    </p>
                    <input
                      type="text"
                      value={blankName}
                      onChange={(e) => setBlankName(e.target.value)}
                      placeholder="Session name (optional)"
                      className="w-full bg-background rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() =>
                        handleStartOtherWorkout(currentDay.id, true, blankName)
                      }
                      className="w-full text-center py-2.5 rounded-xl bg-primary/20 text-primary font-medium text-sm hover:bg-primary/30 transition"
                    >
                      Start blank session
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {widgets.includes("stats") && !statsLoading && stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Flame className="w-5 h-5 text-orange-400" />}
              label="Streak"
              value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? "s" : ""}`}
            />
            <StatCard
              icon={<CalendarDays className="w-5 h-5 text-blue-400" />}
              label="This Week"
              value={`${stats.workoutsThisWeek} workout${stats.workoutsThisWeek !== 1 ? "s" : ""}`}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              label="This Month"
              value={`${stats.workoutsThisMonth} workouts`}
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-purple-400" />}
              label="Time This Month"
              value={`${stats.minutesThisMonth} min`}
            />
            <StatCard
              icon={<Dumbbell className="w-5 h-5 text-primary-light" />}
              label="Total Workouts"
              value={String(stats.totalWorkouts)}
              className="col-span-2"
            />
          </div>
        )}

        {/* Volume breakdown */}
        {widgets.includes("volume") && !volumeLoading && (
          <VolumeSummary
            volumeByCategory={volumeByCategory}
            totalVolume={totalVolume}
          />
        )}

        {/* Progress chart */}
        {widgets.includes("chart") && !volumeLoading && (
          <div className="space-y-2">
            <div className="flex justify-end">
              <div className="flex bg-surface rounded-lg overflow-hidden text-xs">
                {(["week", "month", "year"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setVolumeRange(r)}
                    className={`px-3 py-1.5 capitalize transition ${
                      volumeRange === r
                        ? "bg-primary/20 text-primary"
                        : "text-gray-400"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <VolumeChart data={chartData} />
          </div>
        )}

        {/* Recent Workouts */}
        {widgets.includes("recentWorkouts") && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">
                Recent Workouts
              </h2>
              <button
                onClick={() => navigate("/history")}
                className="text-primary text-sm"
              >
                See all
              </button>
            </div>
            {sessions.filter((s) => s.finished_at).length === 0 ? (
              <p className="text-gray-500 text-sm">
                No completed workouts yet. Start your first one!
              </p>
            ) : (
              <div className="space-y-2">
                {sessions
                  .filter((s) => s.finished_at)
                  .slice(0, 5)
                  .map((session) => (
                    <button
                      key={session.id}
                      onClick={() => navigate(`/workout/${session.id}/summary`)}
                      className="w-full bg-surface rounded-xl p-4 flex items-center gap-3 text-left active:bg-surface-light transition"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {session.name ??
                            session.template_day?.name ??
                            "Workout"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(session.started_at).toLocaleDateString()} ·{" "}
                          {session.duration_minutes} min
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Body Weight */}
        {widgets.includes("bodyWeight") && (
          <BodyWeightWidget
            logs={bodyWeightLogs}
            unit={weightUnit}
            onAdd={addBodyWeightLog}
          />
        )}

        {/* Quick actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/templates")}
            className="flex-1 bg-surface hover:bg-surface-light rounded-xl py-3 text-sm text-gray-300 transition"
          >
            Splits
          </button>
          <button
            onClick={() => navigate("/exercises")}
            className="flex-1 bg-surface hover:bg-surface-light rounded-xl py-3 text-sm text-gray-300 transition"
          >
            Exercises
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex-1 bg-surface hover:bg-surface-light rounded-xl py-3 text-sm text-gray-300 transition"
          >
            Settings
          </button>
        </div>
      </main>

      {/* First-login name prompt */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center">
              <p className="text-2xl mb-1">🎃</p>
              <h3 className="text-white font-semibold text-lg">
                Welcome to Pumpin!
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                What should we call you?
              </p>
            </div>
            <input
              type="text"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              placeholder={user?.email?.split("@")[0] ?? "Your name"}
              className="w-full bg-background rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={50}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSetName()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  sessionStorage.setItem("name-prompt-dismissed", "1");
                  setShowNamePrompt(false);
                }}
                className="flex-1 bg-background text-gray-300 font-medium py-2.5 rounded-xl text-sm"
              >
                Skip
              </button>
              <button
                onClick={handleSetName}
                className="flex-1 bg-primary text-white font-medium py-2.5 rounded-xl text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`bg-surface rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-white font-semibold text-lg">{value}</p>
    </div>
  );
}
