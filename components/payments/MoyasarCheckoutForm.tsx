"use client";

import { useEffect, useId, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Moyasar?: {
      init: (config: Record<string, unknown>) => void;
    };
  }
}

type MoyasarCheckoutFormProps = {
  amountHalalas: number;
  publishableKey: string;
  callbackUrl: string;
  description: string;
  studentId: string;
  track: string;
  onError?: (message: string) => void;
};

const MOYASAR_JS = "https://cdn.moyasar.com/mpf/0.3.0/moyasar.min.js";
const MOYASAR_CSS = "https://cdn.moyasar.com/mpf/0.3.0/moyasar.css";

export function MoyasarCheckoutForm({
  amountHalalas,
  publishableKey,
  callbackUrl,
  description,
  studentId,
  track,
  onError,
}: MoyasarCheckoutFormProps) {
  const reactId = useId();
  const elementId = `mysr-form-${reactId.replace(/:/g, "")}`;
  const initialized = useRef(false);
  const scriptReady = useRef(false);

  const initForm = () => {
    if (initialized.current || !scriptReady.current || !window.Moyasar?.init) return;
    initialized.current = true;

    try {
      window.Moyasar.init({
        element: `#${elementId}`,
        amount: amountHalalas,
        currency: "SAR",
        description,
        publishable_api_key: publishableKey,
        callback_url: callbackUrl,
        supported_networks: ["mada", "visa", "mastercard"],
        methods: ["creditcard", "applepay", "stcpay"],
        metadata: {
          student_id: studentId,
          track,
        },
        fixed_width: false,
        on_failure: (error: unknown) => {
          const msg =
            typeof error === "string"
              ? error
              : error instanceof Error
                ? error.message
                : "Payment failed. Please try again.";
          onError?.(msg);
        },
      });
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Could not load payment form");
    }
  };

  useEffect(() => {
    initForm();
  });

  return (
    <>
      <link rel="stylesheet" href={MOYASAR_CSS} />
      <Script
        src={MOYASAR_JS}
        strategy="afterInteractive"
        onLoad={() => {
          scriptReady.current = true;
          initForm();
        }}
        onError={() => onError?.("Could not load Moyasar payment library")}
      />
      <div id={elementId} className="mysr-form mt-4 min-h-[120px]" />
    </>
  );
}
