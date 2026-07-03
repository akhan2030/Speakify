"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type WordState = {
  sentence: string;
  feedback: string | null;
  practiced: boolean;
  checking: boolean;
  listening: boolean;
  transcript: string | null;
};

function vocabMeta(word: string) {
  const hints: Record<string, { ipa: string; definition: string; example: string }> = {
    sustainable: {
      ipa: "/səˈsteɪ.nə.bəl/",
      definition: "able to continue without harming the environment",
      example: "The city is investing in sustainable transport.",
    },
    vibrant: {
      ipa: "/ˈvaɪ.brənt/",
      definition: "full of energy and life",
      example: "The city has a vibrant nightlife.",
    },
    pleasant: {
      ipa: "/ˈplez.ənt/",
      definition: "enjoyable and agreeable",
      example: "We had a pleasant conversation about travel.",
    },
    enjoyable: {
      ipa: "/ɪnˈdʒɔɪ.ə.bəl/",
      definition: "giving pleasure or satisfaction",
      example: "Learning English can be enjoyable with practice.",
    },
  };
  const key = word.toLowerCase();
  return (
    hints[key] ?? {
      ipa: "",
      definition: "Use this word naturally in a full sentence.",
      example: `Try using "${word}" in a sentence about your daily life.`,
    }
  );
}

export default function MockVocabularyChallenge({ words }: { words: string[] }) {
  const list = useMemo(() => words.slice(0, 5), [words]);
  const [states, setStates] = useState<Record<string, WordState>>({});

  useEffect(() => {
    const initial: Record<string, WordState> = {};
    for (const word of list) {
      initial[word] = {
        sentence: "",
        feedback: null,
        practiced: false,
        checking: false,
        listening: false,
        transcript: null,
      };
    }
    setStates(initial);
  }, [list]);

  const practicedCount = list.filter((w) => states[w]?.practiced).length;

  const updateWord = useCallback((word: string, patch: Partial<WordState>) => {
    setStates((prev) => ({
      ...prev,
      [word]: { ...prev[word], ...patch },
    }));
  }, []);

  const checkSentence = async (word: string) => {
    const sentence = states[word]?.sentence?.trim();
    if (!sentence) return;

    updateWord(word, { checking: true, feedback: null });
    try {
      const res = await fetch("/api/speaking/session/vocabulary-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, sentence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      updateWord(word, {
        checking: false,
        feedback: data.message,
        practiced: data.correct === true,
      });
    } catch (err) {
      updateWord(word, {
        checking: false,
        feedback: err instanceof Error ? err.message : "Could not check sentence",
      });
    }
  };

  const startSpeech = (word: string) => {
    if (typeof window === "undefined") return;

    const Win = window as Window & {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        start: () => void;
        onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        start: () => void;
        onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
      };
    };

    const SpeechRecognition = Win.SpeechRecognition || Win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      updateWord(word, {
        feedback: "Speech recognition is not supported in this browser. Type your sentence instead.",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    updateWord(word, { listening: true, feedback: null, transcript: null });

    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      updateWord(word, {
        listening: false,
        transcript: text,
        sentence: text,
      });
    };

    recognition.onerror = () => {
      updateWord(word, {
        listening: false,
        feedback: "Could not hear you — try again or type your sentence.",
      });
    };

    recognition.onend = () => {
      updateWord(word, { listening: false });
    };

    recognition.start();
  };

  if (list.length === 0) {
    return (
      <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
        No vocabulary words assigned for this session.
      </p>
    );
  }

  return (
    <div>
      {practicedCount === list.length && list.length > 0 ? (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "16px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#0d9488",
            animation: "mockCheckPop 0.4s ease-out",
          }}
        >
          🎯 {list.length}/{list.length} words practiced! These are saved to your vocabulary bank.
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {list.map((word) => {
          const meta = vocabMeta(word);
          const state = states[word];
          if (!state) return null;

          return (
            <div
              key={word}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "16px",
                background: state.practiced ? "#f0fdf4" : "white",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
            >
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#0d1b35", margin: "0 0 4px" }}>
                {word}
              </p>
              {meta.ipa ? (
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 6px" }}>
                  {meta.ipa} — {meta.definition}
                </p>
              ) : (
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 6px" }}>
                  {meta.definition}
                </p>
              )}
              <p style={{ fontSize: "13px", color: "#0d9488", margin: "0 0 12px", fontStyle: "italic" }}>
                Example: &ldquo;{meta.example}&rdquo;
              </p>

              <p style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", margin: "0 0 6px" }}>
                📝 Your turn: Type a sentence using this word
              </p>
              <textarea
                value={state.sentence}
                onChange={(e) => updateWord(word, { sentence: e.target.value, feedback: null })}
                rows={2}
                placeholder="Write your sentence here…"
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  padding: "10px 12px",
                  fontSize: "14px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />

              {state.transcript ? (
                <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0 0" }}>
                  Heard: &ldquo;{state.transcript}&rdquo;
                </p>
              ) : null}

              {state.feedback ? (
                <p
                  style={{
                    fontSize: "13px",
                    margin: "10px 0 0",
                    color: state.practiced ? "#0d9488" : "#b45309",
                    fontWeight: 500,
                  }}
                >
                  {state.practiced ? "✅" : "❌"} {state.feedback}
                </p>
              ) : null}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "12px",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => startSpeech(word)}
                  disabled={state.listening || state.checking}
                  style={{
                    border: "1px solid #e2e8f0",
                    background: "white",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {state.listening ? "🎤 Listening…" : "🎤 Or speak it"}
                </button>
                <button
                  type="button"
                  onClick={() => void checkSentence(word)}
                  disabled={state.checking || !state.sentence.trim()}
                  style={{
                    border: "none",
                    background: "#0d9488",
                    color: "white",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: state.checking || !state.sentence.trim() ? 0.6 : 1,
                  }}
                >
                  {state.checking ? "Checking…" : "Check ✓"}
                </button>
                <span
                  style={{
                    fontSize: "12px",
                    color: state.practiced ? "#0d9488" : "#94a3b8",
                    fontWeight: 600,
                  }}
                >
                  {state.practiced ? "● Practiced" : "○ Not practiced"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
