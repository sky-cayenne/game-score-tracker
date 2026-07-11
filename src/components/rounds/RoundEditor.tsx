"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SignedNumberField } from "@/components/ui/SignedNumberField";
import {
  calculateDraftPlayerTotal,
  createRound,
  draftFromRound,
  emptyRoundDraft,
  updateRound,
  type RoundDraft
} from "@/lib/repositories/roundsRepository";
import { getMatchRounds } from "@/lib/repositories/matchesRepository";
import { calculateMatchTotals } from "@/lib/scoring/calculateTotals";
import { clearRoundDraft, loadRoundDraft, saveRoundDraft } from "@/lib/storage/roundDrafts";
import { useAppData } from "@/lib/storage/useAppData";
import type { GameTemplate, Match, Round } from "@/types/domain";

type RoundEditorProps = {
  match: Match;
  template: GameTemplate;
  round?: Round;
  roundNumber: number;
};

type InputMode = "manual" | "cards";

export function RoundEditor({ match, template, round, roundNumber }: RoundEditorProps) {
  const router = useRouter();
  const { data, setData } = useAppData();
  const cards = useMemo(() => template.cards.slice().sort((a, b) => a.sortOrder - b.sortOrder), [template.cards]);
  const baselineRounds = getMatchRounds(data, match.id).filter((item) => item.id !== round?.id);
  const baselineTotals = calculateMatchTotals(match, baselineRounds);
  const initialMode: InputMode = round?.scores.some((score) => score.cardEntries.length > 0) ? "cards" : "manual";
  const [inputMode, setInputMode] = useState<InputMode>(initialMode);
  const [draft, setDraft] = useState<RoundDraft>(() => round ? draftFromRound(round) : emptyRoundDraft());

  useEffect(() => {
    if (round) {
      return;
    }

    const savedDraft = loadRoundDraft(match.id);
    if (savedDraft) {
      setDraft(savedDraft);
    }
  }, [match.id, round]);

  useEffect(() => {
    if (!round) {
      saveRoundDraft(match.id, draft);
    }
  }, [draft, match.id, round]);

  function updateQuantity(playerId: string, cardId: string, delta: number) {
    setDraft((current) => {
      const playerDraft = current.players[playerId] ?? { manualAdjustment: "", quantities: {} };
      const currentQuantity = playerDraft.quantities[cardId] ?? 0;

      return {
        ...current,
        players: {
          ...current.players,
          [playerId]: {
            ...playerDraft,
            quantities: {
              ...playerDraft.quantities,
              [cardId]: Math.max(0, currentQuantity + delta)
            }
          }
        }
      };
    });
  }

  function updateManualAdjustment(playerId: string, value: string) {
    setDraft((current) => {
      const playerDraft = current.players[playerId] ?? { manualAdjustment: "", quantities: {} };

      return {
        ...current,
        players: {
          ...current.players,
          [playerId]: {
            ...playerDraft,
            manualAdjustment: value
          }
        }
      };
    });
  }

  function updateMultiplier(value: string) {
    setDraft((current) => ({
      ...current,
      multiplier: value
    }));
  }

  function save() {
    const nextData = round
      ? updateRound(data, match, cards, round.id, draft)
      : createRound(data, match, cards, draft);

    setData(nextData);
    clearRoundDraft(match.id);
    router.push(`/matches/${match.id}`);
  }

  return (
    <div className="space-y-5 pb-20">
      <Link href={`/matches/${match.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-felt">
        <ArrowLeft size={18} />
        До партії
      </Link>

      <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
        <SectionTitle
          title={round ? `Редагувати раунд ${round.roundNumber}` : `Раунд ${roundNumber}`}
        />
        {!round ? <p className="mb-3 text-xs font-bold text-felt">Чернетка зберігається автоматично</p> : null}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={inputMode === "manual" ? "primary" : "secondary"} onClick={() => setInputMode("manual")}>
            Очки
          </Button>
          <Button
            type="button"
            variant={inputMode === "cards" ? "primary" : "secondary"}
            disabled={cards.length === 0}
            onClick={() => setInputMode("cards")}
          >
            Карти
          </Button>
        </div>

        <label htmlFor="roundMultiplier" className="mt-3 grid gap-1.5 text-sm font-bold text-ink">
          <span className="text-xs font-black uppercase tracking-[0.08em] text-ink/58">Множник раунду</span>
          <input
            id="roundMultiplier"
            type="text"
            inputMode="decimal"
            pattern="[xX]?[0-9]*[.,]?[0-9]*"
            placeholder="x1"
            value={draft.multiplier}
            onChange={(event) => updateMultiplier(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            className="tap-target w-full rounded-md border border-ink/10 bg-white/92 px-3 text-base font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-ink/32 focus:border-felt focus:bg-white focus:ring-4 focus:ring-felt/12"
          />
        </label>
      </section>

      {match.players.map((player) => {
        const playerDraft = draft.players[player.id];
        const roundTotal = calculateDraftPlayerTotal(cards, playerDraft, draft.multiplier);
        const beforeTotal = baselineTotals.find((item) => item.playerId === player.id)?.total ?? 0;
        const afterTotal = beforeTotal + roundTotal;

        return (
          <section key={player.id} className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">{player.nameSnapshot}</h2>
              <span className="rounded-md bg-mist px-3 py-1 text-lg font-black text-felt">{roundTotal}</span>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs font-bold text-ink/60">
              <div className="rounded-md bg-mist px-2 py-2">
                <p>Було</p>
                <p className="mt-1 text-base text-ink">{beforeTotal}</p>
              </div>
              <div className="rounded-md bg-mist px-2 py-2">
                <p>Раунд</p>
                <p className="mt-1 text-base text-felt">{roundTotal}</p>
              </div>
              <div className="rounded-md bg-mist px-2 py-2">
                <p>Буде</p>
                <p className="mt-1 text-base text-ink">{afterTotal}</p>
              </div>
            </div>

            {inputMode === "cards" ? (
              <div className="grid gap-2">
                {cards.map((card) => {
                  const quantity = playerDraft?.quantities[card.id] ?? 0;
                  return (
                    <div key={card.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-mist px-3 py-2">
                      <div>
                        <p className="font-bold text-ink">{card.name}</p>
                        <p className="text-sm text-ink/55">
                          {card.suitOrColor || "без масті"} · {card.points} оч.
                        </p>
                      </div>
                      <div className="grid grid-cols-[44px_32px_44px] items-center gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-0"
                          aria-label={`Зменшити ${card.name} для ${player.nameSnapshot}`}
                          onClick={() => updateQuantity(player.id, card.id, -1)}
                        >
                          <Minus size={18} />
                        </Button>
                        <span className="text-center font-black text-ink">{quantity}</span>
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-0"
                          aria-label={`Збільшити ${card.name} для ${player.nameSnapshot}`}
                          onClick={() => updateQuantity(player.id, card.id, 1)}
                        >
                          <Plus size={18} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-3">
              <SignedNumberField
                label={inputMode === "manual" ? "Очки за раунд" : "Ручна корекція"}
                value={playerDraft?.manualAdjustment ?? ""}
                onChange={(value) => updateManualAdjustment(player.id, value)}
              />
            </div>
          </section>
        );
      })}

      <div className="app-sticky-action z-20">
        <Button type="button" className="w-full" onClick={save}>
          <Save size={18} />
          {round ? "Оновити раунд" : "Зберегти раунд"}
        </Button>
      </div>
    </div>
  );
}
