import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Read-aloud for service replies.
 *
 * Off by default and opt-in per session. A synthetic voice reading wellbeing
 * content aloud is a disclosure risk in a shared office or on a commute, so the
 * person turns it on deliberately rather than discovering it.
 *
 * Unlike recognition, synthesis runs against voices installed on the device, so
 * no reply text leaves the browser.
 */

export interface SpeechSynthesisState {
  supported: boolean;
  speaking: boolean;
  voiceGender: "female" | "male";
  setVoiceGender(gender: "female" | "male"): void;
  speak(text: string): void;
  cancel(): void;
}

/** Voices marked "Online (Natural)"/neural sound far less robotic than the
 *  default compact voices most browsers ship, so they are preferred whenever
 *  the device has them installed (Edge/Windows and recent Chrome do). */
const NEURAL_HINT = /online|natural|neural/i;

function splitIntoSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]*\s*/g);
  return (matches ?? [text]).map((sentence) => sentence.trim()).filter(Boolean);
}

export function useSpeechSynthesis(initialGender: "female" | "male" = "female"): SpeechSynthesisState {
  const [speaking, setSpeaking] = useState(false);
  const [voiceGender, setVoiceGender] = useState<"female" | "male">(initialGender);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const queueRef = useRef<string[]>([]);
  const speakingRef = useRef(false);

  const cancel = useCallback(() => {
    if (!supported) return;
    queueRef.current = [];
    speakingRef.current = false;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speakNext = useCallback((voice: SpeechSynthesisVoice | undefined, gender: "female" | "male") => {
    const next = queueRef.current.shift();
    if (!next) {
      speakingRef.current = false;
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(next);
    utterance.rate = gender === "male" ? 0.98 : 0.97;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    if (voice) utterance.voice = voice;

    utterance.onend = () => speakNext(voice, gender);
    utterance.onerror = () => speakNext(voice, gender);

    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported || !text.trim()) return;

    // Never queue a second reply on top of one already playing: a backlog of
    // replies talking over each other is worse than losing one, and the
    // person is reading the same text on screen anyway.
    window.speechSynthesis.cancel();

    const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const englishVoices = availableVoices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
    const genderNames = voiceGender === "female"
      ? /samantha|jenny|ava|allison|aria|susan|victoria|moira|karen|hazel|libby|google us english female|google uk english female/i
      : /daniel|david|alex|george|mark|james|oliver|arthur|guy|ryan|google us english male|google uk english male/i;

    const matchingGender = englishVoices.filter((voice) => genderNames.test(voice.name));
    const preferred = matchingGender.find((voice) => NEURAL_HINT.test(voice.name))
      ?? englishVoices.find((voice) => NEURAL_HINT.test(voice.name) && genderNames.test(voice.name))
      ?? matchingGender[0]
      ?? englishVoices.find((voice) => voice.lang.startsWith("en-GB"))
      ?? englishVoices.find((voice) => voice.lang === "en-NG")
      ?? englishVoices[0]
      ?? availableVoices[0];

    // Speaking sentence-by-sentence (rather than one long utterance) gives the
    // synthesiser natural breathing gaps between sentences instead of one flat
    // monotone block, which is the biggest single thing separating it from a
    // one-shot robotic read of the whole paragraph.
    queueRef.current = splitIntoSentences(text);
    speakingRef.current = true;
    setSpeaking(true);
    speakNext(preferred, voiceGender);
  }, [supported, voiceGender, voices, speakNext]);

  useEffect(() => {
    if (!supported) return;
    const updateVoices = () => setVoices(window.speechSynthesis.getVoices());
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { supported, speaking, voiceGender, setVoiceGender, speak, cancel };
}
