"use client";

type ChartData = {
  title: string;
  countries: string[];
  years: number[];
  values: number[][];
};

export default function MockWritingChart({ data }: { data: ChartData }) {
  const maxVal = Math.max(...data.values.flat(), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-center text-sm font-bold text-[#0d1b35]">{data.title}</h3>
      <div className="mt-4 flex items-end justify-center gap-6 overflow-x-auto pb-2">
        {data.years.map((year, yi) => (
          <div key={year} className="flex shrink-0 flex-col items-center gap-2">
            <div className="flex h-40 items-end gap-1">
              {data.countries.map((country, ci) => {
                const val = data.values[ci][yi];
                const h = (val / maxVal) * 100;
                const colors = ["#0d9488", "#c9972c", "#6366f1"];
                return (
                  <div key={country} className="flex w-8 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-slate-600">{val}%</span>
                    <div
                      className="w-full rounded-t"
                      style={{ height: `${h}%`, minHeight: 4, backgroundColor: colors[ci] }}
                      title={`${country} ${year}: ${val}%`}
                    />
                  </div>
                );
              })}
            </div>
            <span className="text-xs font-bold text-slate-700">{year}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs">
        {data.countries.map((country, i) => {
          const colors = ["#0d9488", "#c9972c", "#6366f1"];
          return (
            <span key={country} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: colors[i] }}
              />
              {country}
            </span>
          );
        })}
      </div>
    </div>
  );
}
