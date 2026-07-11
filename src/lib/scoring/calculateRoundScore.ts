import type { RoundCardEntry } from "@/types/domain";

export function calculateRoundScore(
  entries: RoundCardEntry[],
  manualAdjustment: number,
  multiplier: number
) {
  const cardsTotal = entries.reduce((sum, entry) => {
    return sum + entry.quantity * entry.pointsSnapshot;
  }, 0);

  return (cardsTotal + manualAdjustment) * multiplier;
}
