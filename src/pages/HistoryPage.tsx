import { useNavigate } from "react-router-dom";
import { useWorkoutSessions } from "../hooks/useWorkout";
import { ArrowLeft, ChevronRight } from "lucide-react";
import EmptyState from "../components/EmptyState";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { sessions, loading } = useWorkoutSessions();

  const completedSessions = sessions.filter((s) => s.finished_at);

  // Group by month
  const grouped = completedSessions.reduce<
    Record<string, typeof completedSessions>
  >((acc, session) => {
    const date = new Date(session.started_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {});

  const monthLabel = (key: string) => {
    const [year, month] = key.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long" },
    );
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
          <h1 className="text-white font-semibold text-lg">Workout History</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : completedSessions.length === 0 ? (
          <EmptyState type="history" />
        ) : (
          Object.keys(grouped)
            .sort()
            .reverse()
            .map((key) => (
              <div key={key} className="mb-6">
                <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                  {monthLabel(key)} · {grouped[key].length} workouts
                </h2>
                <div className="gradient-divider mb-3" />
                <div className="space-y-2">
                  {grouped[key].map((session) => (
                    <button
                      key={session.id}
                      onClick={() => navigate(`/workout/${session.id}/summary`)}
                      className="w-full glass glass-hover glass-shimmer rounded-xl p-4 flex items-center gap-3 text-left transition tap-flash active:scale-[0.98]"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {session.template_day?.name ?? "Workout"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(session.started_at).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            },
                          )}{" "}
                          · {session.duration_minutes} min
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))}
                </div>
              </div>
            ))
        )}
      </main>
    </div>
  );
}
