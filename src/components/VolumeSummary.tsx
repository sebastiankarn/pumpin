import type { VolumeByCategory } from "../types";

export default function VolumeSummary({
  volumeByCategory,
  totalVolume,
  unit = "kg",
}: {
  volumeByCategory: VolumeByCategory;
  totalVolume: number;
  unit?: string;
}) {
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const categories = [
    { key: "push" as const, label: "Push", color: "bg-orange-400" },
    { key: "pull" as const, label: "Pull", color: "bg-amber-400" },
    { key: "legs" as const, label: "Legs", color: "bg-rose-400" },
    { key: "other" as const, label: "Other", color: "bg-stone-400" },
  ];

  return (
    <div className="glass glass-shimmer rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Volume</h3>
        <span className="text-gray-400 text-xs">
          {fmt(totalVolume)} {unit}
        </span>
      </div>

      {/* Bar */}
      {totalVolume > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden bg-background">
          {categories.map(({ key, color }) => {
            const pct = (volumeByCategory[key] / totalVolume) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={key}
                className={`${color} transition-all`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {categories.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs text-white ml-auto">
              {fmt(volumeByCategory[key])} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
