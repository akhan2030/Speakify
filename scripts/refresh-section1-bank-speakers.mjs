/**
 * Patch ALL Section 1 bank rows: unique speaker identities + synced transcripts.
 * Run: npm run refresh:section1-speakers
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  applySpeakerIdentitiesToPayload,
  assertSpeakerIdentitiesValid,
} from "../lib/listeningSpeakerIdentity.js";
import { prepareTranscriptForListening } from "../lib/listeningSpeakerAlignment.js";
import { parseQuestionsJson } from "../lib/listeningContentPool.js";
import {
  contentHasBannedLegacySpeakerRefs,
  isBannedSpeakerName,
} from "../lib/listeningSection1Diversity.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

async function main() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error } = await supabase
    .from("generated_listening_tests")
    .select("id, section_number, content_type, test_number, transcript, questions")
    .eq("section_number", 1);

  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  let updated = 0;
  const usedPairKeys = [];

  for (const row of rows ?? []) {
    const meta = parseQuestionsJson(row.questions);
    const speakers = meta.speakers ?? [];
    const blob = [
      row.transcript ?? "",
      JSON.stringify(meta.items ?? meta),
    ].join("\n");
    const stale =
      speakers.some((s) => isBannedSpeakerName(s.displayName ?? s.name)) ||
      contentHasBannedLegacySpeakerRefs(blob);

    if (!stale && speakers.length >= 2 && speakers[0]?.voiceId) {
      continue;
    }

    let payload = applySpeakerIdentitiesToPayload(
      {
        section: 1,
        testId: `${row.content_type}:${row.test_number}`,
        transcript: row.transcript ?? "",
        speakers,
      },
      {
        testSeed: `bank-row-${row.id}`,
        excludePairKeys: usedPairKeys,
        source: "refresh_script",
      }
    );

    try {
      assertSpeakerIdentitiesValid(payload, 1);
    } catch (err) {
      console.error(`Row ${row.id} validation failed:`, err.message);
      continue;
    }

    if (payload.speakerPairKey) {
      usedPairKeys.push(payload.speakerPairKey);
    }

    const transcript = prepareTranscriptForListening(
      payload.transcript,
      1,
      payload.speakers
    );

    const questionsJson = {
      ...meta,
      speakers: payload.speakers,
      items: payload.questions ?? meta.items,
    };

    const { error: updateError } = await supabase
      .from("generated_listening_tests")
      .update({
        transcript,
        questions: questionsJson,
      })
      .eq("id", row.id);

    if (updateError) {
      console.error(`Row ${row.id} update failed:`, updateError.message);
      continue;
    }

    updated += 1;
    console.log(
      `[${row.content_type} #${row.test_number}] id=${row.id} → ${payload.speakers.map((s) => `${s.displayName} (${s.gender}/${s.voiceId})`).join(" · ")}`
    );
  }

  console.log(`\nDone. ${updated} Section 1 row(s) patched in Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
