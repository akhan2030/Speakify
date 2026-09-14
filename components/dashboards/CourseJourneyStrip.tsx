"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { journeyStepMap, type ProgramJourney } from "@/lib/dashboards/programJourneys";

export type CourseJourneyNode = {
  key: string;
  score: string;
  attempted: boolean;
  href: string;
  percent: number;
  status: string;
  nextCopy: string;
};

export default function CourseJourneyStrip({
  journey,
  nodes,
}: {
  journey: ProgramJourney;
  nodes: CourseJourneyNode[];
}) {
  const [active, setActive] = useState(nodes[0]?.key ?? journey.steps[0]?.key ?? "");
  const metaByKey = journeyStepMap(journey);

  function jump(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <div className="journey">
        <div className="journey-head">
          <h2>{journey.title}</h2>
          <span>{journey.caption}</span>
        </div>
        <div className="rail">
          {nodes.map((node, i) => {
            const meta = metaByKey[node.key];
            const next = nodes[i + 1];
            const nextMeta = next ? metaByKey[next.key] : null;
            const connectorFill = next
              ? node.attempted
                ? meta.hex
                : next.attempted
                  ? nextMeta?.hex
                  : null
              : null;
            return (
              <Fragment key={node.key}>
                <button
                  type="button"
                  className={`node${active === node.key ? " active" : ""}${node.attempted ? " attempted" : ""}`}
                  style={{ ["--c" as string]: meta.color }}
                  onClick={() => jump(node.key)}
                >
                  <div className="dot">{meta.icon}</div>
                  <div className="name">{meta.label}</div>
                  <div className="score">{node.score}</div>
                </button>
                {next ? (
                  <div
                    className={`connector${connectorFill ? " done" : ""}`}
                    style={connectorFill ? { background: connectorFill } : undefined}
                  />
                ) : null}
              </Fragment>
            );
          })}
        </div>
      </div>

      {nodes.map((node) => {
        const meta = metaByKey[node.key];
        return (
          <div key={node.key} id={node.key} className="skill-card" style={{ ["--c" as string]: meta.color }}>
            <div className="skill-top">
              <div className="n">
                <span className="skill-order">{meta.order}</span>
                <h3>{meta.label}</h3>
              </div>
              <span className={`skill-status${node.attempted ? " on" : ""}`}>{node.status}</span>
            </div>
            <div className="skill-bar">
              <div className="skill-bar-fill" style={{ width: `${node.percent}%` }} />
            </div>
            <div className="skill-foot">
              <span>{node.nextCopy}</span>
              <Link href={node.href}>{node.attempted ? "Practice →" : "Start →"}</Link>
            </div>
          </div>
        );
      })}
    </>
  );
}
