import { calculateRoundScore } from "@/lib/scoring/calculateRoundScore";
import { createId, nowIso } from "@/lib/storage/localDb";
import type { AppData, CardTemplate, Id, Match, Round, RoundCardEntry } from "@/types/domain";

export type RoundPlayerDraft = {
  manualAdjustment: string;
  quantities: Record<Id, number>;
};

export type RoundDraft = {
  multiplier: string;
  players: Record<Id, RoundPlayerDraft>;
};

export function emptyRoundDraft(multiplier = ""): RoundDraft {
  return {
    multiplier: String(multiplier),
    players: {}
  };
}

export function draftFromRound(round: Round): RoundDraft {
  return {
    multiplier: String(round.multiplier),
    players: Object.fromEntries(
      round.scores.map((score) => [
        score.playerId,
        {
          manualAdjustment: String(score.manualAdjustment),
          quantities: Object.fromEntries(score.cardEntries.map((entry) => [entry.cardTemplateId, entry.quantity]))
        }
      ])
    )
  };
}

export function createRound(data: AppData, match: Match, cards: CardTemplate[], draft: RoundDraft) {
  const existingRounds = getRoundsForMatch(data, match.id);
  const round = buildRound(match, cards, draft, existingRounds.length + 1);

  return {
    ...data,
    rounds: [...data.rounds, round]
  };
}

export function updateRound(data: AppData, match: Match, cards: CardTemplate[], roundId: Id, draft: RoundDraft) {
  const currentRound = data.rounds.find((round) => round.id === roundId);
  if (!currentRound) {
    return data;
  }

  const nextRound = buildRound(match, cards, draft, currentRound.roundNumber, currentRound.id, currentRound.createdAt);

  return {
    ...data,
    rounds: data.rounds.map((round) => (round.id === roundId ? nextRound : round))
  };
}

export function deleteLastRound(data: AppData, matchId: Id) {
  const rounds = getRoundsForMatch(data, matchId);
  const lastRound = rounds.at(-1);

  if (!lastRound) {
    return data;
  }

  return {
    ...data,
    rounds: data.rounds.filter((round) => round.id !== lastRound.id)
  };
}

export function getRoundsForMatch(data: AppData, matchId: Id) {
  return data.rounds.filter((round) => round.matchId === matchId).sort((a, b) => a.roundNumber - b.roundNumber);
}

export function buildEntries(cards: CardTemplate[], playerDraft: RoundPlayerDraft | undefined): RoundCardEntry[] {
  const quantities = playerDraft?.quantities ?? {};

  return cards
    .map((card) => ({
      cardTemplateId: card.id,
      cardNameSnapshot: card.name,
      pointsSnapshot: card.points,
      quantity: quantities[card.id] ?? 0
    }))
    .filter((entry) => entry.quantity > 0);
}

export function calculateDraftPlayerTotal(cards: CardTemplate[], playerDraft: RoundPlayerDraft | undefined, multiplier: string) {
  return calculateRoundScore(buildEntries(cards, playerDraft), parseScoreInput(playerDraft?.manualAdjustment), parseMultiplierInput(multiplier));
}

export function parseScoreInput(value: string | number | undefined) {
  if (value === undefined || value === "" || value === "-") {
    return 0;
  }

  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseMultiplierInput(value: string | number | undefined) {
  if (value === undefined || value === "" || value === "-" || value === "x") {
    return 1;
  }

  const normalized = String(value).trim().replace(/^x/i, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 1;
}

function buildRound(
  match: Match,
  cards: CardTemplate[],
  draft: RoundDraft,
  roundNumber: number,
  id = createId(),
  createdAt = nowIso()
): Round {
  return {
    id,
    matchId: match.id,
    roundNumber,
    multiplier: parseMultiplierInput(draft.multiplier),
    createdAt,
    scores: match.players.map((player) => {
      const playerDraft = draft.players[player.id] ?? { manualAdjustment: "", quantities: {} };
      const cardEntries = buildEntries(cards, playerDraft);
      const manualAdjustment = parseScoreInput(playerDraft.manualAdjustment);
      const multiplier = parseMultiplierInput(draft.multiplier);

      return {
        playerId: player.id,
        cardEntries,
        manualAdjustment,
        total: calculateRoundScore(cardEntries, manualAdjustment, multiplier)
      };
    })
  };
}
