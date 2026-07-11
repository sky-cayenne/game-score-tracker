"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Layers3, Settings, Trophy } from "lucide-react";

const navItems = [
  { href: "/templates", label: "Шаблони", icon: Layers3 },
  { href: "/matches", label: "Партії", icon: Trophy },
  { href: "/logs", label: "Історія", icon: ClipboardList },
  { href: "/settings", label: "Дані", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-paper shadow-soft">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 px-4 pb-4 pt-[calc(14px+var(--safe-top))] backdrop-blur-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-felt">Підрахунок очок</p>
        <h1 className="mt-1 text-[1.45rem] font-black leading-tight text-ink">Підрахунок очок</h1>
      </header>

      <main className="flex-1 px-4 py-5 pb-[calc(112px+var(--safe-bottom))]">{children}</main>

      <nav className="app-bottom-nav z-30 grid grid-cols-4 border-t border-ink/10 bg-paper/92 px-2 pb-[calc(8px+var(--safe-bottom))] pt-2 shadow-[0_-12px_34px_rgba(23,32,28,0.08)] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`tap-target pressable flex flex-col items-center justify-center gap-1 rounded-md text-[11px] font-black transition ${
                active ? "bg-felt text-white shadow-lift" : "text-ink/52 hover:bg-mist"
              }`}
            >
              <Icon size={20} strokeWidth={2.2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
