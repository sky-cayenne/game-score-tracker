"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Minus, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
import { loadGroupEquivalentCardsPreference, saveGroupEquivalentCardsPreference } from "@/lib/storage/roundInputPreferences";
import { clearRoundDraft, loadRoundDraft, saveRoundDraft } from "@/lib/storage/roundDrafts";
import { useAppData } from "@/lib/storage/useAppData";
import type { CardTemplate, GameTemplate, Match, Round } from "@/types/domain";

type RoundEditorProps = {
  match: Match;
  template: GameTemplate;
  round?: Round;
  roundNumber: number;
};

type InputMode = "manual" | "cards";
type DisplayCard = Pick<CardTemplate, "id" | "name" | "points" | "suitOrColor" | "sortOrder"> & {
  cardIds: string[];
  equivalentCount: number;
};
type IncompleteRoundDialog = {
  missingPlayerNames: string[];
};

export function RoundEditor({ match, template, round, roundNumber }: RoundEditorProps) {
  const router = useRouter();
  const { data, setData } = useAppData();
  const cards = useMemo(() => template.cards.slice().sort((a, b) => a.sortOrder - b.sortOrder), [template.cards]);
  const baselineRounds = getMatchRounds(data, match.id).filter((item) => item.id !== round?.id);
  const baselineTotals = calculateMatchTotals(match, baselineRounds);
  const initialMode: InputMode = round?.scores.some((score) => score.cardEntries.length > 0) ? "cards" : "manual";
  const [inputMode, setInputMode] = useState<InputMode>(initialMode);
  const [groupEquivalentCards, setGroupEquivalentCards] = useState(loadGroupEquivalentCardsPreference);
  const displayCards = useMemo(() => createDisplayCards(cards, groupEquivalentCards), [cards, groupEquivalentCards]);
  const [draft, setDraft] = useState<RoundDraft>(() => round ? draftFromRound(round) : emptyRoundDraft());
  const [incompleteRoundDialog, setIncompleteRoundDialog] = useState<IncompleteRoundDialog | null>(null);
  const [collapsedCardLists, setCollapsedCardLists] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      match.players.map((player, index) => {
        const playerDraft = round ? draftFromRound(round).players[player.id] : undefined;
        const hasSelectedCards = Boolean(playerDraft && Object.values(playerDraft.quantities).some((quantity) => quantity > 0));
        return [player.id, index > 0 && !hasSelectedCards];
      })
    )
  );

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

  function updateDisplayCardQuantity(playerId: string, displayCard: DisplayCard, delta: number) {
    if (displayCard.cardIds.length === 1 || delta > 0) {
      updateQuantity(playerId, displayCard.cardIds[0], delta);
      return;
    }

    setDraft((current) => {
      const playerDraft = current.players[playerId] ?? { manualAdjustment: "", quantities: {} };
      const cardIdToDecrease = displayCard.cardIds.find((cardId) => (playerDraft.quantities[cardId] ?? 0) > 0) ?? displayCard.cardIds[0];
      const currentQuantity = playerDraft.quantities[cardIdToDecrease] ?? 0;

      return {
        ...current,
        players: {
          ...current.players,
          [playerId]: {
            ...playerDraft,
            quantities: {
              ...playerDraft.quantities,
              [cardIdToDecrease]: Math.max(0, currentQuantity - 1)
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

  function toggleCardList(playerId: string) {
    setCollapsedCardLists((current) => ({
      ...current,
      [playerId]: !current[playerId]
    }));
  }

  function toggleGroupEquivalentCards() {
    setGroupEquivalentCards((current) => {
      const nextValue = !current;
      saveGroupEquivalentCardsPreference(nextValue);
      return nextValue;
    });
  }

  function save() {
    const missingPlayerNames = getMissingPlayerNames(match, draft);
    const hasAnyPlayerInput = missingPlayerNames.length < match.players.length;

    if (missingPlayerNames.length > 0 && hasAnyPlayerInput) {
      setIncompleteRoundDialog({ missingPlayerNames });
      return;
    }

    persistRound();
  }

  function persistRound() {
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

        {inputMode === "cards" && cards.length > 0 ? (
          <button
            type="button"
            className="tap-target mt-3 flex w-full items-center justify-between gap-3 rounded-md border border-ink/10 bg-mist px-3 py-2 text-left transition active:scale-[0.99]"
            onClick={toggleGroupEquivalentCards}
            aria-pressed={groupEquivalentCards}
          >
            <span>
              <span className="block text-sm font-black text-ink">Згрупувати однакові карти</span>
              <span className="block text-xs font-bold text-ink/55">Одна назва й однакові очки показуються одним рядком.</span>
            </span>
            <span
              className={`grid h-8 w-16 shrink-0 items-center rounded-full p-1 transition ${
                groupEquivalentCards ? "bg-felt" : "bg-ink/12"
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full bg-white shadow-soft transition ${
                  groupEquivalentCards ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        ) : null}
      </section>

      {match.players.map((player) => {
        const playerDraft = draft.players[player.id];
        const roundTotal = calculateDraftPlayerTotal(cards, playerDraft, draft.multiplier);
        const beforeTotal = baselineTotals.find((item) => item.playerId === player.id)?.total ?? 0;
        const afterTotal = beforeTotal + roundTotal;
        const selectedCardsCount = Object.values(playerDraft?.quantities ?? {}).reduce((total, quantity) => total + quantity, 0);
        const isCardListCollapsed = collapsedCardLists[player.id] ?? false;

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
                <button
                  type="button"
                  className="tap-target flex w-full items-center justify-between gap-3 rounded-md border border-ink/10 bg-mist px-3 py-2 text-left transition active:scale-[0.99]"
                  onClick={() => toggleCardList(player.id)}
                  aria-expanded={!isCardListCollapsed}
                >
                  <span>
                    <span className="block text-sm font-black text-ink">Карти з колоди</span>
                    <span className="block text-xs font-bold text-ink/55">
                      {selectedCardsCount > 0 ? `Обрано карт: ${selectedCardsCount}` : "Відсортовано за очками й номіналом"}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-black text-felt">
                    {isCardListCollapsed ? "Розгорнути" : "Згорнути"}
                    {isCardListCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </span>
                </button>

                {!isCardListCollapsed
                  ? displayCards.map((card) => {
                      const quantity = getDisplayCardQuantity(playerDraft, card);
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
                              onClick={() => updateDisplayCardQuantity(player.id, card, -1)}
                            >
                              <Minus size={18} />
                            </Button>
                            <span className="text-center font-black text-ink">{quantity}</span>
                            <Button
                              type="button"
                              variant="secondary"
                              className="px-0"
                              aria-label={`Збільшити ${card.name} для ${player.nameSnapshot}`}
                              onClick={() => updateDisplayCardQuantity(player.id, card, 1)}
                            >
                              <Plus size={18} />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  : null}
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

      <ConfirmDialog
        open={Boolean(incompleteRoundDialog)}
        title="Не всі гравці заповнені"
        description={formatIncompleteRoundDescription(incompleteRoundDialog?.missingPlayerNames ?? [])}
        confirmLabel="Зберегти як є"
        cancelLabel="Продовжити ввід"
        variant="finish"
        onConfirm={() => {
          setIncompleteRoundDialog(null);
          persistRound();
        }}
        onCancel={() => setIncompleteRoundDialog(null)}
      />
    </div>
  );
}

function getMissingPlayerNames(match: Match, draft: RoundDraft) {
  return match.players
    .filter((player) => !hasPlayerRoundInput(draft.players[player.id]))
    .map((player) => player.nameSnapshot);
}

function hasPlayerRoundInput(playerDraft: RoundDraft["players"][string] | undefined) {
  if (!playerDraft) {
    return false;
  }

  const hasManualAdjustment = playerDraft.manualAdjustment.trim() !== "" && playerDraft.manualAdjustment.trim() !== "-";
  const hasSelectedCards = Object.values(playerDraft.quantities).some((quantity) => quantity > 0);
  return hasManualAdjustment || hasSelectedCards;
}

function formatIncompleteRoundDescription(missingPlayerNames: string[]) {
  if (missingPlayerNames.length === 0) {
    return "";
  }

  const visibleNames = missingPlayerNames.slice(0, 3).join(", ");
  const restCount = missingPlayerNames.length - 3;
  const restText = restCount > 0 ? ` та ще ${restCount}` : "";
  return `Немає очок для: ${visibleNames}${restText}. Можеш зберегти раунд як є або повернутися й дозаповнити.`;
}

function createDisplayCards(cards: CardTemplate[], groupEquivalentCards: boolean): DisplayCard[] {
  const sortedCards = cards.slice().sort(compareCardsForRoundInput);

  if (!groupEquivalentCards) {
    return sortedCards.map((card) => ({ ...card, cardIds: [card.id], equivalentCount: 1 }));
  }

  const groups = new Map<string, DisplayCard>();

  sortedCards.forEach((card) => {
    const key = `${normalizeCardName(card.name)}:${card.points}`;
    const existing = groups.get(key);

    if (existing) {
      existing.cardIds.push(card.id);
      existing.equivalentCount += 1;
      existing.suitOrColor = `${existing.equivalentCount} варіанти`;
      return;
    }

    groups.set(key, {
      ...card,
      suitOrColor: card.suitOrColor || "без масті",
      cardIds: [card.id],
      equivalentCount: 1
    });
  });

  return Array.from(groups.values());
}

function compareCardsForRoundInput(a: CardTemplate, b: CardTemplate) {
  return (
    b.points - a.points ||
    getCardNameSortWeight(a.name) - getCardNameSortWeight(b.name) ||
    a.name.localeCompare(b.name, "uk") ||
    a.sortOrder - b.sortOrder
  );
}

function getCardNameSortWeight(name: string) {
  const normalizedName = normalizeCardName(name);
  const numericValue = Number(normalizedName.replace(",", "."));

  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  const rankWeights: Record<string, number> = {
    валет: 11,
    в: 11,
    дама: 12,
    д: 12,
    король: 13,
    к: 13,
    туз: 14,
    т: 14
  };

  return rankWeights[normalizedName] ?? 100;
}

function normalizeCardName(name: string) {
  return name.trim().toLowerCase();
}

function getDisplayCardQuantity(playerDraft: RoundDraft["players"][string] | undefined, displayCard: DisplayCard) {
  return displayCard.cardIds.reduce((total, cardId) => total + (playerDraft?.quantities[cardId] ?? 0), 0);
}
