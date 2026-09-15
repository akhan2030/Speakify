"use client";
import { SPEAKIFY_COLOR } from "@/lib/brand/tokens";

import { useState } from "react";
import { ExamHighlightQuestionText } from "@/components/exam/ExamHighlightSection";
import type { MockExamClientQuestion } from "@/lib/step/mockExam/types";
import MockOptionButtons from "./MockOptionButtons";
import { speakDialogueWithBrowser, stopBrowserSpeech } from "@/lib/browserSpeech";
import type { StepMcqOption } from "@/lib/step/types";

type Props = {
  question: MockExamClientQuestion;
  answer?: string;
  onAnswer: (ans: StepMcqOption) => void;
  hasPlayed: boolean;
  onPlay: (recordingId: string) => void;
  questionNumber: number;
};

export default function ListeningQuestion({
  question,
  answer,
  onAnswer,
  hasPlayed,
  onPlay,
  questionNumber,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const recordingId = question.recordingId ?? question.id;

  const playAudio = async () => {
    if (hasPlayed || isPlaying || !question.transcript) return;
    setIsPlaying(true);
    try {
      await speakDialogueWithBrowser(question.transcript);
    } catch {
      // still allow answers after attempt
    } finally {
      setIsPlaying(false);
      onPlay(recordingId);
    }
  };

  const canAnswer = isPlaying || hasPlayed;
  const showStem = hasPlayed;

  return (
    <div>
      <div className="mb-6 rounded-lg border border-speakify-gold bg-orange-50 px-4 py-3">
        <p className="m-0 text-sm text-amber-900">
          🎧 <strong>Listening plays once</strong> — same as live STEP. While the audio
          plays you see choices A–D only, not the written question. The recording includes
          the spoken question.
          {!hasPlayed && " Press play when you are ready."}
          {hasPlayed && " This recording has already played."}
        </p>
      </div>

      <div className="mb-6 rounded-xl bg-speakify-navy p-6 text-center">
        {!hasPlayed ? (
          <>
            <p className="mb-3 text-sm text-white/70">
              Recording {question.recordingNumber ?? 1} of {question.totalRecordings ?? 1}
            </p>
            <button
              type="button"
              onClick={playAudio}
              disabled={isPlaying}
              className="flex h-[60px] w-[60px] items-center justify-center rounded-full text-2xl text-white disabled:opacity-60"
              style={{ background: SPEAKIFY_COLOR.gold, margin: "0 auto" }}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <p className="mb-0 mt-3 text-xs text-white/50">
              {isPlaying ? "Playing — listen carefully..." : "Press play to begin listening"}
            </p>
          </>
        ) : (
          <p className="m-0 text-sm font-semibold text-speakify-gold">
            ✓ Recording played — answer the questions below
          </p>
        )}
      </div>

      {canAnswer ? (
        <div>
          {showStem ? (
            <p className="mb-4 text-[15px] font-semibold text-speakify-navy">
              <ExamHighlightQuestionText
                blockId={`${question.id}-stem`}
                number={questionNumber}
                text={question.stem}
              />
            </p>
          ) : (
            <p className="mb-4 text-sm text-slate-500">
              Question {questionNumber} — listen for the spoken question. Choices only:
            </p>
          )}
          <MockOptionButtons
            questionId={question.id}
            options={question.options}
            selected={answer}
            onSelect={onAnswer}
          />
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500">
          <p>Play the audio above before answering</p>
        </div>
      )}
    </div>
  );
}
