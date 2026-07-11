type EmptyStateIllustrationProps = {
  variant: "templates" | "matches" | "history";
};

export function EmptyStateIllustration({ variant }: EmptyStateIllustrationProps) {
  return (
    <div className="mx-auto mb-3 flex h-20 w-24 items-center justify-center rounded-md bg-mist/70 text-ink/28">
      {variant === "templates" ? <TemplateStack /> : null}
      {variant === "matches" ? <GameTable /> : null}
      {variant === "history" ? <ScoreSlip /> : null}
    </div>
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
