"use client";

type SignedNumberFieldProps = {
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

export function SignedNumberField({ label, name, value, onChange, placeholder = "0", required = false }: SignedNumberFieldProps) {
  const isNegative = value.trim().startsWith("-");
  const displayValue = isNegative ? value.trim().slice(1) : value;

  function applySign(nextIsNegative: boolean) {
    const normalizedValue = normalizeNumberMagnitude(displayValue);
    onChange(nextIsNegative ? `-${normalizedValue}` : normalizedValue);
  }

  function updateValue(nextValue: string) {
    const normalizedValue = normalizeNumberMagnitude(nextValue);
    onChange(isNegative ? `-${normalizedValue}` : normalizedValue);
  }

  return (
    <label className="grid gap-1.5 text-sm font-bold text-ink">
      <span className="text-xs font-black uppercase tracking-[0.08em] text-ink/58">{label}</span>
      <div className="grid grid-cols-[88px_1fr] gap-2">
        <div className="grid grid-cols-2 rounded-md border border-ink/10 bg-mist p-1">
          <button
            type="button"
            className={`tap-target rounded-[6px] text-base font-black transition ${
              !isNegative ? "bg-felt text-white shadow-[0_8px_20px_rgba(31,122,90,0.18)]" : "text-ink/55"
            }`}
            aria-pressed={!isNegative}
            onClick={() => applySign(false)}
          >
            +
          </button>
          <button
            type="button"
            className={`tap-target rounded-[6px] text-base font-black transition ${
              isNegative ? "bg-berry text-white shadow-[0_8px_20px_rgba(180,35,95,0.18)]" : "text-ink/55"
            }`}
            aria-pressed={isNegative}
            onClick={() => applySign(true)}
          >
            -
          </button>
        </div>
        {name ? <input type="hidden" name={name} value={value} /> : null}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={placeholder}
          required={required}
          value={displayValue}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => updateValue(event.target.value)}
          className="tap-target w-full rounded-md border border-ink/10 bg-white/92 px-3 text-base font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-ink/32 focus:border-felt focus:bg-white focus:ring-4 focus:ring-felt/12"
        />
      </div>
    </label>
  );
}

function normalizeNumberMagnitude(value: string) {
  return value.replace(/[^\d]/g, "");
}
