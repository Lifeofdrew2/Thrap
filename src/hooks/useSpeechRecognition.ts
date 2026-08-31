import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Browser speech-to-text for the composer.
 *
 * The transcript is written into the input for the person to read and send
 * themselves. It is never submitted automatically: a mis-transcription must be
 * visible and correctable before it reaches the service, and the deterministic
 * crisis gate should classify the words the person actually meant.
 *
 * The Web Speech API is not in lib.dom.d.ts, so the surface used here is
 * declared locally rather than pulling in a types package.
 */

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Nigerian English first, falling back to British English. The recogniser
 * rejects an unknown tag on some builds, so the fallback is not decorative.
 */
const PREFERRED_LANGS = ["en-NG", "en-GB"];

export type SpeechStatus = "unsupported" | "idle" | "listening" | "error";

export interface SpeechRecognitionState {
  status: SpeechStatus;
  /** Stable text from finalised phrases. */
  transcript: string;
  /** In-flight words, shown but not yet committed. */
  interim: string;
  /** Plain, non-technical message for the person. Null unless status is error. */
  error: string | null;
  start(): void;
  stop(): void;
  reset(): void;
}

const MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser settings to use voice.",
  "service-not-allowed": "Microphone access was blocked. Allow it in your browser settings to use voice.",
  "no-speech": "I didn't catch anything. Try again, or type instead.",
  network: "Voice input needs a connection and couldn't reach the speech service. You can type instead.",
  "audio-capture": "No microphone was found. You can type instead.",
};

export function useSpeechRecognition(): SpeechRecognitionState {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const langIndexRef = useRef(0);

  useEffect(() => {
    const Constructor = getConstructor();
    if (!Constructor) {
      setStatus("unsupported");
      return;
    }

    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = PREFERRED_LANGS[langIndexRef.current];

    recognition.onstart = () => {
      setStatus("listening");
      setError(null);
    };

    recognition.onresult = (event) => {
      let settled = "";
      let pending = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) settled += text;
        else pending += text;
      }

      if (settled) setTranscript((current) => `${current}${settled}`);
      setInterim(pending);
    };

    recognition.onerror = (event) => {
      // A language the build does not carry fails once; retry in English.
      if (event.error === "language-not-supported" && langIndexRef.current < PREFERRED_LANGS.length - 1) {
        langIndexRef.current += 1;
        recognition.lang = PREFERRED_LANGS[langIndexRef.current];
        return;
      }
      // Stopping deliberately surfaces as an error on some browsers.
      if (event.error === "aborted") return;

      setError(MESSAGES[event.error] ?? "Voice input isn't working right now. You can type instead.");
      setStatus("error");
    };

    recognition.onend = () => {
      setInterim("");
      setStatus((current) => (current === "error" ? current : "idle"));
    };

    recognitionRef.current = recognition;
    setStatus("idle");

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    try {
      recognition.start();
    } catch {
      // start() throws if already running; that is not a failure worth showing.
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus((current) => (current === "listening" ? "idle" : current));
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return { status, transcript, interim, error, start, stop, reset };
}
