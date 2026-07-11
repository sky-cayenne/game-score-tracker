"use client";

import type { AppData, GameTemplate } from "@/types/domain";

const STORAGE_KEY = "card-scorekeeper:data:v1";
const UNO_FLIP_PRESET_MIGRATION_KEY = "card-scorekeeper:migration:uno-flip-preset:v1";
const BACKUP_APP_NAME = "card-scorekeeper";
const BACKUP_SCHEMA_VERSION = 1;

export type AppDataBackup = {
  app: typeof BACKUP_APP_NAME;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  data: AppData;
};

export type BackupParseResult = { ok: true; data: AppData } | { ok: false; error: string };

export const emptyData: AppData = {
  templates: [],
  players: [],
  matches: [],
  rounds: []
};

export function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function loadData(): AppData {
  if (typeof window === "undefined") {
    return emptyData;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyData;
    }

    return { ...emptyData, ...JSON.parse(raw) } as AppData;
  } catch {
    return emptyData;
  }
}

export function saveData(data: AppData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Safari can throw in restricted/private storage modes. Keep in-memory state usable.
  }
}

export function createBackup(data: AppData): AppDataBackup {
  return {
    app: BACKUP_APP_NAME,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: nowIso(),
    data
  };
}

export function parseBackup(raw: string): BackupParseResult {
  try {
    const parsed = JSON.parse(raw) as Partial<AppDataBackup>;

    if (!isRecord(parsed)) {
      return { ok: false, error: "Файл має бути JSON-обʼєктом резервної копії." };
    }

    if (parsed.app !== BACKUP_APP_NAME || parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
      return { ok: false, error: "Це не резервна копія цього додатка або версія схеми не підтримується." };
    }

    if (!isString(parsed.exportedAt) || Number.isNaN(Date.parse(parsed.exportedAt))) {
      return { ok: false, error: "У файлі немає коректної дати експорту." };
    }

    const dataResult = validateAppData(parsed.data);
    if (!dataResult.ok) {
      return dataResult;
    }

    return { ok: true, data: dataResult.data };
  } catch {
    return { ok: false, error: "Файл не є коректним JSON." };
  }
}

function validateAppData(value: unknown): BackupParseResult {
  if (!isRecord(value)) {
    return { ok: false, error: "У резервній копії немає коректного блоку даних." };
  }

  const data = value as Partial<AppData>;
  if (!Array.isArray(data.templates) || !Array.isArray(data.players) || !Array.isArray(data.matches) || !Array.isArray(data.rounds)) {
    return { ok: false, error: "У файлі мають бути шаблони, гравці, партії та раунди." };
  }

  if (data.templates.length > 500 || data.players.length > 1000 || data.matches.length > 2000 || data.rounds.length > 20000) {
    return { ok: false, error: "Файл занадто великий для локального MVP-імпорту." };
  }

  if (!data.templates.every(isGameTemplate)) {
    return { ok: false, error: "У файлі є шаблон гри з некоректною структурою." };
  }

  if (!data.players.every(isPlayer)) {
    return { ok: false, error: "У файлі є гравець з некоректною структурою." };
  }

  if (!data.matches.every(isMatch)) {
    return { ok: false, error: "У файлі є партія з некоректною структурою." };
  }

  if (!data.rounds.every(isRound)) {
    return { ok: false, error: "У файлі є раунд з некоректною структурою." };
  }

  const matchIds = new Set(data.matches.map((match) => match.id));
  const invalidRound = data.rounds.find((round) => !matchIds.has(round.matchId));
  if (invalidRound) {
    return { ok: false, error: "У файлі є раунд без відповідної партії." };
  }

  const matchPlayers = new Map(data.matches.map((match) => [match.id, new Set(match.players.map((player) => player.id))]));
  const invalidRoundScore = data.rounds.find((round) =>
    round.scores.some((score) => !matchPlayers.get(round.matchId)?.has(score.playerId))
  );
  if (invalidRoundScore) {
    return { ok: false, error: "У файлі є рахунок раунду для гравця, якого немає в партії." };
  }

  return {
    ok: true,
    data: {
      templates: data.templates,
      players: data.players,
      matches: data.matches,
      rounds: data.rounds
    }
  };
}

function isGameTemplate(value: unknown): value is AppData["templates"][number] {
  if (!isRecord(value)) {
    return false;
  }

  const template = value as AppData["templates"][number];
  return (
    isString(template.id) &&
    isString(template.name) &&
    Array.isArray(template.cards) &&
    template.cards.length <= 1000 &&
    template.cards.every(isCardTemplate) &&
    isTemplateRules(template.rules) &&
    isString(template.createdAt) &&
    isString(template.updatedAt)
  );
}

function isCardTemplate(value: unknown): value is AppData["templates"][number]["cards"][number] {
  if (!isRecord(value)) {
    return false;
  }

  const card = value as AppData["templates"][number]["cards"][number];
  return (
    isString(card.id) &&
    isString(card.name) &&
    isFiniteNumber(card.points) &&
    isString(card.suitOrColor) &&
    isFiniteNumber(card.sortOrder) &&
    isString(card.createdAt) &&
    isString(card.updatedAt)
  );
}

function isTemplateRules(value: unknown): value is AppData["templates"][number]["rules"] {
  if (!isRecord(value)) {
    return false;
  }

  const rules = value as AppData["templates"][number]["rules"];
  return (
    isNullableFiniteNumber(rules.roundLimit) &&
    isNullableFiniteNumber(rules.winningScoreLimit) &&
    (rules.scoreLimitMode === "win" || rules.scoreLimitMode === "lose") &&
    Array.isArray(rules.allowedRoundMultipliers) &&
    rules.allowedRoundMultipliers.every(isFiniteNumber)
  );
}

function isPlayer(value: unknown): value is AppData["players"][number] {
  if (!isRecord(value)) {
    return false;
  }

  const player = value as AppData["players"][number];
  return isString(player.id) && isString(player.name) && isString(player.createdAt);
}

function isMatch(value: unknown): value is AppData["matches"][number] {
  if (!isRecord(value)) {
    return false;
  }

  const match = value as AppData["matches"][number];
  return (
    isString(match.id) &&
    isString(match.templateId) &&
    isString(match.templateNameSnapshot) &&
    isString(match.name) &&
    Array.isArray(match.players) &&
    match.players.every(isMatchPlayer) &&
    (match.status === "active" || match.status === "finished" || match.status === "archived") &&
    isString(match.startedAt) &&
    (match.endedAt === null || isString(match.endedAt)) &&
    typeof match.saveToLogs === "boolean"
  );
}

function isMatchPlayer(value: unknown): value is AppData["matches"][number]["players"][number] {
  if (!isRecord(value)) {
    return false;
  }

  const player = value as AppData["matches"][number]["players"][number];
  return isString(player.id) && isString(player.playerId) && isString(player.nameSnapshot) && isFiniteNumber(player.sortOrder);
}

function isRound(value: unknown): value is AppData["rounds"][number] {
  if (!isRecord(value)) {
    return false;
  }

  const round = value as AppData["rounds"][number];
  return (
    isString(round.id) &&
    isString(round.matchId) &&
    isFiniteNumber(round.roundNumber) &&
    isFiniteNumber(round.multiplier) &&
    Array.isArray(round.scores) &&
    round.scores.every(isRoundPlayerScore) &&
    isString(round.createdAt)
  );
}

function isRoundPlayerScore(value: unknown): value is AppData["rounds"][number]["scores"][number] {
  if (!isRecord(value)) {
    return false;
  }

  const score = value as AppData["rounds"][number]["scores"][number];
  return (
    isString(score.playerId) &&
    Array.isArray(score.cardEntries) &&
    score.cardEntries.every(isRoundCardEntry) &&
    isFiniteNumber(score.manualAdjustment) &&
    isFiniteNumber(score.total)
  );
}

function isRoundCardEntry(value: unknown): value is AppData["rounds"][number]["scores"][number]["cardEntries"][number] {
  if (!isRecord(value)) {
    return false;
  }

  const entry = value as AppData["rounds"][number]["scores"][number]["cardEntries"][number];
  return (
    isString(entry.cardTemplateId) &&
    isString(entry.cardNameSnapshot) &&
    isFiniteNumber(entry.pointsSnapshot) &&
    isFiniteNumber(entry.quantity)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

export function createSeedData(): AppData {
  const createdAt = nowIso();
  return {
    ...emptyData,
    templates: [createBridgeTemplate(createdAt), createUnoFlipTemplate(createdAt)]
  };
}

function createBridgeTemplate(createdAt: string): GameTemplate {
  return {
    id: createId(),
    name: "Брідж",
    createdAt,
    updatedAt: createdAt,
    rules: {
      roundLimit: null,
      winningScoreLimit: 250,
      scoreLimitMode: "lose",
      allowedRoundMultipliers: [1, 2, 3, 4]
    },
    cards: createBridgeDeck(createdAt)
  };
}

function createUnoFlipTemplate(createdAt: string): GameTemplate {
  return {
    id: createId(),
    name: "Uno Flip",
    createdAt,
    updatedAt: createdAt,
    rules: {
      roundLimit: null,
      winningScoreLimit: 500,
      scoreLimitMode: "win",
      allowedRoundMultipliers: [1, 2, 3, 4]
    },
    cards: createUnoFlipDeck(createdAt)
  };
}

function createBridgeDeck(createdAt: string): GameTemplate["cards"] {
  const suits = ["Піки", "Чирви", "Хрести", "Бубни"];
  const ranks = ["6", "7", "8", "9", "10", "Валет", "Дама", "Король", "Туз"];

  return suits.flatMap((suit, suitIndex) =>
    ranks.map((rank, rankIndex) => ({
      id: createId(),
      name: rank,
      points: getBridgeCardPoints(rank, suit),
      suitOrColor: suit,
      sortOrder: suitIndex * ranks.length + rankIndex,
      createdAt,
      updatedAt: createdAt
    }))
  );
}

function getBridgeCardPoints(rank: string, suit: string) {
  if (rank === "6" || rank === "7" || rank === "8" || rank === "9") {
    return 0;
  }

  if (rank === "10" || rank === "Король") {
    return 10;
  }

  if (rank === "Валет") {
    return 20;
  }

  if (rank === "Дама") {
    return suit === "Піки" ? 50 : 10;
  }

  if (rank === "Туз") {
    return 15;
  }

  return 0;
}

function createUnoFlipDeck(createdAt: string): GameTemplate["cards"] {
  const lightColors = ["Червоний", "Жовтий", "Зелений", "Синій"];
  const darkColors = ["Бірюзовий", "Помаранчевий", "Рожевий", "Фіолетовий"];
  const cards: GameTemplate["cards"] = [];

  lightColors.forEach((color) => {
    addUnoColorCards(cards, {
      side: "Світла сторона",
      color,
      numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      actions: [
        ["Візьми 1", 10],
        ["Пропуск", 20],
        ["Реверс", 20],
        ["Flip", 20]
      ],
      createdAt
    });
  });

  darkColors.forEach((color) => {
    addUnoColorCards(cards, {
      side: "Темна сторона",
      color,
      numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      actions: [
        ["Візьми 5", 20],
        ["Пропустити всіх", 30],
        ["Реверс", 20],
        ["Flip", 20]
      ],
      createdAt
    });
  });

  addUnoCard(cards, "Wild", 40, "Світла сторона / Wild", createdAt);
  addUnoCard(cards, "Wild Візьми 2", 50, "Світла сторона / Wild", createdAt);
  addUnoCard(cards, "Wild", 40, "Темна сторона / Wild", createdAt);
  addUnoCard(cards, "Wild колір", 60, "Темна сторона / Wild", createdAt);

  return cards;
}

function addUnoColorCards(
  cards: GameTemplate["cards"],
  options: {
    side: string;
    color: string;
    numbers: number[];
    actions: Array<[name: string, points: number]>;
    createdAt: string;
  }
) {
  const suitOrColor = `${options.side} / ${options.color}`;

  options.numbers.forEach((number) => {
    addUnoCard(cards, String(number), number, suitOrColor, options.createdAt);
  });

  options.actions.forEach(([name, points]) => {
    addUnoCard(cards, name, points, suitOrColor, options.createdAt);
  });
}

function addUnoCard(cards: GameTemplate["cards"], name: string, points: number, suitOrColor: string, createdAt: string) {
  cards.push({
    id: createId(),
    name,
    points,
    suitOrColor,
    sortOrder: cards.length,
    createdAt,
    updatedAt: createdAt
  });
}

export function clearData() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage restrictions; UI state will still be reset by the caller.
  }
}

export function resetToSeedData() {
  const nextData = createSeedData();
  saveData(nextData);
  return nextData;
}

export function seedDemoData() {
  const existing = loadData();
  if (existing.templates.length > 0) {
    const hasUnoFlip = existing.templates.some((template) => template.name.trim().toLowerCase() === "uno flip");
    const wasUnoFlipMigrationApplied = window.localStorage.getItem(UNO_FLIP_PRESET_MIGRATION_KEY) === "done";

    if (!hasUnoFlip && !wasUnoFlipMigrationApplied) {
      const createdAt = nowIso();
      const nextData = {
        ...existing,
        templates: [...existing.templates, createUnoFlipTemplate(createdAt)]
      };
      saveData(nextData);
      window.localStorage.setItem(UNO_FLIP_PRESET_MIGRATION_KEY, "done");
      return nextData;
    }

    return existing;
  }

  const nextData = createSeedData();
  saveData(nextData);
  window.localStorage.setItem(UNO_FLIP_PRESET_MIGRATION_KEY, "done");
  return nextData;
}
