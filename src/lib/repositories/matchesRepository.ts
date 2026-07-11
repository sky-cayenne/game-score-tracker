import { createMatchPlayer, createPlayersFromNames } from "@/lib/repositories/playersRepository";
import { createId, nowIso } from "@/lib/storage/localDb";
import type { AppData, Id, Match, MatchPlayer, MatchStatus } from "@/types/domain";

export type CreateMatchInput = {
  name: string;
  templateId: Id;
  playerNames: string[];
};

export function createMatch(data: AppData, input: CreateMatchInput) {
  const template = data.templates.find((item) => item.id === input.templateId);
  const playerNames = normalizePlayerNames(input.playerNames);

  if (!template || playerNames.length < 2) {
    return { data, matchId: null };
  }

  const createdAt = nowIso();
  const players = createPlayersFromNames(playerNames);
  const matchPlayers = players.map((player, index) => createMatchPlayer(player, index));
  const match: Match = {
    id: createId(),
    templateId: template.id,
    templateNameSnapshot: template.name,
    name: input.name.trim() || `${template.name} партія`,
    players: matchPlayers,
    status: "active",
    startedAt: createdAt,
    endedAt: null,
    saveToLogs: true
  };

  return {
    data: {
      ...data,
      players: [...data.players, ...players],
      matches: [match, ...data.matches]
    },
    matchId: match.id
  };
}

export function finishMatch(data: AppData, matchId: Id, saveToLogs: boolean) {
  const status: MatchStatus = saveToLogs ? "archived" : "finished";

  return {
    ...data,
    matches: data.matches.map((match) =>
      match.id === matchId
        ? {
            ...match,
            status,
            endedAt: nowIso(),
            saveToLogs
          }
        : match
    )
  };
}

export function createRematch(data: AppData, matchId: Id) {
  const source = data.matches.find((match) => match.id === matchId);
  const template = source ? data.templates.find((item) => item.id === source.templateId) : null;

  if (!source || !template || source.players.length < 2) {
    return { data, matchId: null };
  }

  const startedAt = nowIso();
  const match: Match = {
    id: createId(),
    templateId: source.templateId,
    templateNameSnapshot: template.name,
    name: incrementMatchName(source.name),
    players: source.players
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((player, index) => ({
        ...player,
        id: createId(),
        sortOrder: index
      })),
    status: "active",
    startedAt,
    endedAt: null,
    saveToLogs: true
  };

  return {
    data: {
      ...data,
      matches: [match, ...data.matches]
    },
    matchId: match.id
  };
}

export function restartMatch(data: AppData, matchId: Id) {
  const status: MatchStatus = "active";

  return {
    ...data,
    rounds: data.rounds.filter((round) => round.matchId !== matchId),
    matches: data.matches.map((match) =>
      match.id === matchId
        ? {
            ...match,
            status,
            endedAt: null,
            saveToLogs: true
          }
        : match
    )
  };
}

export function updateMatchName(data: AppData, matchId: Id, name: string) {
  return {
    ...data,
    matches: data.matches.map((match) => (match.id === matchId ? { ...match, name: name.trim() || match.name } : match))
  };
}

export function addMatchPlayer(data: AppData, matchId: Id, name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    return data;
  }

  const match = data.matches.find((item) => item.id === matchId);
  if (!match) {
    return data;
  }

  const player = createPlayersFromNames([normalizedName])[0];
  const matchPlayer = createMatchPlayer(player, match.players.length);

  return {
    ...data,
    players: [...data.players, player],
    matches: data.matches.map((item) =>
      item.id === matchId
        ? {
            ...item,
            players: [...item.players, matchPlayer]
          }
        : item
    )
  };
}

export function renameMatchPlayer(data: AppData, matchId: Id, matchPlayerId: Id, name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    return data;
  }

  const match = data.matches.find((item) => item.id === matchId);
  const matchPlayer = match?.players.find((player) => player.id === matchPlayerId);

  return {
    ...data,
    players: matchPlayer
      ? data.players.map((player) => (player.id === matchPlayer.playerId ? { ...player, name: normalizedName } : player))
      : data.players,
    matches: data.matches.map((item) =>
      item.id === matchId
        ? {
            ...item,
            players: item.players.map((player) =>
              player.id === matchPlayerId ? { ...player, nameSnapshot: normalizedName } : player
            )
          }
        : item
    )
  };
}

export function removeMatchPlayer(data: AppData, matchId: Id, matchPlayerId: Id) {
  return {
    ...data,
    matches: data.matches.map((match) =>
      match.id === matchId
        ? {
            ...match,
            players: normalizeMatchPlayerOrder(match.players.filter((player) => player.id !== matchPlayerId))
          }
        : match
    )
  };
}

export function deleteMatch(data: AppData, matchId: Id) {
  const match = data.matches.find((item) => item.id === matchId);
  const playerIds = new Set(match?.players.map((player) => player.playerId) ?? []);
  const usedPlayerIds = new Set(
    data.matches
      .filter((item) => item.id !== matchId)
      .flatMap((item) => item.players.map((player) => player.playerId))
  );

  return {
    ...data,
    matches: data.matches.filter((item) => item.id !== matchId),
    rounds: data.rounds.filter((round) => round.matchId !== matchId),
    players: data.players.filter((player) => !playerIds.has(player.id) || usedPlayerIds.has(player.id))
  };
}

export function getMatchRounds(data: AppData, matchId: Id) {
  return data.rounds.filter((round) => round.matchId === matchId).sort((a, b) => a.roundNumber - b.roundNumber);
}

export function normalizePlayerNames(names: string[]) {
  return names.map((name) => name.trim()).filter(Boolean);
}

export function incrementMatchName(name: string) {
  const trimmedName = name.trim();
  const match = trimmedName.match(/^(.*?)(\d+)$/);

  if (!match) {
    return `${trimmedName || "Партія"} 1`;
  }

  const [, prefix, numericSuffix] = match;
  const nextNumber = String(Number(numericSuffix) + 1);
  const paddedNextNumber = nextNumber.padStart(numericSuffix.length, "0");

  return `${prefix}${paddedNextNumber}`;
}

function normalizeMatchPlayerOrder(players: MatchPlayer[]) {
  return players.map((player, index) => ({
    ...player,
    sortOrder: index
  }));
}
