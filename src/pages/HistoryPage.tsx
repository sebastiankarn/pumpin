import { useNavigate } from "react-router-dom";
import { useWorkoutSessions } from "../hooks/useWorkout";
import { ArrowLeft, ChevronRight } from "lucide-react";

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
      undefined,
      { year: "numeric", month: "long" },
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
          <h1 className="text-white font-semibold text-lg">Workout History</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : completedSessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No completed workouts yet.</p>
          </div>
        ) : (
          Object.keys(grouped)
            .sort()
            .reverse()
            .map((key) => (
              <div key={key} className="mb-6">
                <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                  {monthLabel(key)} · {grouped[key].length} workouts
                </h2>
                <div className="space-y-2">
                  {grouped[key].map((session) => (
                    <button
                      key={session.id}
                      onClick={() => navigate(`/workout/${session.id}`)}
                      className="w-full bg-surface rounded-xl p-4 flex items-center gap-3 text-left active:bg-surface-light transition"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {session.template_day?.name ?? "Workout"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(session.started_at).toLocaleDateString(
                            undefined,
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
