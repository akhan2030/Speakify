"use client";

import { useRouter } from "next/navigation";

export default function NoSpeechDetected({
  message,
  onTryAgain,
}: {
  message?: string;
  onTryAgain?: () => void;
}) {
  const router = useRouter();

  return (
    <div style={{ maxWidth: "560px" }}>
      <div
        style={{
          background: "#fef2f2",
          border: "2px solid #ef4444",
          borderRadius: "12px",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "24px", marginBottom: "8px" }}>🎤</p>
        <h3 style={{ color: "#991b1b", fontSize: "18px", marginBottom: "8px" }}>
          No speech detected
        </h3>
        <p style={{ color: "#666", marginBottom: "16px", lineHeight: 1.6 }}>
          {message ||
            "We could not detect enough speaking during this session. Please check your microphone is working and try again."}
        </p>
        <button
          type="button"
          onClick={() => {
            if (onTryAgain) onTryAgain();
            else router.push("/dashboard/ielts/student/speaking");
          }}
          style={{
            background: "#c9972c",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try Again →
        </button>
      </div>
    </div>
  );
}
