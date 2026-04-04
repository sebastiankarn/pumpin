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

export default function VolumeChart({
  data,
}: {
  data: VolumeDataPoint[];
}) {
  const [metric, setMetric] = useState<"volume" | "minutes">("volume");

  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-4">
        <p className="text-gray-500 text-sm text-center">
          No workout data for this period
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Progress</h3>
        <div className="flex bg-background rounded-lg overflow-hidden text-xs">
          <button
            onClick={() => setMetric("volume")}
            className={`px-3 py-1.5 transition ${
              metric === "volume"
                ? "bg-primary/20 text-primary"
                : "text-gray-400"
            }`}
          >
            Volume
          </button>
          <button
            onClick={() => setMetric("minutes")}
            className={`px-3 py-1.5 transition ${
              metric === "minutes"
                ? "bg-primary/20 text-primary"
                : "text-gray-400"
            }`}
          >
            Minutes
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
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
                ? [`${Number(value).toLocaleString()} kg`, "Volume"]
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
