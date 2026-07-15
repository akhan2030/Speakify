"use client";

import type { ListeningMapVisual as MapVisual } from "@/lib/mock-test/listeningMapVisual";

/**
 * IELTS-style lettered site/floor map for Listening plan/map labelling.
 */
export default function ListeningMapVisual({ map }: { map: MapVisual }) {
  return (
    <figure className="overflow-hidden rounded-lg border-2 border-[#0d1b35]/20 bg-white shadow-sm">
      <figcaption className="border-b border-slate-200 bg-[#0d1b35] px-3 py-2 text-center text-sm font-semibold text-white">
        {map.title}
      </figcaption>
      <div className="relative bg-[#f4f7fb] p-3 sm:p-4">
        <svg
          viewBox="0 0 100 100"
          className="mx-auto h-auto w-full max-w-lg"
          role="img"
          aria-label={map.title}
        >
          {/* Outer grounds */}
          <rect x="2" y="2" width="96" height="96" fill="#e8eef5" stroke="#94a3b8" strokeWidth="0.6" />
          {/* Building footprint */}
          <rect
            x="14"
            y="14"
            width="72"
            height="68"
            rx="1.5"
            fill="#ffffff"
            stroke="#0d1b35"
            strokeWidth="1.2"
          />
          {/* Internal corridors */}
          <line x1="50" y1="14" x2="50" y2="82" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="14" y1="48" x2="86" y2="48" stroke="#cbd5e1" strokeWidth="2.5" />
          {/* North arrow */}
          <g transform="translate(88, 10)">
            <polygon points="0,-5 3,3 -3,3" fill="#0d1b35" />
            <text x="0" y="8" textAnchor="middle" fontSize="3.2" fontWeight="700" fill="#0d1b35">
              N
            </text>
          </g>
          {/* Landmarks */}
          {(map.landmarks ?? []).map((lm) => (
            <g key={`${lm.label}-${lm.x}-${lm.y}`}>
              <text
                x={lm.x}
                y={lm.y}
                textAnchor="middle"
                fontSize="2.8"
                fill="#64748b"
                fontStyle="italic"
              >
                {lm.label}
              </text>
            </g>
          ))}
          {/* Lettered locations */}
          {map.locations.map((loc) => (
            <g key={loc.letter}>
              <circle
                cx={loc.x}
                cy={loc.y}
                r="4.2"
                fill="#c9972c"
                stroke="#0d1b35"
                strokeWidth="0.7"
              />
              <text
                x={loc.x}
                y={loc.y + 1.2}
                textAnchor="middle"
                fontSize="4"
                fontWeight="700"
                fill="#0d1b35"
              >
                {loc.letter}
              </text>
            </g>
          ))}
        </svg>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          Letters A–{map.locations[map.locations.length - 1]?.letter ?? "G"} mark locations on the map.
          Match each question to a letter from the box.
        </p>
      </div>
    </figure>
  );
}
