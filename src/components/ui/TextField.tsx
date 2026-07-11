import type { InputEvent, InputHTMLAttributes, InvalidEvent } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ label, className = "", onInput, onInvalid, ...props }: TextFieldProps) {
  function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
    setValidationMessage(event.currentTarget, label);
    onInvalid?.(event);
  }

  function handleInput(event: InputEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity("");
    onInput?.(event);
  }

  return (
    <label className="grid gap-1.5 text-sm font-bold text-ink">
      <span className="text-xs font-black uppercase tracking-[0.08em] text-ink/58">{label}</span>
      <input
        className={`tap-target w-full rounded-md border border-ink/10 bg-white/92 px-3 text-base font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-ink/32 focus:border-felt focus:bg-white focus:ring-4 focus:ring-felt/12 disabled:bg-mist disabled:text-ink/50 ${className}`}
        onInvalid={handleInvalid}
        onInput={handleInput}
        {...props}
      />
    </label>
  );
}

function setValidationMessage(input: HTMLInputElement, label: string) {
  if (input.validity.valid) {
    input.setCustomValidity("");
    return;
  }

  if (input.validity.valueMissing) {
    input.setCustomValidity(`Заповни поле "${label}".`);
    return;
  }

  if (input.validity.badInput || input.validity.typeMismatch) {
    input.setCustomValidity(`Введи коректне значення в полі "${label}".`);
    return;
  }

  if (input.validity.rangeUnderflow && input.min) {
    input.setCustomValidity(`Значення в полі "${label}" має бути не менше ${input.min}.`);
    return;
  }

  if (input.validity.rangeOverflow && input.max) {
    input.setCustomValidity(`Значення в полі "${label}" має бути не більше ${input.max}.`);
    return;
  }

  input.setCustomValidity(`Перевір поле "${label}".`);
}
