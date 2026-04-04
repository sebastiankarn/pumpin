import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useData";
import { useTheme } from "../contexts/ThemeContext";
import { ArrowLeft, Sun, Moon, Monitor, LogOut, Save } from "lucide-react";
import type { DashboardWidget } from "../types";

const DEFAULT_WIDGETS: DashboardWidget[] = ["stats", "volume", "chart", "recentWorkouts"];
const WIDGET_LABELS: Record<DashboardWidget, string> = {
  stats: "Stats Grid",
  volume: "Volume Breakdown",
  chart: "Progress Chart",
  recentWorkouts: "Recent Workouts",
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

  // Sync local state once profile finishes loading
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setWidgets(profile.dashboard_widgets ?? DEFAULT_WIDGETS);
    }
  }, [profile]);

  const handleSave = async () => {
    const trimmed = displayName.trim();
    await updateProfile({
      display_name: trimmed || null,
      dashboard_widgets: widgets,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleWidget = (w: DashboardWidget) => {
    setSaved(false);
    setWidgets((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w],
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
          <h1 className="text-white font-semibold text-lg">Settings</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Display Name */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Profile
          </h2>
          <div className="bg-surface rounded-xl p-4 space-y-3">
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
              <p className="text-gray-500 text-sm px-3 py-2.5">
                {user?.email}
              </p>
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
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Appearance
          </h2>
          <div className="bg-surface rounded-xl p-4">
            <div className="flex gap-2">
              {(
                [
                  { value: "auto", icon: Monitor, label: "Auto" },
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
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Dashboard Widgets
          </h2>
          <div className="bg-surface rounded-xl p-4 space-y-2">
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

        {/* Sign Out */}
        <section>
          <button
            onClick={signOut}
            className="w-full bg-surface hover:bg-surface-light rounded-xl py-3 flex items-center justify-center gap-2 text-danger transition"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign Out
          </button>
        </section>
      </main>
    </div>
  );
}
