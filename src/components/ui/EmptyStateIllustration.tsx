type EmptyStateIllustrationProps = {
  variant: "templates" | "matches" | "history" | "notFound";
};

export function EmptyStateIllustration({ variant }: EmptyStateIllustrationProps) {
  return (
    <div className="mx-auto mb-3 flex h-20 w-24 items-center justify-center rounded-md bg-mist/70 text-ink/28">
      {variant === "templates" ? <TemplateStack /> : null}
      {variant === "matches" ? <GameTable /> : null}
      {variant === "history" ? <ScoreSlip /> : null}
      {variant === "notFound" ? <LostCard /> : null}
    </div>
  );
}

function LostCard() {
  return (
    <svg viewBox="0 0 96 80" aria-hidden="true" className="h-16 w-20">
      <rect x="30" y="11" width="34" height="48" rx="5" fill="none" stroke="currentColor" strokeWidth="3" transform="rotate(10 47 35)" />
      <path d="M38 31c1.5-5 5.5-8 10-7 4 .8 6.5 4.5 5.8 8.3-.7 4.2-4.6 5.6-7.2 7.5-1.8 1.3-2.4 2.6-2.4 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      <circle cx="44.3" cy="52.5" r="2.8" fill="currentColor" />
      <path d="M20 64h56" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" opacity="0.45" />
    </svg>
  );
}

function TemplateStack() {
  return (
    <svg viewBox="0 0 96 80" aria-hidden="true" className="h-16 w-20">
      <rect x="24" y="12" width="34" height="48" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="36" y="18" width="34" height="48" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="49" cy="33" r="3" fill="currentColor" />
      <circle cx="57" cy="41" r="3" fill="currentColor" />
      <circle cx="49" cy="49" r="3" fill="currentColor" />
    </svg>
  );
}

function GameTable() {
  return (
    <svg viewBox="0 0 96 80" aria-hidden="true" className="h-16 w-20">
      <rect x="18" y="20" width="26" height="26" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="28" cy="30" r="2.5" fill="currentColor" />
      <circle cx="34" cy="36" r="2.5" fill="currentColor" />
      <circle cx="22" cy="54" r="6" fill="currentColor" opacity="0.55" />
      <circle cx="49" cy="59" r="6" fill="currentColor" opacity="0.55" />
      <circle cx="74" cy="47" r="6" fill="currentColor" opacity="0.55" />
      <path d="M55 20h18a5 5 0 0 1 5 5v22" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function ScoreSlip() {
  return (
    <svg viewBox="0 0 96 80" aria-hidden="true" className="h-16 w-20">
      <path
        d="M28 14h34l8 8v40a5 5 0 0 1-5 5H28a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path d="M61 15v10h9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      <path d="M34 34h23M34 45h19M34 56h26" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}
