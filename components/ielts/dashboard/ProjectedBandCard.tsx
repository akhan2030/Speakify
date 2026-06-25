"use client";

type ProjectionData = {
  projectedBand: number | null;
  weeklyBandGain: number;
  onTrack: boolean;
  message: string;
};

export default function ProjectedBandCard({
  projection,
  target,
  daysRemaining,
}: {
  projection: ProjectionData;
  target: number;
  daysRemaining: number | null;
}) {
  const { projectedBand, weeklyBandGain, onTrack, message } = projection;

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        onTrack
          ? "border-green-200 bg-green-50/40"
          : "border-amber-200 bg-amber-50/40"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Projected at current pace
      </p>
      {projectedBand != null ? (
        <>
          <p className="mt-2 text-4xl font-bold text-[#0B3D75]">
            Band {projectedBand.toFixed(1)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {daysRemaining != null
              ? `by exam day (${daysRemaining} days)`
              : "at your current study rate"}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-600">{message}</p>
      )}
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Target band</dt>
          <dd className="font-semibold text-[#0d9488]">{target.toFixed(1)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Estimated weekly gain</dt>
          <dd className="font-semibold text-[#C8923E]">
            +{weeklyBandGain.toFixed(2)} band/week
          </dd>
        </div>
      </dl>
      <p
        className={`mt-4 text-sm font-semibold ${
          onTrack ? "text-green-700" : "text-amber-700"
        }`}
      >
        {onTrack ? "✓ On track for your target" : "⚠ Increase study days to hit target"}
      </p>
      {projectedBand != null ? (
        <p className="mt-2 text-xs text-slate-500">{message}</p>
      ) : null}
    </div>
  );
}
