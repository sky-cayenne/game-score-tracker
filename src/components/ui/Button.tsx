import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "finish";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-felt text-white shadow-lift hover:bg-felt/92",
    secondary: "border border-ink/10 bg-white/88 text-ink shadow-[0_8px_24px_rgba(23,32,28,0.06)] hover:bg-mist",
    ghost: "bg-transparent text-felt hover:bg-mist",
    danger: "bg-berry text-white shadow-[0_12px_30px_rgba(180,35,95,0.18)] hover:bg-berry/92",
    finish: "bg-gold text-white shadow-[0_12px_30px_rgba(214,158,46,0.2)] hover:bg-gold/92"
  };

  return (
    <button
      className={`tap-target pressable inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
