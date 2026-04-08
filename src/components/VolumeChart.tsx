import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { VolumeDataPoint } from "../types";

type TimeRange = "week" | "month" | "year" | "total";

export default function VolumeChart({
  data,
  unit = "kg",
  range,
  onRangeChange,
}: {
  data: VolumeDataPoint[];
  unit?: string;
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}) {
  const [metric, setMetric] = useState<"volume" | "minutes">("volume");

  // Add unique index to each point so Recharts can distinguish same-date entries
  const indexedData = data.map((d, i) => ({ ...d, _index: i }));

  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl p-4">
        <p className="text-gray-500 text-sm text-center">
          No workout data for this period
        </p>
      </div>
    );
  }

  return (
    <div className="glass glass-shimmer rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Progress</h3>
        <div className="flex gap-1.5">
          <div className="flex bg-background/50 rounded-lg p-0.5 text-xs">
            {(["volume", "minutes"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-2.5 py-1 rounded-md capitalize transition ${
                  metric === m ? "bg-primary/20 text-primary" : "text-gray-400"
                }`}
              >
                {m === "volume" ? "Vol" : "Min"}
              </button>
            ))}
          </div>
          <div className="flex bg-background/50 rounded-lg p-0.5 text-xs">
            {(["week", "month", "year", "total"] as const).map((r) => (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                className={`px-2.5 py-1 rounded-md capitalize transition ${
                  range === r ? "bg-primary/20 text-primary" : "text-gray-400"
                }`}
              >
                {r === "total" ? "All" : r.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={indexedData}>
          <defs>
            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
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
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f1f1f",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#9ca3af" }}
            itemStyle={{ color: "#f97316" }}
            formatter={(value) =>
              metric === "volume"
                ? [`${Number(value).toLocaleString()} ${unit}`, "Volume"]
                : [`${value} min`, "Duration"]
            }
          />
          <Area
            type="monotone"
            dataKey={metric}
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#colorMetric)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
