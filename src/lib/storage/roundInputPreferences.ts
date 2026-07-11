"use client";

const ROUND_INPUT_GROUP_EQUIVALENT_CARDS_KEY = "card-scorekeeper:round-input:group-equivalent-cards:v1";

export function loadGroupEquivalentCardsPreference() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(ROUND_INPUT_GROUP_EQUIVALENT_CARDS_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveGroupEquivalentCardsPreference(value: boolean) {
  try {
    window.localStorage.setItem(ROUND_INPUT_GROUP_EQUIVALENT_CARDS_KEY, String(value));
  } catch {
    // Keep the current UI state even if Safari blocks localStorage.
  }
}
