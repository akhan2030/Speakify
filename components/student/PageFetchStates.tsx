"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import StudentSidebar, { type ActivePage } from "@/components/StudentSidebar";
import { isProgramStudentPath } from "@/lib/programType";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#c9972c]" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  error,
  activePage = "dashboard",
  embedded = false,
}: {
  error: string;
  activePage?: ActivePage;
  embedded?: boolean;
}) {
  if (embedded) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="font-bold text-red-500">Error: {error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-[#0d1b35] px-6 py-2 text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StudentSidebar activePage={activePage} />
      <div className="ml-[200px] flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="font-bold text-red-500">Error: {error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-[#0d1b35] px-6 py-2 text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export function PageShell({
  activePage,
  loading,
  error,
  children,
  loadingMessage,
  embedded: embeddedProp,
}: {
  activePage: ActivePage;
  loading: boolean;
  error: string | null;
  children: ReactNode;
  loadingMessage?: string;
  embedded?: boolean;
}) {
  const pathname = usePathname();
  const embedded = embeddedProp ?? isProgramStudentPath(pathname);

  if (loading) {
    if (embedded) {
      return (
        <main className="flex min-h-screen flex-1 items-center justify-center p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#c9972c]" />
            <p className="text-gray-600">{loadingMessage ?? "Loading..."}</p>
          </div>
        </main>
      );
    }
    return (
      <div className="flex min-h-screen bg-slate-50">
        <StudentSidebar activePage={activePage} />
        <main className="ml-[200px] flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#c9972c]" />
            <p className="text-gray-600">{loadingMessage ?? "Loading..."}</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} activePage={activePage} embedded={embedded} />;
  }

  if (embedded) {
    return <main className="min-h-screen flex-1">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StudentSidebar activePage={activePage} />
      <main className="ml-[200px] min-h-screen flex-1">{children}</main>
    </div>
  );
}
