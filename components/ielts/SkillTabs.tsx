"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export type SkillTab = {
  id: string;
  label: string;
};

export default function SkillTabs({
  tabs,
  defaultTab,
  children,
}: {
  tabs: SkillTab[];
  defaultTab: string;
  children: (activeTab: string) => React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") ?? defaultTab;

  const setTab = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <div>
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-b-2 border-[#c9972c] bg-[#c9972c]/10 text-[#0d1b35]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-[#0d1b35]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="mt-6">{children(activeTab)}</div>
    </div>
  );
}
