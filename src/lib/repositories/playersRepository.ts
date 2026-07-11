import { createId, nowIso } from "@/lib/storage/localDb";
import type { AppData, MatchPlayer, Player } from "@/types/domain";

export function createPlayer(name: string): Player {
  return {
    id: createId(),
    name,
    createdAt: nowIso()
  };
}

export function createMatchPlayer(player: Player, sortOrder: number): MatchPlayer {
  return {
    id: createId(),
    playerId: player.id,
    nameSnapshot: player.name,
    sortOrder
  };
}

export function createPlayersFromNames(names: string[]) {
  return names.map((name) => createPlayer(name));
}

export function appendPlayers(data: AppData, players: Player[]) {
  return {
    ...data,
    players: [...data.players, ...players]
  };
}
