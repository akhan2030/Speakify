"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type Point = { skill: string; score: number };

export default function SkillRadarChart({ data }: { data: Point[] }) {
  const chartData = data.map((d) => ({
    skill: d.skill,
    score: d.score,
    fullMark: 9,
  }));

  return (
    <div className="mx-auto h-[300px] w-full max-w-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="rgba(255,255,255,0.15)" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 9]}
            tick={{ fill: "#64748b", fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            name="Band"
            dataKey="score"
            stroke="#c9972c"
            fill="rgba(201, 151, 44, 0.35)"
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
