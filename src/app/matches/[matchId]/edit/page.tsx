"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { TextField } from "@/components/ui/TextField";
import {
  addMatchPlayer,
  getMatchRounds,
  removeMatchPlayer,
  renameMatchPlayer,
  updateMatchName
} from "@/lib/repositories/matchesRepository";
import { useAppData } from "@/lib/storage/useAppData";
import { playerNameSuggestions, randomSuggestion } from "@/lib/suggestions";

export default function EditMatchPage() {
  const params = useParams<{ matchId: string }>();
  const { data, ready, setData } = useAppData();
  const match = data.matches.find((item) => item.id === params.matchId);
  const rounds = getMatchRounds(data, params.matchId);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerNamePlaceholder, setNewPlayerNamePlaceholder] = useState(playerNameSuggestions[0]);

  useEffect(() => {
    setNewPlayerNamePlaceholder(randomSuggestion(playerNameSuggestions));
  }, []);

  if (ready && !match) {
    notFound();
  }

  if (!match) {
    return <p className="text-sm text-ink/60">Завантаження...</p>;
  }

  const activeMatch = match;
  const hasRounds = rounds.length > 0;
  const isReadOnly = activeMatch.status !== "active";

  function saveMatchName(formData: FormData) {
    const name = String(formData.get("matchName") ?? "").trim();
    if (!name || isReadOnly) {
      return;
    }

    setData(updateMatchName(data, activeMatch.id, name));
  }

  function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasRounds || isReadOnly) {
      return;
    }

    setData(addMatchPlayer(data, activeMatch.id, newPlayerName));
    setNewPlayerName("");
  }

  function renamePlayer(matchPlayerId: string, formData: FormData) {
    const name = String(formData.get("playerName") ?? "").trim();
    setData(renameMatchPlayer(data, activeMatch.id, matchPlayerId, name));
  }

  function removePlayer(matchPlayerId: string) {
    if (hasRounds || isReadOnly || activeMatch.players.length <= 2) {
      return;
    }

    setData(removeMatchPlayer(data, activeMatch.id, matchPlayerId));
  }

  return (
    <div className="space-y-5">
      <Link href={`/matches/${activeMatch.id}`} className="inline-flex items-center gap-2 text-sm font-black text-felt">
        <ArrowLeft size={18} />
        До партії
      </Link>

      <SectionTitle title="Редагування партії" subtitle={isReadOnly ? "Завершені партії відкриваються лише для перегляду." : activeMatch.name} />

      {isReadOnly ? (
        <p className="rounded-md border border-dashed border-ink/20 bg-white p-4 text-sm font-bold text-ink/60">
          Ця партія вже в історії, тому її назва й гравці зафіксовані.
        </p>
      ) : (
        <>
          <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
            <SectionTitle title="Назва партії" />
            <form action={saveMatchName} className="grid gap-3">
              <TextField label="Назва" name="matchName" defaultValue={activeMatch.name} required />
              <Button type="submit" variant="secondary">
                <Save size={16} />
                Зберегти назву
              </Button>
            </form>
          </section>

          <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
            <SectionTitle
              title="Гравці"
              subtitle={hasRounds ? "Після першого раунду склад зафіксований, але імена можна уточнити." : "До першого раунду можна змінювати склад."}
            />
            <div className="grid gap-3">
              {activeMatch.players
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((player) => (
                  <form key={player.id} action={(formData) => renamePlayer(player.id, formData)} className="grid gap-2 rounded-md bg-mist p-3">
                    <TextField label="Ім’я" name="playerName" defaultValue={player.nameSnapshot} required />
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="submit" variant="secondary">
                        <Save size={16} />
                        Зберегти
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={hasRounds || activeMatch.players.length <= 2}
                        onClick={() => removePlayer(player.id)}
                      >
                        <Trash2 size={16} />
                        Видалити
                      </Button>
                    </div>
                  </form>
                ))}
            </div>

            {!hasRounds ? (
              <form onSubmit={addPlayer} className="mt-3 grid gap-2">
                <TextField
                  label="Новий гравець"
                  value={newPlayerName}
                  onChange={(event) => setNewPlayerName(event.target.value)}
                  placeholder={newPlayerNamePlaceholder}
                />
                <Button type="submit" variant="secondary">
                  <Plus size={18} />
                  Додати гравця
                </Button>
              </form>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
