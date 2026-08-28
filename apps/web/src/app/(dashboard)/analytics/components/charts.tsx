"use client";

export function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-48 items-end justify-between gap-2">
      {data.map((value, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="min-h-[4px] w-full rounded-t-md bg-gradient-to-t from-[var(--accent)] to-[var(--accent-gold)] opacity-80 transition-opacity hover:opacity-100"
            style={{ height: `${(value / max) * 100}%` }}
          />
          <span className="text-[var(--text-muted)] text-xs">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function PlatformPie({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;

  if (total === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-[var(--text-muted)] text-sm">
        Belum ada data platform
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          {data.map((item, i) => {
            const percentage = (item.value / total) * 100;
            const dashArray = `${percentage} ${100 - percentage}`;
            const offset = 100 - cumulative;
            cumulative += percentage;
            return (
              <circle
                key={i}
                cx="18"
                cy="18"
                r="15.91549431"
                fill="transparent"
                stroke={item.color}
                strokeWidth="3"
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-lg">{total}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[var(--text-secondary)]">{item.name}</span>
            </div>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
