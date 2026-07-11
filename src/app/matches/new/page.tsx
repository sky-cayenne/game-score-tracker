"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { TextField } from "@/components/ui/TextField";
import { createMatch } from "@/lib/repositories/matchesRepository";
import { useAppData } from "@/lib/storage/useAppData";
import { matchNameSuggestions, playerNameSuggestions, randomSuggestion } from "@/lib/suggestions";

export default function NewMatchPage() {
  const router = useRouter();
  const { data, setData } = useAppData();
  const [matchName, setMatchName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  useEffect(() => {
    setMatchName((current) => current || randomSuggestion(matchNameSuggestions));
    setPlayerName((current) => current || randomSuggestion(playerNameSuggestions));
  }, []);

  function addPlayer() {
    const normalizedName = playerName.trim();
    if (!normalizedName) {
      setValidationMessages(["Введи ім’я гравця перед додаванням."]);
      return;
    }

    setPlayerNames((current) => [...current, normalizedName]);
    setPlayerName(randomSuggestion(playerNameSuggestions));
    setValidationMessages([]);
  }

  function removeDraftPlayer(index: number) {
    setPlayerNames((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messages = getValidationMessages();

    if (messages.length > 0) {
      setValidationMessages(messages);
      return;
    }

    const result = createMatch(data, {
      name: matchName,
      templateId,
      playerNames
    });

    if (!result.matchId) {
      setValidationMessages(["Не вдалося створити партію. Перевір шаблон і гравців."]);
      return;
    }

    setData(result.data);
    router.push(`/matches/${result.matchId}`);
  }

  function getValidationMessages() {
    const messages: string[] = [];

    if (!matchName.trim()) {
      messages.push("Введи назву партії.");
    }

    if (!templateId) {
      messages.push("Обери шаблон гри.");
    }

    if (playerNames.length < 2) {
      messages.push(`Додай ще ${2 - playerNames.length} ${playerNames.length === 1 ? "гравця" : "гравців"} до мінімуму.`);
    }

    return messages;
  }

  return (
    <div className="space-y-5">
      <Link href="/matches" className="inline-flex items-center gap-2 text-sm font-black text-felt">
        <ArrowLeft size={18} />
        До партій
      </Link>

      <SectionTitle title="Нова партія" subtitle="Обери шаблон і збери список гравців перед стартом." />
      <form onSubmit={submit} noValidate className="grid gap-4 rounded-md border border-ink/10 bg-white p-4 shadow-soft">
        <TextField
          label="Назва партії"
          name="name"
          value={matchName}
          onChange={(event) => {
            setMatchName(event.target.value);
            setValidationMessages([]);
          }}
          className={validationMessages.some((message) => message.includes("назву")) ? "border-berry/50 ring-4 ring-berry/10" : ""}
        />

        <label htmlFor="templateId" className="grid gap-1.5 text-sm font-semibold text-ink">
          <span>Шаблон гри</span>
          <select
            id="templateId"
            name="templateId"
            value={templateId}
            onChange={(event) => {
              setTemplateId(event.target.value);
              setValidationMessages([]);
            }}
            className={`tap-target rounded-md border bg-white px-3 text-base outline-none focus:border-felt focus:ring-2 focus:ring-felt/15 ${
              validationMessages.some((message) => message.includes("шаблон")) ? "border-berry/50 ring-4 ring-berry/10" : "border-ink/12"
            }`}
          >
            <option value="">Обери шаблон</option>
            {data.templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2">
          <TextField
            label="Ім’я гравця"
            value={playerName}
            onChange={(event) => {
              setPlayerName(event.target.value);
              setValidationMessages([]);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addPlayer();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addPlayer}>
            <Plus size={18} />
            Додати гравця
          </Button>
        </div>

        <div className="grid gap-2">
          {playerNames.map((name, index) => (
            <div key={`${name}-${index}`} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md bg-mist px-3 py-2">
              <span className="font-bold text-ink">{name}</span>
              <Button
                type="button"
                variant="secondary"
                className="px-3"
                aria-label={`Видалити ${name}`}
                onClick={() => removeDraftPlayer(index)}
              >
                <Trash2 size={17} />
              </Button>
            </div>
          ))}
          {playerNames.length === 0 ? (
            <p className="rounded-md border border-dashed border-ink/20 p-3 text-sm text-ink/55">
              Список гравців ще порожній.
            </p>
          ) : null}
        </div>

        {validationMessages.length > 0 ? (
          <div className="rounded-md border border-berry/20 bg-berry/10 p-3 text-sm">
            <div className="flex items-center gap-2 font-black text-berry">
              <AlertCircle size={17} />
              Що ще потрібно
            </div>
            <ul className="mt-2 grid gap-1 text-left font-bold text-ink/72">
              {validationMessages.map((message) => (
                <li key={message}>• {message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button type="submit">
          <Plus size={18} />
          Створити партію
        </Button>
      </form>
    </div>
  );
}
