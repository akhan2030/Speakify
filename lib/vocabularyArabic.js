import OpenAI from "openai";

/** True when text looks like a bilingual-dictionary gloss, not a full definition. */
export function looksLikeShortArabicEquivalent(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  const tokens = t.split(/[\s/|،,]+/).filter(Boolean);
  return tokens.length <= 4 && t.length <= 40;
}

/**
 * Fill missing arabic_equivalent and/or definition_arabic, then persist.
 * Does not block study if OpenAI is unavailable — returns words unchanged.
 *
 * - arabic_equivalent: short lexical gloss (مسؤول)
 * - definition_arabic: full conceptual definition in MSA
 */
export async function ensureArabicDefinitions(supabase, words) {
  if (!Array.isArray(words) || words.length === 0) return words;

  // Promote legacy short glosses stored in definition_arabic.
  let working = words.map((word) => {
    const equivalent = String(word.arabic_equivalent || "").trim();
    const definitionAr = String(word.definition_arabic || "").trim();
    if (!equivalent && looksLikeShortArabicEquivalent(definitionAr)) {
      return {
        ...word,
        arabic_equivalent: definitionAr,
        definition_arabic: "",
        _promotedShortGloss: true,
      };
    }
    return word;
  });

  const missing = working.filter(
    (w) =>
      !String(w.arabic_equivalent || "").trim() ||
      !String(w.definition_arabic || "").trim()
  );
  if (missing.length === 0) {
    // Still persist promotions (short gloss moved to arabic_equivalent).
    await persistArabicFields(
      supabase,
      working.filter((w) => w._promotedShortGloss).map((w) => ({
        id: w.id,
        arabic_equivalent: w.arabic_equivalent,
        definition_arabic: w.definition_arabic,
      }))
    );
    return working.map(stripInternalFlags);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn("[vocabularyArabic] OPENAI_API_KEY missing — cannot fill Arabic");
    return working.map(stripInternalFlags);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const payload = missing.map((w) => ({
      id: w.id,
      word: w.word,
      part_of_speech: w.part_of_speech || "",
      definition: w.definition,
      need_equivalent: !String(w.arabic_equivalent || "").trim(),
      need_definition_arabic: !String(w.definition_arabic || "").trim(),
      existing_equivalent: String(w.arabic_equivalent || "").trim() || null,
      existing_definition_arabic: String(w.definition_arabic || "").trim() || null,
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You write Arabic vocabulary for Saudi IELTS learners. Use natural Modern Standard Arabic that a native speaker would actually use — not stiff legalistic translation. Return only JSON.",
        },
        {
          role: "user",
          content: `For each English headword, provide:

1. arabic_equivalent — a SHORT direct lexical equivalent (1–3 Arabic words max), like a bilingual dictionary entry. Examples: responsible → مسؤول, reduce → يقلل, environment → بيئة. Prefer the most common everyday MSA word. Do NOT write a sentence here.

2. definition_arabic — a natural, concise Arabic definition of the concept (one short sentence). Sound like a clear teacher, not a legal document. Only include fields marked as needed (need_equivalent / need_definition_arabic). Keep existing_* values when need_* is false.

Input:
${JSON.stringify(payload)}

Return JSON:
{ "translations": [ { "id": "uuid", "arabic_equivalent": "...", "definition_arabic": "..." } ] }`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const translations = Array.isArray(parsed.translations) ? parsed.translations : [];
    const byId = new Map(translations.map((row) => [String(row.id), row]));

    const updates = [];
    working = working.map((word) => {
      const existingEq = String(word.arabic_equivalent || "").trim();
      const existingDef = String(word.definition_arabic || "").trim();
      if (existingEq && existingDef && !word._promotedShortGloss) return word;

      const row = byId.get(String(word.id)) || {};
      const arabic_equivalent =
        existingEq || String(row.arabic_equivalent || "").trim();
      const definition_arabic =
        existingDef || String(row.definition_arabic || "").trim();

      if (!arabic_equivalent && !definition_arabic && !word._promotedShortGloss) {
        return word;
      }

      updates.push({
        id: word.id,
        arabic_equivalent,
        definition_arabic,
      });
      return { ...word, arabic_equivalent, definition_arabic };
    });

    await persistArabicFields(supabase, updates);
    return working.map(stripInternalFlags);
  } catch (err) {
    console.warn("[vocabularyArabic] enrichment failed:", err);
    return working.map(stripInternalFlags);
  }
}

function stripInternalFlags(word) {
  if (!word || typeof word !== "object") return word;
  const { _promotedShortGloss, ...rest } = word;
  return rest;
}

async function persistArabicFields(supabase, updates) {
  if (!updates.length) return;

  await Promise.all(
    updates.map((row) => {
      const payload = {};
      if (row.arabic_equivalent != null) {
        payload.arabic_equivalent = row.arabic_equivalent;
      }
      if (row.definition_arabic != null) {
        payload.definition_arabic = row.definition_arabic;
      }
      if (!Object.keys(payload).length) return Promise.resolve();

      return supabase
        .from("vocabulary_words")
        .update(payload)
        .eq("id", row.id)
        .then(({ error }) => {
          if (!error) return;
          // Column may not exist yet — retry definition_arabic only.
          if (
            String(error.message || "").includes("arabic_equivalent") &&
            payload.definition_arabic != null
          ) {
            return supabase
              .from("vocabulary_words")
              .update({ definition_arabic: payload.definition_arabic })
              .eq("id", row.id)
              .then(({ error: err2 }) => {
                if (err2) {
                  console.warn(
                    "[vocabularyArabic] persist failed",
                    row.id,
                    err2.message
                  );
                }
              });
          }
          console.warn("[vocabularyArabic] persist failed", row.id, error.message);
        });
    })
  );
}
