"use client";

export type SpeakingRole = {
  name: string;
  description?: string;
  lines?: string[];
};

export type SpeakingPromptProps = {
  title?: string;
  mode?: "pair" | "group" | "roleplay";
  prompt?: string;
  steps?: string[];
  roles?: SpeakingRole[] | string[];
  successCriteria?: string[];
  teacherNote?: string;
};

function normalizeRoles(roles: SpeakingRole[] | string[] = []): SpeakingRole[] {
  return roles.map((r) =>
    typeof r === "string" ? { name: r } : r
  );
}

export default function SpeakingPrompt({
  title = "Speaking",
  mode = "pair",
  prompt,
  steps = [],
  roles = [],
  successCriteria = [],
  teacherNote = "Practise with your partner or group. Your teacher will listen and give feedback — this is not an AI chat.",
}: SpeakingPromptProps) {
  const roleCards = normalizeRoles(roles);
  const modeLabel =
    mode === "group" ? "Group work" : mode === "roleplay" ? "Role-play" : "Pair work";

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
            Speaking
          </p>
          <span className="rounded-md border border-slate-200 bg-[#f7f4ef] px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {modeLabel}
          </span>
        </div>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h3>
        {prompt ? (
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">{prompt}</p>
        ) : null}

        {steps.length > 0 ? (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}
      </div>

      {roleCards.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {roleCards.map((role) => (
            <div
              key={role.name}
              className="rounded-2xl border border-slate-200 bg-[#fcfbf8] p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6a1f]">
                Role
              </p>
              <h4 className="mt-1 text-base font-semibold text-slate-900">
                {role.name}
              </h4>
              {role.description ? (
                <p className="mt-2 text-sm text-slate-600">{role.description}</p>
              ) : null}
              {role.lines?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
                  {role.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {successCriteria.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-800">Success criteria</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {successCriteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <aside className="rounded-xl border border-[#d4c4a0] bg-[#f7f4ef] px-4 py-3 text-sm text-slate-700">
        <span className="font-semibold text-[#8a6a1f]">Teacher-led · </span>
        {teacherNote}
      </aside>
    </section>
  );
}
