"use client";

type TrendPoint = {
  date: string;
  label: string;
  band: number;
};

export default function BandTrendChart({
  points,
  target,
}: {
  points: TrendPoint[];
  target: number;
}) {
  if (!points.length) {
    return (
      <p className="text-sm text-slate-500">
        Complete a mock or skill practice to start tracking your band trend.
      </p>
    );
  }

  const width = 320;
  const height = 120;
  const padX = 8;
  const padY = 12;
  const minBand = Math.min(...points.map((p) => p.band), target) - 0.5;
  const maxBand = Math.max(...points.map((p) => p.band), target) + 0.5;
  const range = maxBand - minBand || 1;

  const coords = points.map((p, i) => {
    const x =
      padX + (i / Math.max(1, points.length - 1)) * (width - padX * 2);
    const y =
      height - padY - ((p.band - minBand) / range) * (height - padY * 2);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const targetY =
    height - padY - ((target - minBand) / range) * (height - padY * 2);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-md"
        role="img"
        aria-label="Band score trend chart"
      >
        <line
          x1={padX}
          y1={targetY}
          x2={width - padX}
          y2={targetY}
          stroke="#0d9488"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity={0.6}
        />
        <path
          d={linePath}
          fill="none"
          stroke="#C8923E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c) => (
          <circle key={c.date} cx={c.x} cy={c.y} r="4" fill="#0B3D75" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-slate-500">
        {coords.map((c) => (
          <span key={c.date}>{c.label}</span>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Dashed line = target Band {target.toFixed(1)}
      </p>
    </div>
  );
}
