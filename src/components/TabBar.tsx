import { useNavigate, useLocation } from "react-router-dom";
import { Home, Clock, Dumbbell, Settings } from "lucide-react";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/history", icon: Clock, label: "History" },
  { path: "/exercises", icon: Dumbbell, label: "Exercises" },
  { path: "/settings", icon: Settings, label: "Settings" },
] as const;

export default function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Hide tab bar during active workout or summary
  if (pathname.startsWith("/workout") || pathname === "/auth") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] px-4 pb-3">
      <div className="glass rounded-2xl mx-auto max-w-md flex items-center justify-around py-2 glass-shimmer">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active =
            path === "/" ? pathname === "/" : pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
                active ? "text-primary" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${active ? "drop-shadow-[0_0_6px_rgba(249,115,22,0.5)] scale-110" : ""}`}
              />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary shadow-[0_0_6px_rgba(249,115,22,0.6)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
