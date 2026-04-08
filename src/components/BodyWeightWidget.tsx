import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Plus } from "lucide-react";
import type { BodyWeightLog } from "../types";

type TimeRange = "week" | "month" | "year" | "total";

export default function BodyWeightWidget({
  logs,
  unit,
  onAdd,
}: {
  logs: BodyWeightLog[];
  unit: "kg" | "lbs";
  onAdd: (weight: number, unit: "kg" | "lbs") => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [range, setRange] = useState<TimeRange>("month");

  const handleAdd = () => {
    const val = parseFloat(inputValue);
    if (!val || val <= 0) return;
    onAdd(val, unit);
    setInputValue("");
  };

  // Filter logs by range
  const filteredLogs = useMemo(() => {
    if (range === "total") return logs;
    const now = new Date();
    let since: Date;
    if (range === "week") {
      since = new Date(now);
      const dow = now.getDay();
      since.setDate(now.getDate() - ((dow + 6) % 7));
      since.setHours(0, 0, 0, 0);
    } else if (range === "month") {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      since = new Date(now.getFullYear(), 0, 1);
    }
    return logs.filter((l) => new Date(l.logged_at) >= since);
  }, [logs, range]);

  // Convert to display unit
  const displayLogs = filteredLogs.map((l, i) => {
    let w = l.weight;
    if (l.unit !== unit) {
      w = l.unit === "kg" ? w * 2.20462 : w / 2.20462;
    }
    return {
      _index: i,
      date: new Date(l.logged_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weight: Math.round(w * 100) / 100,
    };
  });

  const latest = displayLogs[displayLogs.length - 1];
  const first = displayLogs[0];
  const diff =
    latest && first
      ? Math.round((latest.weight - first.weight) * 100) / 100
      : null;

  return (
    <div className="glass glass-shimmer rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Body Weight</h3>
        <div className="flex items-center gap-2">
          {latest && (
            <span className="text-gray-400 text-xs">
              {latest.weight.toFixed(2)} {unit}
              {diff !== null && diff !== 0 && (
                <span
                  className={
                    diff < 0 ? "text-amber-400 ml-1" : "text-rose-400 ml-1"
                  }
                >
                  {diff > 0 ? "+" : ""}
                  {diff.toFixed(2)}
                </span>
              )}
            </span>
          )}
          <div className="flex bg-background/50 rounded-lg p-0.5 text-xs">
            {(["week", "month", "year", "total"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-1 rounded-md capitalize transition ${
                  range === r ? "bg-primary/20 text-primary" : "text-gray-400"
                }`}
              >
                {r === "total" ? "All" : r.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick log */}
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={`${latest?.weight ?? "0"} ${unit}`}
          className="flex-1 bg-background rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue}
          className="bg-primary/20 text-primary px-3 rounded-lg hover:bg-primary/30 transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Chart */}
      {displayLogs.length >= 2 && (
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={displayLogs}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              allowDuplicatedCategory={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f1f1f",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#9ca3af" }}
              itemStyle={{ color: "#f97316" }}
              formatter={(value) => [
                `${Number(value).toFixed(2)} ${unit}`,
                "Weight",
              ]}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#colorWeight)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {displayLogs.length === 0 && (
        <p className="text-gray-500 text-xs text-center">
          Log your first weigh-in above
        </p>
      )}
    </div>
  );
}
