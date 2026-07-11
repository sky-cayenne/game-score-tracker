export type Id = string;

export type CardTemplate = {
  id: Id;
  name: string;
  points: number;
  suitOrColor: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GameTemplateRules = {
  roundLimit: number | null;
  winningScoreLimit: number | null;
  scoreLimitMode: "win" | "lose";
  allowedRoundMultipliers: number[];
};

export type GameTemplate = {
  id: Id;
  name: string;
  cards: CardTemplate[];
  rules: GameTemplateRules;
  createdAt: string;
  updatedAt: string;
};

export type Player = {
  id: Id;
  name: string;
  createdAt: string;
};

export type MatchPlayer = {
  id: Id;
  playerId: Id;
  nameSnapshot: string;
  sortOrder: number;
};

export type MatchStatus = "active" | "finished" | "archived";

export type Match = {
  id: Id;
  templateId: Id;
  templateNameSnapshot: string;
  name: string;
  players: MatchPlayer[];
  status: MatchStatus;
  startedAt: string;
  endedAt: string | null;
  saveToLogs: boolean;
};

export type RoundCardEntry = {
  cardTemplateId: Id;
  cardNameSnapshot: string;
  pointsSnapshot: number;
  quantity: number;
};

export type RoundPlayerScore = {
  playerId: Id;
  cardEntries: RoundCardEntry[];
  manualAdjustment: number;
  total: number;
};

export type Round = {
  id: Id;
  matchId: Id;
  roundNumber: number;
  multiplier: number;
  scores: RoundPlayerScore[];
  createdAt: string;
};

export type AppData = {
  templates: GameTemplate[];
  players: Player[];
  matches: Match[];
  rounds: Round[];
};
