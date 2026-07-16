"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MarketingLang = "en" | "ar";

const STORAGE_KEY = "speakify_marketing_lang";

const STRINGS: Record<MarketingLang, Record<string, string>> = {
  en: {
    "hub.eyebrow": "Speakify LMS",
    "hub.title": "Find your programme",
    "hub.subtitle":
      "Search and filter every Speakify course — compare duration, level, and outcomes in one place.",
    "hub.search": "Search courses",
    "hub.searchPlaceholder": "Search by name, exam, or goal…",
    "hub.filterCategory": "Category",
    "hub.filterLevel": "Level",
    "hub.filterDuration": "Duration",
    "hub.allCategories": "All categories",
    "hub.allLevels": "All levels",
    "hub.placementCta": "Take free placement test",
    "hub.clearFilters": "Clear filters",
    "hub.recommendedEyebrow": "Based on your placement",
    "hub.recommendedTitle": "Your recommended course",
    "hub.recommendedBody":
      "Your placement result (Band {band}) points to this track. Start here, or browse everything below.",
    "hub.recommendedBadge": "Recommended for you",
    "hub.viewCourse": "View Course",
    "hub.results": "Matching courses",
    "hub.noResults": "No courses match those filters. Try clearing a filter.",
    "hub.ieltsAcademic": "IELTS Academic",
    "hub.ieltsAcademicDesc":
      "Foundation, Plus, and Elite — graph/report writing and Academic skills",
    "hub.viewAllAcademic": "View all Academic →",
    "hub.ieltsGt": "IELTS General Training",
    "hub.ieltsGtDesc":
      "Foundation, Plus, and Elite — letters, everyday reading, and GT skills",
    "hub.viewAllGt": "View all General Training →",
    "hub.otherTestPrep": "Other test prep",
    "hub.pathwayGridTitle": "Full CEFR pathway",
    "hub.pathwayGridSubtitle":
      "Twelve micro-levels from A1.1 to C2.2 — about 4 weeks each.",
    "hub.pathwayWeeks": "4 weeks",
    "hub.pathwayCta": "Start this level",
    "category.test-prep": "Test Prep",
    "category.general-english": "General English",
    "category.specialty": "Specialty Programs",
    "categoryDesc.test-prep":
      "Exam-focused programmes with mock tests, band tracking, and AI feedback.",
    "categoryDesc.general-english":
      "Structured CEFR pathway from A1.1 through C2.2 — 12 micro-levels with weekly lessons and certificates.",
    "categoryDesc.specialty":
      "Purpose-built courses for professional and young learners.",
    "level.Beginner": "Beginner",
    "level.Intermediate": "Intermediate",
    "level.Advanced": "Advanced",
    "duration.all": "Any duration",
    "duration.short": "≤ 4 weeks",
    "duration.standard": "5–8 weeks",
    "duration.long": "9+ weeks",
    "duration.flexible": "Self-paced",
    "nav.signIn": "Sign in",
    "nav.register": "Register",
    "nav.viewAll": "View All Programs",
  },
  ar: {
    "hub.eyebrow": "سبيكيفاي",
    "hub.title": "اختر برنامجك",
    "hub.subtitle":
      "ابحث وصفِّ كل برامج سبيكيفاي — قارن المدة والمستوى والنتائج في مكان واحد.",
    "hub.search": "بحث عن الدورات",
    "hub.searchPlaceholder": "ابحث بالاسم أو الاختبار أو الهدف…",
    "hub.filterCategory": "التصنيف",
    "hub.filterLevel": "المستوى",
    "hub.filterDuration": "المدة",
    "hub.allCategories": "كل التصنيفات",
    "hub.allLevels": "كل المستويات",
    "hub.placementCta": "اختبار تحديد المستوى مجاناً",
    "hub.clearFilters": "مسح الفلاتر",
    "hub.recommendedEyebrow": "بناءً على اختبارك",
    "hub.recommendedTitle": "الدورة الموصى بها لك",
    "hub.recommendedBody":
      "نتيجة اختبارك (الباند {band}) تشير إلى هذا المسار. ابدأ من هنا أو تصفّح الكل أدناه.",
    "hub.recommendedBadge": "موصى بها لك",
    "hub.viewCourse": "عرض الدورة",
    "hub.results": "الدورات المطابقة",
    "hub.noResults": "لا توجد دورات تطابق هذه الفلاتر. جرّب مسح أحد الفلاتر.",
    "hub.ieltsAcademic": "آيلتس أكاديمي",
    "hub.ieltsAcademicDesc":
      "تأسيسي، بلس، وإليت — كتابة التقارير والمهارات الأكاديمية",
    "hub.viewAllAcademic": "عرض كل الأكاديمي ←",
    "hub.ieltsGt": "آيلتس جنرال",
    "hub.ieltsGtDesc":
      "تأسيسي، بلس، وإليت — الخطابات والقراءة اليومية ومهارات الجنرال",
    "hub.viewAllGt": "عرض كل الجنرال ←",
    "hub.otherTestPrep": "اختبارات أخرى",
    "hub.pathwayGridTitle": "مسار CEFR الكامل",
    "hub.pathwayGridSubtitle":
      "١٢ مستوى فرعياً من A1.1 إلى C2.2 — حوالي ٤ أسابيع لكل مستوى.",
    "hub.pathwayWeeks": "٤ أسابيع",
    "hub.pathwayCta": "ابدأ هذا المستوى",
    "category.test-prep": "التحضير للاختبارات",
    "category.general-english": "الإنجليزية العامة",
    "category.specialty": "برامج متخصصة",
    "categoryDesc.test-prep":
      "برامج مركّزة على الاختبار مع محاكاة وتتبع الباند وتغذية راجعة بالذكاء الاصطناعي.",
    "categoryDesc.general-english":
      "مسار CEFR من A1.1 إلى C2.2 — ١٢ مستوى فرعياً مع دروس أسبوعية وشهادات.",
    "categoryDesc.specialty": "دورات مخصّصة للمحترفين والمتعلمين الصغار.",
    "level.Beginner": "مبتدئ",
    "level.Intermediate": "متوسط",
    "level.Advanced": "متقدم",
    "duration.all": "أي مدة",
    "duration.short": "٤ أسابيع أو أقل",
    "duration.standard": "٥–٨ أسابيع",
    "duration.long": "٩ أسابيع فأكثر",
    "duration.flexible": "بالمرونة الذاتية",
    "nav.signIn": "تسجيل الدخول",
    "nav.register": "سجّل",
    "nav.viewAll": "عرض كل البرامج",
  },
};

type LocaleContextValue = {
  lang: MarketingLang;
  dir: "ltr" | "rtl";
  setLang: (lang: MarketingLang) => void;
  t: (key: string) => string;
};

const MarketingLocaleContext = createContext<LocaleContextValue | null>(null);

export function MarketingLocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<MarketingLang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "ar" || stored === "en") setLangState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((next: MarketingLang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "ar" ? "ar" : "en";
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "ar" ? "ar" : "en";
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = useCallback(
    (key: string) => STRINGS[lang][key] ?? STRINGS.en[key] ?? key,
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      dir: (lang === "ar" ? "rtl" : "ltr") as "ltr" | "rtl",
      setLang,
      t,
    }),
    [lang, setLang, t]
  );

  return (
    <MarketingLocaleContext.Provider value={value}>
      {children}
    </MarketingLocaleContext.Provider>
  );
}

export function useMarketingLocale() {
  const ctx = useContext(MarketingLocaleContext);
  if (!ctx) {
    return {
      lang: "en" as MarketingLang,
      dir: "ltr" as const,
      setLang: () => {},
      t: (key: string) => STRINGS.en[key] ?? key,
    };
  }
  return ctx;
}
