"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Task1Question } from "@/lib/ielts/writingTaskData";

const CHART_COLORS = ["#0d9488", "#c9972c", "#0d1b35", "#7c3aed", "#94a3b8"];

function ChartFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-center text-sm font-semibold text-[#0d1b35]">{title}</p>
      {children}
    </div>
  );
}

function BarChartVisual({ question }: { question: Task1Question }) {
  const data = question.bar!;
  const chartData = data.categories.map((category, i) => {
    const row: Record<string, string | number> = { category };
    for (const series of data.series) {
      row[series.name] = series.values[i];
    }
    return row;
  });

  return (
    <ChartFrame title={question.chartTitle}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="category" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            label={
              data.yAxisLabel
                ? { value: data.yAxisLabel, angle: -90, position: "insideLeft", style: { fontSize: 11 } }
                : undefined
            }
          />
          <Tooltip />
          <Legend />
          {data.series.map((series) => (
            <Bar key={series.name} dataKey={series.name} fill={series.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function LineChartVisual({ question }: { question: Task1Question }) {
  const data = question.line!;
  const chartData = data.years.map((year, i) => {
    const row: Record<string, string | number> = { year };
    for (const series of data.series) {
      row[series.name] = series.values[i];
    }
    return row;
  });

  return (
    <ChartFrame title={question.chartTitle}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            label={
              data.yAxisLabel
                ? { value: data.yAxisLabel, angle: -90, position: "insideLeft", style: { fontSize: 11 } }
                : undefined
            }
          />
          <Tooltip />
          <Legend />
          {data.series.map((series) => (
            <Line
              key={series.name}
              type="monotone"
              dataKey={series.name}
              stroke={series.color}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function PieChartVisual({ question }: { question: Task1Question }) {
  const segments = question.pie!.segments;

  return (
    <ChartFrame title={question.chartTitle}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-center text-xs font-medium text-slate-500">2010</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={segments.map((s) => ({ ...s, value: Math.round(s.value * 0.9) }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {segments.map((s, i) => (
                  <Cell key={s.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="mb-2 text-center text-xs font-medium text-slate-500">2022</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={segments}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {segments.map((s) => (
                  <Cell key={s.name} fill={s.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartFrame>
  );
}

function TableVisual({ question }: { question: Task1Question }) {
  const table = question.table!;

  return (
    <ChartFrame title={question.chartTitle}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              {table.headers.map((header) => (
                <th
                  key={header}
                  className="border border-slate-200 px-3 py-2 text-left text-xs font-bold text-[#0d1b35]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i} className={i === table.rows.length - 1 ? "bg-slate-50 font-semibold" : ""}>
                {row.map((cell, j) => (
                  <td key={j} className="border border-slate-200 px-3 py-2 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}

function MapVisual({ question }: { question: Task1Question }) {
  const map = question.map!;

  const TownMap = ({ variant }: { variant: "before" | "after" }) => (
    <svg viewBox="0 0 200 160" className="h-auto w-full max-w-[240px] mx-auto">
      <rect width="200" height="160" fill="#f8fafc" stroke="#cbd5e1" />
      <rect x="70" y="55" width="60" height="50" fill={variant === "before" ? "#94a3b8" : "#0d9488"} rx="4" />
      <text x="100" y="82" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
        Town centre
      </text>
      <rect x="20" y="30" width="35" height="25" fill="#c9972c" rx="2" />
      <text x="37" y="46" textAnchor="middle" fill="white" fontSize="7">
        Housing
      </text>
      {variant === "after" ? (
        <>
          <rect x="145" y="25" width="40" height="30" fill="#7c3aed" rx="2" />
          <text x="165" y="43" textAnchor="middle" fill="white" fontSize="7">
            Business
          </text>
          <rect x="10" y="110" width="50" height="20" fill="#0d1b35" rx="2" />
          <text x="35" y="124" textAnchor="middle" fill="white" fontSize="7">
            Bypass
          </text>
        </>
      ) : (
        <>
          <rect x="145" y="40" width="35" height="35" fill="#64748b" rx="2" />
          <text x="162" y="60" textAnchor="middle" fill="white" fontSize="7">
            Farmland
          </text>
          <line x1="100" y1="105" x2="100" y2="150" stroke="#475569" strokeWidth="3" />
          <text x="100" y="156" textAnchor="middle" fill="#475569" fontSize="7">
            Main road
          </text>
        </>
      )}
      <circle cx="100" cy="130" r="8" fill="#0d9488" opacity="0.3" />
      <text x="100" y="133" textAnchor="middle" fill="#0d1b35" fontSize="6">
        Station
      </text>
    </svg>
  );

  return (
    <ChartFrame title={question.chartTitle}>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-center text-sm font-semibold text-[#0d1b35]">{map.beforeLabel}</p>
          <TownMap variant="before" />
        </div>
        <div>
          <p className="mb-2 text-center text-sm font-semibold text-[#0d1b35]">{map.afterLabel}</p>
          <TownMap variant="after" />
        </div>
      </div>
    </ChartFrame>
  );
}

function ProcessVisual({ question }: { question: Task1Question }) {
  const steps = question.process!.steps;

  return (
    <ChartFrame title={question.chartTitle}>
      <div className="flex flex-col items-center gap-2 py-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex w-full max-w-md flex-col items-center">
            <div className="w-full rounded-lg border-2 border-[#0d9488] bg-teal-50 px-4 py-2 text-center">
              <p className="text-sm font-bold text-[#0d1b35]">{step.label}</p>
              {step.detail ? (
                <p className="mt-0.5 text-xs text-slate-600">{step.detail}</p>
              ) : null}
            </div>
            {i < steps.length - 1 ? (
              <svg width="24" height="20" viewBox="0 0 24 20" className="text-[#0d9488]" aria-hidden>
                <path d="M12 0 L12 14 M6 10 L12 16 L18 10" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            ) : null}
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}

export default function WritingTaskVisual({ question }: { question: Task1Question }) {
  switch (question.visualType) {
    case "bar":
      return <BarChartVisual question={question} />;
    case "line":
      return <LineChartVisual question={question} />;
    case "pie":
      return <PieChartVisual question={question} />;
    case "table":
      return <TableVisual question={question} />;
    case "map":
      return <MapVisual question={question} />;
    case "process":
      return <ProcessVisual question={question} />;
    default:
      return null;
  }
}
