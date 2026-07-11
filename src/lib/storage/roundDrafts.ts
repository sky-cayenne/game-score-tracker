"use client";

import type { Id } from "@/types/domain";
import type { RoundDraft } from "@/lib/repositories/roundsRepository";

const DRAFT_KEY_PREFIX = "card-scorekeeper:round-draft:v1:";

export function roundDraftKey(matchId: Id) {
  return `${DRAFT_KEY_PREFIX}${matchId}`;
}

export function loadRoundDraft(matchId: Id) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(roundDraftKey(matchId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RoundDraft;
  } catch {
    return null;
  }
}

export function saveRoundDraft(matchId: Id, draft: RoundDraft) {
  window.localStorage.setItem(roundDraftKey(matchId), JSON.stringify(draft));
}

export function clearRoundDraft(matchId: Id) {
  window.localStorage.removeItem(roundDraftKey(matchId));
}
