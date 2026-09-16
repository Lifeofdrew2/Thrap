/**
 * Line icons for the conversation shortcuts, drawn in the same stroke style
 * as the mic/send/dictate icons in the composer (round caps, ~1.6 stroke),
 * so the empty state reads as one designed system instead of custom
 * illustration plus emoji.
 */

const common = {
  width: 22,
  height: 22,
  viewBox: "0 0 22 22",
  fill: "none",
  "aria-hidden": true,
} as const;

const stroke = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function TalkThrough() {
  return (
    <svg {...common}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h9A2.5 2.5 0 0 1 18 6.5v6a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V15H6.5A2.5 2.5 0 0 1 4 12.5v-6Z" {...stroke} />
      <circle cx="8" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="11" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Anxiety() {
  return (
    <svg {...common}>
      <path
        d="M11 17.3c-4-2.6-7.3-5.4-7.3-9.2A3.7 3.7 0 0 1 11 6.3a3.7 3.7 0 0 1 7.3 1.8c0 3.8-3.3 6.6-7.3 9.2Z"
        {...stroke}
      />
      <path d="M4.8 11h3l1.4-2.6 1.8 4.4 1.4-3 1.3 2.2h3" {...stroke} />
    </svg>
  );
}

function LowMood() {
  return (
    <svg {...common}>
      <circle cx="11" cy="11" r="6.5" {...stroke} />
      <circle cx="8.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
      <path d="M8 14.5q1.5-2 3-2t3 2" {...stroke} />
    </svg>
  );
}

function Grief() {
  return (
    <svg {...common}>
      <path d="M11 2.8c1.4 1.7 2.1 2.9 2.1 3.7 0 1.15-.94 1.85-2.1 1.85s-2.1-.7-2.1-1.85c0-.8.7-2 2.1-3.7Z" fill="currentColor" stroke="none" />
      <rect x="8.8" y="10" width="4.4" height="7.5" rx="0.8" {...stroke} />
      <path d="M5.5 17.5h11" {...stroke} />
    </svg>
  );
}

function Burnout() {
  return (
    <svg {...common}>
      <rect x="3.5" y="6.5" width="13.5" height="9" rx="1.8" {...stroke} />
      <rect x="17.4" y="9.2" width="1.9" height="3.6" rx="0.7" fill="currentColor" stroke="none" />
      <rect x="5.3" y="8.3" width="3.2" height="5.4" rx="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Sleep() {
  return (
    <svg {...common}>
      <path d="M15.5 4.2a7.8 7.8 0 1 0 0 13.6 6.4 6.4 0 0 1 0-13.6Z" {...stroke} />
      <path d="M16.5 15.5h3l-3 3h3" {...stroke} />
    </svg>
  );
}

function BookCounsellor() {
  return (
    <svg {...common}>
      <circle cx="8" cy="7.5" r="2.4" {...stroke} />
      <circle cx="14.5" cy="9" r="2.1" {...stroke} />
      <path d="M3.8 17.3c.2-3.2 2-5.4 4.6-5.4 2.2 0 3.9 1.5 4.4 3.8" {...stroke} />
      <path d="M12.6 17.3c.2-2.8 1.7-4.6 3.9-4.6 2 0 3.6 1.4 3.9 3.6" {...stroke} />
    </svg>
  );
}

const ICONS: Record<string, () => JSX.Element> = {
  TALK_THROUGH: TalkThrough,
  ANXIETY: Anxiety,
  LOW_MOOD: LowMood,
  GRIEF: Grief,
  BURNOUT: Burnout,
  SLEEP: Sleep,
  BOOK_COUNSELLOR: BookCounsellor,
};

export function ShortcutIcon({ intent }: { intent: string }) {
  const Icon = ICONS[intent];
  return Icon ? <Icon /> : null;
}
