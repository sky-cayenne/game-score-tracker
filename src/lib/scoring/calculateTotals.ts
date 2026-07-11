import type { GameTemplateRules, Match, Round } from "@/types/domain";

export function calculateMatchTotals(match: Match, rounds: Round[]) {
  return match.players.map((player) => {
    const total = rounds.reduce((sum, round) => {
      const score = round.scores.find((item) => item.playerId === player.id);
      return sum + (score?.total ?? 0);
    }, 0);

    return {
      playerId: player.id,
      name: player.nameSnapshot,
      total
    };
  });
}

export type PlayerTotal = ReturnType<typeof calculateMatchTotals>[number];

export function calculateLeader(totals: PlayerTotal[]) {
  if (totals.length === 0) {
    return null;
  }

  return totals.reduce((leader, current) => (current.total > leader.total ? current : leader), totals[0]);
}

export function getScoreLimitState(
  match: Match,
  rounds: Round[],
  scoreLimit: number | null,
  scoreLimitMode: GameTemplateRules["scoreLimitMode"] | undefined
) {
  if (scoreLimit === null) {
    return null;
  }

  const mode = scoreLimitMode === "lose" ? "lose" : "win";
  const totals = calculateMatchTotals(match, rounds);
  const reached = totals.filter((player) => player.total >= scoreLimit);
  const remaining = totals.filter((player) => player.total < scoreLimit);

  if (reached.length === 0) {
    return null;
  }

  return {
    mode,
    scoreLimit,
    reached,
    remaining,
    singleRemainingWinner: mode === "lose" && remaining.length === 1 ? remaining[0] : null
  };
}

export function isMatchFinished(
  match: Match,
  rounds: Round[],
  roundLimit: number | null,
  scoreLimit: number | null,
  scoreLimitMode: GameTemplateRules["scoreLimitMode"] | undefined = "win"
) {
  const reachedRoundLimit = roundLimit !== null && rounds.length >= roundLimit;
  const reachedScoreLimit = getScoreLimitState(match, rounds, scoreLimit, scoreLimitMode) !== null;

  return reachedRoundLimit || reachedScoreLimit;
}
