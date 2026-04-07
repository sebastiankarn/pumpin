import { useState } from "react";
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

  const handleAdd = () => {
    const val = parseFloat(inputValue);
    if (!val || val <= 0) return;
    onAdd(val, unit);
    setInputValue("");
  };

  // Convert to display unit
  const displayLogs = logs.map((l) => {
    let w = l.weight;
    if (l.unit !== unit) {
      w = l.unit === "kg" ? w * 2.20462 : w / 2.20462;
    }
    return {
      date: new Date(l.logged_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weight: Math.round(w * 10) / 10,
    };
  });

  const latest = displayLogs[displayLogs.length - 1];
  const first = displayLogs[0];
  const diff =
    latest && first
      ? Math.round((latest.weight - first.weight) * 10) / 10
      : null;

  return (
    <div className="bg-surface rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Body Weight</h3>
        {latest && (
          <span className="text-gray-400 text-xs">
            {latest.weight} {unit}
            {diff !== null && diff !== 0 && (
              <span
                className={diff < 0 ? "text-green-400 ml-1" : "text-red-400 ml-1"}
              >
                {diff > 0 ? "+" : ""}
                {diff}
              </span>
            )}
          </span>
        )}
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
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
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
              itemStyle={{ color: "#60a5fa" }}
              formatter={(value) => [`${value} ${unit}`, "Weight"]}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#60a5fa"
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
