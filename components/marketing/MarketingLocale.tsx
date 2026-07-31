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
      "Thirteen micro-levels from AB through C2.2 — matching the classroom pathway.",
    "hub.pathwayWeeks": "4 weeks",
    "hub.pathwayCta": "Start this level",
    "category.test-prep": "Test Prep",
    "category.general-english": "General English",
    "category.specialty": "Specialty Programs",
    "categoryDesc.test-prep":
      "Exam-focused programmes with mock tests, band tracking, and AI feedback.",
    "categoryDesc.general-english":
      "Structured CEFR pathway from AB through C2.2 — 13 micro-levels with weekly lessons and certificates.",
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
    "hub.forkEyebrow": "Two ways to prepare",
    "hub.forkCoursesTitle": "Enroll in a full programme",
    "hub.forkCoursesBody":
      "Structured Accelerator courses with lessons, drills, vocabulary, and mock exams built in.",
    "hub.forkCoursesMeta": "From 1,200 SAR · 6–10 weeks",
    "hub.forkCoursesCta": "Browse courses below",
    "hub.forkMockEyebrow": "Just want to practice?",
    "hub.forkMockTitle": "Take a Mock Exam",
    "hub.forkMockBody":
      "Full IELTS Academic simulation — all 4 skills, real timing, AI scoring plus human review. Buy one mock or a pack. No course signup.",
    "hub.forkMockMeta": "From 169 SAR · ~3 hours · 5 unique mocks",
    "hub.forkMockCta": "View mock exams →",
    "mockExams.heroEyebrow": "IELTS Academic · Full mock exams",
    "mockExams.heroTitle": "Full IELTS Academic Mock Exams",
    "mockExams.heroSubtitle":
      "Real exam conditions. AI + human evaluation. No course enrollment required.",
    "mockExams.heroTrust":
      "Every Writing and Speaking result is reviewed by a certified Speakify IELTS trainer.",
    "mockExams.individualTitle": "Choose your mock",
    "mockExams.individualSubtitle":
      "Five distinct Academic mocks — buy individually or save with a pack below.",
    "mockExams.skillsLine": "40 Listening · 40 Reading · 2 Writing · Speaking",
    "mockExams.durationLine": "~3 hours · Real exam conditions",
    "mockExams.retakesLine": "Unlimited retakes after purchase",
    "mockExams.buyMock": "Buy Mock #{n}",
    "mockExams.startMock": "Start Mock #{n} →",
    "mockExams.packsTitle": "Better value — mock packs",
    "mockExams.packsSubtitle": "Save when you buy multiple mocks upfront.",
    "mockExams.pack3Name": "3-Mock Pack",
    "mockExams.pack5Name": "5-Mock Pack",
    "mockExams.buypack3": "Buy 3-Mock Pack",
    "mockExams.buypack5": "Buy 5-Mock Pack",
    "mockExams.pack3Unlocks": "Unlocks Mocks #1, #2, and #3",
    "mockExams.pack5Unlocks": "Unlocks all 5 Academic mocks · Valid 6 months",
    "mockExams.bestValue": "Best value",
    "mockExams.acceleratorIncluded": "Your Accelerator plan already includes all 5 mocks.",
    "mockExams.goToLobby": "Go to mock exams",
    "mockExams.footerNote":
      "Mock-only purchase unlocks the mock exam lobby and the specific mock(s) you paid for — not the full Accelerator dashboard.",
    "mockExams.acceleratorUpsell": "Want lessons and daily practice too?",
    "mockExams.browseAccelerator": "Browse IELTS Accelerator courses",
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
      "١٣ مستوى فرعياً من AB إلى C2.2 — نفس مسار نظام الفصول الدراسية.",
    "hub.pathwayWeeks": "٤ أسابيع",
    "hub.pathwayCta": "ابدأ هذا المستوى",
    "category.test-prep": "التحضير للاختبارات",
    "category.general-english": "الإنجليزية العامة",
    "category.specialty": "برامج متخصصة",
    "categoryDesc.test-prep":
      "برامج مركّزة على الاختبار مع محاكاة وتتبع الباند وتغذية راجعة بالذكاء الاصطناعي.",
    "categoryDesc.general-english":
      "مسار CEFR من AB إلى C2.2 — ١٣ مستوى فرعياً مع دروس أسبوعية وشهادات.",
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
    "hub.forkEyebrow": "طريقتان للتحضير",
    "hub.forkCoursesTitle": "سجّل في برنامج كامل",
    "hub.forkCoursesBody":
      "دورات Accelerator منظمة مع دروس وتدريبات ومفردات ومحاكاة مدمجة.",
    "hub.forkCoursesMeta": "من ١٬٢٠٠ ريال · ٦–١٠ أسابيع",
    "hub.forkCoursesCta": "تصفّح الدورات أدناه",
    "hub.forkMockEyebrow": "تريد التدريب فقط؟",
    "hub.forkMockTitle": "اختبار محاكاة",
    "hub.forkMockBody":
      "محاكاة آيلتس أكاديمي كاملة — ٤ مهارات، توقيت حقيقي، تقييم بالذكاء الاصطناعي ومراجعة بشرية. بدون التسجيل في دورة.",
    "hub.forkMockMeta": "من ١٦٩ ريال · ~٣ ساعات · ٥ محاكاة",
    "hub.forkMockCta": "عرض المحاكاة ←",
    "mockExams.heroEyebrow": "آيلتس أكاديمي · محاكاة كاملة",
    "mockExams.heroTitle": "محاكاة آيلتس أكاديمي كاملة",
    "mockExams.heroSubtitle": "ظروف الاختبار الحقيقية. ذكاء اصطناعي + مراجعة بشرية. بدون التسجيل في دورة.",
    "mockExams.heroTrust": "كل نتيجة كتابة وتحدث تُراجع من مدرب آيلتس معتمد في سبيكيفاي.",
    "mockExams.individualTitle": "اختر محاكاتك",
    "mockExams.individualSubtitle": "٥ محاكاة أكاديمية مميزة — اشترِ واحدة أو وفّر مع الباقة.",
    "mockExams.skillsLine": "٤٠ استماع · ٤٠ قراءة · ٢ كتابة · تحدث",
    "mockExams.durationLine": "~٣ ساعات · ظروف حقيقية",
    "mockExams.retakesLine": "إعادة غير محدودة بعد الشراء",
    "mockExams.buyMock": "اشترِ محاكاة #{n}",
    "mockExams.startMock": "ابدأ محاكاة #{n} ←",
    "mockExams.packsTitle": "قيمة أفضل — باقات المحاكاة",
    "mockExams.packsSubtitle": "وفّر عند شراء عدة محاكاة.",
    "mockExams.pack3Name": "باقة ٣ محاكاة",
    "mockExams.pack5Name": "باقة ٥ محاكاة",
    "mockExams.buypack3": "اشترِ باقة ٣",
    "mockExams.buypack5": "اشترِ باقة ٥",
    "mockExams.pack3Unlocks": "تفتح المحاكاة #١ و#٢ و#٣",
    "mockExams.pack5Unlocks": "تفتح كل المحاكاة الخمس · صالحة ٦ أشهر",
    "mockExams.bestValue": "أفضل قيمة",
    "mockExams.acceleratorIncluded": "خطة Accelerator تشمل كل المحاكاة الخمس.",
    "mockExams.goToLobby": "اذهب للمحاكاة",
    "mockExams.footerNote": "شراء المحاكاة فقط يفتح lobby المحاكاة — وليس لوحة الدورة الكاملة.",
    "mockExams.acceleratorUpsell": "تريد دروساً وتدريباً يومياً أيضاً؟",
    "mockExams.browseAccelerator": "تصفّح دورات Accelerator",
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
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get("lang");
      if (urlLang === "ar" || urlLang === "en") {
        setLangState(urlLang);
        localStorage.setItem(STORAGE_KEY, urlLang);
        return;
      }
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
