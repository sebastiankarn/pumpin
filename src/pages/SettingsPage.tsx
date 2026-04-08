import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useData";
import { useTheme } from "../contexts/ThemeContext";
import {
  ArrowLeft,
  Sun,
  Moon,
  LogOut,
  Save,
  X,
  Plus,
  ChevronRight,
  Layers,
} from "lucide-react";
import type { DashboardWidget, StatSlot } from "../types";

const DEFAULT_WIDGETS: DashboardWidget[] = [
  "stats",
  "volume",
  "chart",
  "recentWorkouts",
];
const WIDGET_LABELS: Record<DashboardWidget, string> = {
  stats: "Stats Grid",
  volume: "Volume Breakdown",
  chart: "Progress Chart",
  recentWorkouts: "Recent Workouts",
  bodyWeight: "Body Weight Tracker",
};

const ALL_STAT_SLOTS: StatSlot[] = [
  "streak",
  "weekly",
  "monthly",
  "minutes",
  "weeklyMinutes",
  "avgDuration",
  "totalWorkouts",
  "totalMinutes",
];
const STAT_LABELS: Record<StatSlot, string> = {
  streak: "Day Streak",
  weekly: "Workouts This Week",
  monthly: "Workouts This Month",
  minutes: "Minutes This Month",
  weeklyMinutes: "Minutes This Week",
  avgDuration: "Avg. Workout Duration",
  totalWorkouts: "All-Time Workouts",
  totalMinutes: "All-Time Minutes",
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { mode, setMode } = useTheme();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [saved, setSaved] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(
    profile?.dashboard_widgets ?? DEFAULT_WIDGETS,
  );
  const [weeklyGoal, setWeeklyGoal] = useState(profile?.weekly_goal ?? 5);
  const [showWeeklyRing, setShowWeeklyRing] = useState(
    profile?.stats_config?.showWeeklyRing !== false,
  );
  const [statsSlots, setStatsSlots] = useState<StatSlot[]>(
    profile?.stats_config?.slots ?? ["streak", "monthly", "minutes"],
  );

  // Sync local state once profile finishes loading
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setWidgets(profile.dashboard_widgets ?? DEFAULT_WIDGETS);
      setWeeklyGoal(profile.weekly_goal ?? 5);
      setShowWeeklyRing(profile.stats_config?.showWeeklyRing !== false);
      setStatsSlots(
        profile.stats_config?.slots ?? ["streak", "monthly", "minutes"],
      );
    }
  }, [profile]);

  const handleSave = async () => {
    const trimmed = displayName.trim();
    await updateProfile({ display_name: trimmed || null });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleWidget = (w: DashboardWidget) => {
    setWidgets((prev) => {
      const next = prev.includes(w)
        ? prev.filter((x) => x !== w)
        : [...prev, w];
      updateProfile({ dashboard_widgets: next });
      return next;
    });
  };

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <header className="sticky top-0 z-10 glass-header px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 -ml-2 text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-semibold text-lg">Settings</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full pb-24">
        {/* Display Name */}
        <section className="space-y-3">
          <h2 className="text-sm font-light text-gray-400 uppercase tracking-wide">
            Profile
          </h2>
          <div className="glass rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setSaved(false);
                }}
                placeholder={user?.email?.split("@")[0] ?? "Your name"}
                className="w-full bg-background rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
                maxLength={50}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Email</label>
              <p className="text-gray-500 text-sm px-3 py-2.5">{user?.email}</p>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white font-medium text-sm px-4 py-2 rounded-lg transition"
            >
              <Save className="w-4 h-4" />
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
        </section>

        {/* Theme */}
        <section className="space-y-3">
          <h2 className="text-sm font-light text-gray-400 uppercase tracking-wide">
            Workout
          </h2>
          <button
            onClick={() => navigate("/templates")}
            className="w-full glass glass-hover rounded-2xl p-4 flex items-center gap-3 transition"
          >
            <Layers className="w-5 h-5 text-primary" />
            <div className="flex-1 text-left">
              <p className="text-sm text-white font-medium">Workout Splits</p>
              <p className="text-xs text-gray-500">
                Create & manage your splits
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </section>

        {/* Appearance */}
        <section className="space-y-3">
          <h2 className="text-sm font-light text-gray-400 uppercase tracking-wide">
            Appearance
          </h2>
          <div className="glass rounded-2xl p-4">
            <div className="flex gap-2">
              {(
                [
                  { value: "light", icon: Sun, label: "Light" },
                  { value: "dark", icon: Moon, label: "Dark" },
                ] as const
              ).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg transition ${
                    mode === value
                      ? "bg-primary/20 text-primary"
                      : "bg-background text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard Widgets */}
        <section className="space-y-3">
          <h2 className="text-sm font-light text-gray-400 uppercase tracking-wide">
            Dashboard Widgets
          </h2>
          <div className="glass rounded-2xl p-4 space-y-2">
            {(Object.keys(WIDGET_LABELS) as DashboardWidget[]).map((w) => (
              <button
                key={w}
                onClick={() => toggleWidget(w)}
                className="w-full flex items-center justify-between py-2 px-1"
              >
                <span className="text-sm text-white">{WIDGET_LABELS[w]}</span>
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    widgets.includes(w) ? "bg-primary" : "bg-gray-600"
                  } relative`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      widgets.includes(w) ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Stats Grid Config */}
        <section className="space-y-3">
          <h2 className="text-sm font-light text-gray-400 uppercase tracking-wide">
            Stats Grid
          </h2>
          <div className="glass rounded-2xl p-4 space-y-4">
            {/* Weekly Ring Toggle */}
            <div>
              <button
                onClick={() => {
                  const next = !showWeeklyRing;
                  setShowWeeklyRing(next);
                  updateProfile({
                    stats_config: { slots: statsSlots, showWeeklyRing: next },
                  });
                }}
                className="w-full flex items-center justify-between py-1"
              >
                <div>
                  <span className="text-sm text-white">Weekly Goal Ring</span>
                  <p className="text-xs text-gray-500">
                    Progress ring on dashboard
                  </p>
                </div>
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    showWeeklyRing ? "bg-primary" : "bg-gray-600"
                  } relative`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      showWeeklyRing ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Weekly Goal (only when ring is on) */}
            {showWeeklyRing && (
              <>
                <div className="gradient-divider" />
                <div>
                  <label className="text-xs text-gray-400 block mb-2">
                    Workouts per week goal
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setWeeklyGoal(n);
                          updateProfile({ weekly_goal: n });
                        }}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                          weeklyGoal === n
                            ? "bg-primary/20 text-primary"
                            : "bg-background text-gray-400 hover:text-white"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="gradient-divider" />

            {/* Stat Slots */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Stats to display (tap to remove)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {statsSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => {
                      if (statsSlots.length <= 1) return;
                      const next = statsSlots.filter((s) => s !== slot);
                      setStatsSlots(next);
                      updateProfile({
                        stats_config: { slots: next, showWeeklyRing },
                      });
                    }}
                    className="flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-medium px-3 py-1.5 rounded-full transition hover:bg-primary/25"
                  >
                    {STAT_LABELS[slot]}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
              {statsSlots.length < ALL_STAT_SLOTS.length && (
                <div className="flex flex-wrap gap-2">
                  {ALL_STAT_SLOTS.filter((s) => !statsSlots.includes(s)).map(
                    (slot) => (
                      <button
                        key={slot}
                        onClick={() => {
                          const next = [...statsSlots, slot];
                          setStatsSlots(next);
                          updateProfile({
                            stats_config: { slots: next, showWeeklyRing },
                          });
                        }}
                        className="flex items-center gap-1.5 bg-background text-gray-400 text-xs font-medium px-3 py-1.5 rounded-full transition hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                        {STAT_LABELS[slot]}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Units */}
        <section className="space-y-3">
          <h2 className="text-sm font-light text-gray-400 uppercase tracking-wide">
            Units
          </h2>
          <div className="glass rounded-2xl p-4">
            <div className="flex gap-2">
              {(["kg", "lbs"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => updateProfile({ weight_unit: u })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                    (profile?.weight_unit ?? "kg") === u
                      ? "bg-primary/20 text-primary"
                      : "bg-background text-gray-400 hover:text-white"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Sign Out */}
        <section>
          <button
            onClick={signOut}
            className="w-full glass glass-hover rounded-xl py-3 flex items-center justify-center gap-2 text-danger transition"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign Out
          </button>
        </section>
      </main>
    </div>
  );
}
