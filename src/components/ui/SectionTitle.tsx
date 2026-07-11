export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[1.05rem] font-black leading-tight text-ink">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm font-semibold leading-5 text-ink/56">{subtitle}</p> : null}
    </div>
  );
}
