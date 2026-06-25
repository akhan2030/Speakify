"use client";



import { forwardRef, type ReactNode } from "react";

import {

  formatBand,

  type PlacementCertificateData,

} from "@/lib/placement/certificate";



type Props = {

  data: PlacementCertificateData;

  whatsappDisplay: string;

};



const MOTIVATIONAL =

  "You already possess the language skills needed to communicate confidently in academic and professional environments. With focused preparation and consistent practice, you are well positioned to progress toward your target IELTS score and unlock new opportunities for study, work, and international success. Every high IELTS score begins with knowing where you stand today. Today marks the first step toward your goal.";



const WHY_SPEAKIFY = [

  "Certified IELTS trainers with proven Saudi learner expertise",

  "AI-powered writing feedback on every essay submission",

  "Daily live sessions and 3× weekly speaking mock tests",

  "94% of students hit their target band within 30 days",

  "Flexible online + in-centre options across Saudi Arabia",

];



function CertificateFooter({ certificateId }: { certificateId: string }) {

  return (

    <footer className="mt-auto bg-[#0d1b35] px-6 py-6 text-white sm:px-8">

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

        <div

          className="mx-auto flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-[#c9972c] bg-[#0d1b35] text-center sm:mx-0"

          aria-label="Speakify GLC seal"

        >

          <span className="text-xl text-[#c9972c]">★</span>

          <span className="mt-1 px-2 text-[0.5rem] font-extrabold uppercase leading-tight tracking-widest text-[#c9972c]">

            Speakify GLC

          </span>

        </div>

        <div className="flex-1 text-center sm:text-left">

          <p className="text-[0.65rem] font-semibold leading-relaxed text-slate-200 sm:text-xs">

            Issued by Speakify Global Language Center, Kingdom of Saudi Arabia

          </p>

          <p className="mt-3 text-xs italic leading-relaxed text-[#c9972c] sm:text-sm">

            Empowering learners to communicate with confidence, achieve

            internationally, and succeed without limits.

          </p>

          <p className="mt-3 font-mono text-[0.65rem] text-slate-300 sm:text-xs">

            Certificate ID: {certificateId}

          </p>

          <p className="mt-1 text-[0.65rem] text-slate-400 sm:text-xs">

            This certificate is valid for enrollment in all Speakify programs

          </p>

        </div>

      </div>

    </footer>

  );

}



function PageShell({

  children,

  className = "",

}: {

  children: ReactNode;

  className?: string;

}) {

  return (

    <section

      className={`certificate-print-page relative flex min-h-[1000px] flex-col overflow-hidden border-[4px] border-[#c9972c] bg-white shadow-xl ${className}`}

    >

      {children}

    </section>

  );

}



const PlacementCertificate = forwardRef<HTMLDivElement, Props>(

  function PlacementCertificate({ data, whatsappDisplay }, ref) {

    const {

      studentName,

      issuedDate,

      certificateId,

      skillRows,

      currentBand,

      targetBand,

      bandGap,

      currentPct,

      targetPct,

      cefrInfo,

      estimatedTimeline,

      purpose,

      showPathwayOption,

      pathwayProgram,

      roadmapWeeks,

    } = data;



    return (

      <div ref={ref} className="certificate-print mx-auto max-w-3xl space-y-8">

        {/* PAGE 1 — Achievement Certificate */}

        <PageShell>

          <div

            aria-hidden

            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"

          >

            <span className="select-none text-[7rem] font-extrabold text-[#c9972c] opacity-[0.03]">

              Speakify

            </span>

          </div>



          <header className="relative z-10 bg-[#0d1b35] px-6 py-7 text-center sm:px-8">

            <p className="text-2xl font-extrabold tracking-tight text-[#c9972c] sm:text-3xl">

              Speakify

            </p>

            <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-[#c9972c]/90 sm:text-sm">

              Global Language Center

            </p>

            <h1 className="mt-4 text-base font-bold leading-snug text-white sm:text-lg">

              IELTS Placement Achievement Certificate

            </h1>

            <div className="mx-auto mt-3 h-1 w-36 rounded-full bg-[#c9972c]" />

          </header>



          <div className="relative z-10 flex flex-1 flex-col px-6 py-6 sm:px-8">

            <div className="text-center">

              <p className="text-base italic text-[#c9972c] sm:text-lg">

                Congratulations,

              </p>

              <p className="mt-2 text-2xl font-bold leading-tight text-[#0d1b35] sm:text-3xl">

                {studentName}

              </p>

              <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-slate-600 sm:text-sm">

                You have successfully completed the Speakify Adaptive IELTS

                Placement Assessment

              </p>

              <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">

                Date issued: {issuedDate}

              </p>

            </div>



            <div className="mt-5 rounded-xl border border-[#c9972c]/40 bg-gradient-to-b from-[#c9972c]/8 to-white p-5">

              <div className="flex flex-wrap items-center justify-center gap-6">

                <div className="flex items-center gap-3">

                  <span className="text-2xl" aria-hidden>

                    🏆

                  </span>

                  <div>

                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">

                      Your IELTS Band

                    </p>

                    <p className="text-4xl font-extrabold text-[#c9972c] sm:text-5xl">

                      {formatBand(currentBand)}

                    </p>

                  </div>

                </div>

                <div className="flex flex-col items-center text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0d1b35] shadow-md sm:h-20 sm:w-20">

                    <span className="text-lg font-bold text-[#c9972c] sm:text-xl">

                      {cefrInfo.cefr}

                    </span>

                  </div>

                  <p className="mt-1.5 text-xs font-bold text-[#0d1b35] sm:text-sm">

                    {cefrInfo.label}

                  </p>

                </div>

              </div>



              <div className="mt-5">

                <div className="flex items-center justify-between text-[0.65rem] font-bold text-[#0d1b35] sm:text-xs">

                  <span>

                    Current:{" "}

                    <span className="text-[#c9972c]">{formatBand(currentBand)}</span>

                  </span>

                  <span className="text-slate-400">→</span>

                  <span>

                    Target:{" "}

                    <span className="text-[#c9972c]">{formatBand(targetBand)}</span>

                  </span>

                </div>

                <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">

                  <div

                    className="absolute inset-y-0 left-0 rounded-full bg-[#c9972c]"

                    style={{ width: `${currentPct}%` }}

                  />

                  {bandGap > 0 ? (

                    <div

                      className="absolute inset-y-0 rounded-full bg-[#c9972c]/25"

                      style={{

                        left: `${currentPct}%`,

                        width: `${Math.max(2, targetPct - currentPct)}%`,

                      }}

                    />

                  ) : null}

                  <div

                    className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#0d1b35] shadow"

                    style={{ left: `calc(${targetPct}% - 7px)` }}

                  />

                </div>

                <p className="mt-1.5 text-center text-[0.65rem] text-slate-500 sm:text-xs">

                  Gap to close: {formatBand(bandGap)} band

                  {bandGap === 1 ? "" : "s"}

                </p>

              </div>

            </div>



            <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-slate-600 sm:text-xs">

              {MOTIVATIONAL}

            </p>



            <div className="mt-4 overflow-hidden rounded-lg border-2 border-[#c9972c]/40">

              <table className="w-full text-xs">

                <thead>

                  <tr className="bg-[#c9972c] text-[#0d1b35]">

                    <th className="px-3 py-2 text-left text-[0.65rem] font-bold uppercase tracking-wide">

                      Skill

                    </th>

                    <th className="px-3 py-2 text-center text-[0.65rem] font-bold uppercase tracking-wide">

                      Band

                    </th>

                    <th className="px-3 py-2 text-center text-[0.65rem] font-bold uppercase tracking-wide">

                      CEFR Level

                    </th>

                  </tr>

                </thead>

                <tbody>

                  {skillRows.map((row, i) => (

                    <tr

                      key={row.label}

                      className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}

                    >

                      <td className="px-3 py-2 font-semibold text-[#0d1b35]">

                        {row.label}

                      </td>

                      <td className="px-3 py-2 text-center font-bold text-[#c9972c]">

                        {formatBand(row.band)}

                      </td>

                      <td className="px-3 py-2 text-center font-medium text-slate-600">

                        {row.cefr}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>



            <div className="mt-4 rounded-xl border-2 border-[#c9972c] bg-[#c9972c]/5 px-4 py-4">

              <h3 className="text-xs font-bold uppercase tracking-wide text-[#c9972c]">

                Your Personalized Learning Path

              </h3>

              <p className="mt-2 text-xs text-[#0d1b35]">

                <span className="font-bold">Target IELTS Band:</span>{" "}

                {formatBand(targetBand)}

                {purpose ? (

                  <span className="text-slate-500"> · {purpose}</span>

                ) : null}

              </p>

              <div className="mt-2 space-y-1.5 text-xs text-[#0d1b35]">

                <p className="font-bold">Recommended Program:</p>

                {showPathwayOption ? (

                  <p>

                    <span className="font-semibold text-[#0d9488]">Option 1:</span>{" "}

                    {pathwayProgram}

                  </p>

                ) : null}

                <p>

                  <span className="font-semibold text-[#0d9488]">

                    Option {showPathwayOption ? "2" : "1"}:

                  </span>{" "}

                  IELTS Accelerator — &ldquo;From Band {formatBand(currentBand)}{" "}

                  to {formatBand(targetBand)} in 30 Days&rdquo;

                </p>

              </div>

              <p className="mt-2 text-xs text-slate-700">

                <span className="font-bold text-[#0d1b35]">Estimated Timeline:</span>{" "}

                {estimatedTimeline}

              </p>

            </div>

          </div>



          <CertificateFooter certificateId={certificateId} />

        </PageShell>



        {/* PAGE 2 — Learning Roadmap */}

        <PageShell>

          <header className="border-b border-[#c9972c]/30 bg-white px-6 py-6 text-center sm:px-8">

            <h2 className="text-xl font-bold text-[#0d1b35] sm:text-2xl">

              Your IELTS Success Roadmap

            </h2>

            <p className="mt-2 text-sm font-semibold text-[#c9972c]">

              Personalised for {studentName} — Target Band{" "}

              {formatBand(targetBand)}

            </p>

          </header>



          <div className="flex flex-1 flex-col px-6 py-6 sm:px-8">

            <div className="overflow-hidden rounded-lg border border-[#c9972c]/40">

              <table className="w-full text-xs">

                <thead>

                  <tr className="bg-[#0d1b35] text-[#c9972c]">

                    <th className="px-3 py-2.5 text-left font-bold">Week</th>

                    <th className="px-3 py-2.5 text-left font-bold">Phase</th>

                    <th className="px-3 py-2.5 text-left font-bold">Focus</th>

                  </tr>

                </thead>

                <tbody>

                  {roadmapWeeks.map((row, i) => (

                    <tr

                      key={row.week}

                      className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}

                    >

                      <td className="px-3 py-2.5 font-bold text-[#c9972c]">

                        Week {row.week}

                      </td>

                      <td className="px-3 py-2.5 font-semibold text-[#0d1b35]">

                        {row.phase}

                      </td>

                      <td className="px-3 py-2.5 text-slate-600">{row.focus}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>



            <div className="mt-5">

              <h3 className="text-sm font-bold text-[#0d1b35]">Why Speakify?</h3>

              <ul className="mt-2 space-y-1 text-xs text-slate-700">

                {WHY_SPEAKIFY.map((item) => (

                  <li key={item} className="flex gap-2">

                    <span className="text-[#c9972c]">✓</span>

                    <span>{item}</span>

                  </li>

                ))}

              </ul>

            </div>



            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <div className="rounded-xl bg-[#0d1b35] p-4 text-white">

                <p className="text-sm font-bold text-[#c9972c]">IELTS Accelerator</p>

                <p className="mt-1 text-2xl font-extrabold">3,800 SAR</p>

                <p className="mt-2 text-xs text-slate-200">

                  30 days to your target band

                </p>

                <p className="mt-3 text-xs font-bold text-[#c9972c]">

                  Reserve My Spot →

                </p>

              </div>

              <div className="rounded-xl border-2 border-[#c9972c] bg-[#c9972c]/5 p-4">

                <p className="text-sm font-bold text-[#0d1b35]">Writing Skills Course</p>

                <p className="mt-1 text-2xl font-extrabold text-[#c9972c]">925 SAR</p>

                <p className="mt-2 text-xs text-slate-600">

                  8 hours of intensive writing coaching

                </p>

                <p className="mt-3 text-xs font-bold text-[#0d9488]">Enrol Now →</p>

              </div>

            </div>



            <blockquote className="mt-5 border-l-4 border-[#c9972c] bg-[#c9972c]/10 px-4 py-3 text-xs italic text-[#0d1b35]">

              &ldquo;I went from 5.5 to 7.0 in 28 days. I couldn&apos;t believe

              it.&rdquo;

              <footer className="mt-2 text-[0.65rem] font-semibold not-italic text-slate-600">

                — Fatima Al-Zahrani, Riyadh

              </footer>

            </blockquote>



            <div className="mt-5 rounded-xl bg-[#25D366] px-4 py-3 text-center print:bg-[#25D366]">

              <p className="text-sm font-bold text-white">

                Chat with our team: {whatsappDisplay}

              </p>

            </div>

          </div>



          <CertificateFooter certificateId={certificateId} />

        </PageShell>

      </div>

    );

  }

);



export default PlacementCertificate;


