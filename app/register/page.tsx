import Link from "next/link";
import TeacherInviteRegisterForm from "@/components/register/TeacherInviteRegisterForm";
import { REGISTRATION_PROGRAMS } from "@/lib/registration";
import { buildLoginPath, PROGRAM_LOGIN_PATHS } from "@/lib/courses/loginPaths";

type Props = {
  searchParams?: { token?: string };
};

export default function RegisterIndexPage({ searchParams }: Props) {
  const token = searchParams?.token?.trim();
  if (token) {
    return <TeacherInviteRegisterForm token={token} />;
  }
  const programs = [
    REGISTRATION_PROGRAMS.pathway,
    REGISTRATION_PROGRAMS.ielts,
    REGISTRATION_PROGRAMS["ielts-general"],
    REGISTRATION_PROGRAMS.toefl,
    REGISTRATION_PROGRAMS["step-test"],
    REGISTRATION_PROGRAMS["business-english"],
    REGISTRATION_PROGRAMS["legal-english"],
    REGISTRATION_PROGRAMS["kids-english"],
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] px-4 py-12">
      <div className="w-full max-w-5xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#c9972c]" />
        <h1 className="mt-6 text-3xl font-bold text-white">Speakify Registration</h1>
        <p className="mt-3 text-slate-300">
          Select your course to open the correct registration page — 8 programmes available
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {programs.map((program) => (
            <Link
              key={program.slug}
              href={program.registerPath}
              className="rounded-xl border-2 border-white/10 bg-white/5 p-6 text-left transition-colors hover:border-white/30 hover:bg-white/10"
            >
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: program.accent }}
              >
                {program.tagline}
              </p>
              <p className="mt-2 text-lg font-bold text-white">{program.label}</p>
              <p className="mt-2 text-sm text-slate-400">Register →</p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href={buildLoginPath(PROGRAM_LOGIN_PATHS.home)}
            className="font-semibold text-[#c9972c] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
