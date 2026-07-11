"use client";

import { useEffect, useRef, useState } from "react";
import type { GameTemplateRules } from "@/types/domain";

type ScoreLimitModeFieldProps = {
  defaultValue?: GameTemplateRules["scoreLimitMode"];
  defaultLimitValue?: number | null;
  forceVisible?: boolean;
};

export function ScoreLimitModeField({ defaultValue = "win", defaultLimitValue = null, forceVisible = false }: ScoreLimitModeFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasScoreLimit, setHasScoreLimit] = useState(forceVisible || defaultLimitValue !== null);

  useEffect(() => {
    const form = containerRef.current?.closest("form");
    const scoreLimitInput = form?.querySelector<HTMLInputElement>('input[name="winningScoreLimit"]');

    if (forceVisible) {
      setHasScoreLimit(true);
      return;
    }

    if (!scoreLimitInput) {
      return;
    }

    function updateVisibility() {
      setHasScoreLimit(Boolean(scoreLimitInput?.value.trim()));
    }

    updateVisibility();
    scoreLimitInput.addEventListener("input", updateVisibility);

    return () => {
      scoreLimitInput.removeEventListener("input", updateVisibility);
    };
  }, [forceVisible]);

  return (
    <div ref={containerRef}>
      {hasScoreLimit ? (
        <label htmlFor="scoreLimitMode" className="grid gap-1.5 text-sm font-bold text-ink">
          <span className="text-xs font-black uppercase tracking-[0.08em] text-ink/58">
            {forceVisible ? "Якщо задано ліміт очок, він означає" : "Ліміт очок означає"}
          </span>
          <select
            id="scoreLimitMode"
            name="scoreLimitMode"
            defaultValue={defaultValue}
            className="tap-target rounded-md border border-ink/12 bg-white px-3 text-base font-bold text-ink outline-none focus:border-felt focus:ring-4 focus:ring-felt/12"
          >
            <option value="win">перемогу</option>
            <option value="lose">програш / вибування</option>
          </select>
        </label>
      ) : null}
    </div>
  );
}
