"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Layers3, Save } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { TextField } from "@/components/ui/TextField";
import {
  parsePositiveInteger,
  parseScoreLimitMode,
  updateTemplate as updateTemplateRecord
} from "@/lib/repositories/templatesRepository";
import { useAppData } from "@/lib/storage/useAppData";
import type { GameTemplate } from "@/types/domain";

export default function TemplateDetailsPage() {
  const params = useParams<{ templateId: string }>();
  const { data, ready, setData } = useAppData();
  const template = data.templates.find((item) => item.id === params.templateId);

  if (ready && !template) {
    notFound();
  }

  if (!template) {
    return <p className="text-sm text-ink/60">Завантаження...</p>;
  }

  const activeTemplate = template;

  return (
    <div className="space-y-5">
      <Link href="/templates" className="inline-flex items-center gap-2 text-sm font-bold text-felt">
        <ArrowLeft size={18} />
        До шаблонів
      </Link>

      <section>
        <SectionTitle
          title={activeTemplate.name}
          subtitle={`Раундів: ${activeTemplate.rules.roundLimit ?? "без ліміту"} · Ліміт очок: ${
            activeTemplate.rules.winningScoreLimit ?? "без ліміту"
          } · ${scoreLimitModeLabel(activeTemplate.rules.scoreLimitMode)}`}
        />
      </section>

      <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
        <TemplateRulesForm
          template={activeTemplate}
          onSave={(input) => setData(updateTemplateRecord(data, activeTemplate.id, input))}
        />
      </section>

      <Link href={`/templates/${activeTemplate.id}/cards`} className="block">
        <Button type="button" className="w-full">
          <Layers3 size={18} />
          Колода карт
        </Button>
      </Link>
    </div>
  );
}

function scoreLimitModeLabel(mode: "win" | "lose" | undefined) {
  return mode === "lose" ? "ліміт = програш" : "ліміт = перемога";
}

type TemplateRulesFormProps = {
  template: GameTemplate;
  onSave: (input: Parameters<typeof updateTemplateRecord>[2]) => void;
};

function TemplateRulesForm({ template, onSave }: TemplateRulesFormProps) {
  const initialValues = useMemo(() => getTemplateShape(template), [template]);
  const [name, setName] = useState(initialValues.name);
  const [roundLimit, setRoundLimit] = useState(initialValues.roundLimit);
  const [winningScoreLimit, setWinningScoreLimit] = useState(initialValues.winningScoreLimit);
  const [scoreLimitMode, setScoreLimitMode] = useState(initialValues.scoreLimitMode);
  const [hint, setHint] = useState("");
  const hasScoreLimit = winningScoreLimit.trim().length > 0;

  useEffect(() => {
    setName(initialValues.name);
    setRoundLimit(initialValues.roundLimit);
    setWinningScoreLimit(initialValues.winningScoreLimit);
    setScoreLimitMode(initialValues.scoreLimitMode);
    setHint("");
  }, [initialValues]);

  const currentValues = {
    name: name.trim(),
    roundLimit: normalizeLimitValue(roundLimit),
    winningScoreLimit: normalizeLimitValue(winningScoreLimit),
    scoreLimitMode: hasScoreLimit ? scoreLimitMode : initialValues.scoreLimitMode
  };

  const isDirty =
    currentValues.name !== initialValues.name ||
    currentValues.roundLimit !== initialValues.roundLimit ||
    currentValues.winningScoreLimit !== initialValues.winningScoreLimit ||
    currentValues.scoreLimitMode !== initialValues.scoreLimitMode;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isDirty) {
      setHint("Усе вже збережено. Зміни назву або правила, і кнопка стане активною.");
      return;
    }

    if (!currentValues.name) {
      setHint("Назва шаблону не може бути порожньою.");
      return;
    }

    onSave({
      name: currentValues.name,
      rules: {
        roundLimit: parsePositiveInteger(currentValues.roundLimit),
        winningScoreLimit: parsePositiveInteger(currentValues.winningScoreLimit),
        scoreLimitMode: parseScoreLimitMode(hasScoreLimit ? currentValues.scoreLimitMode : initialValues.scoreLimitMode),
        allowedRoundMultipliers: template.rules.allowedRoundMultipliers
      }
    });
    setHint("Готово, правила шаблону оновлено.");
  }

  function handleFieldChange(update: () => void) {
    update();
    setHint("");
  }

  return (
    <>
      <SectionTitle title="Правила шаблону" subtitle="Ці правила застосовуються до нових партій із цим шаблоном." />
      <form onSubmit={submit} className="grid gap-3">
        <TextField
          label="Назва гри"
          name="name"
          value={name}
          onChange={(event) => handleFieldChange(() => setName(event.target.value))}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="К-сть раундів"
            name="roundLimit"
            inputMode="numeric"
            type="number"
            min="1"
            value={roundLimit}
            onChange={(event) => handleFieldChange(() => setRoundLimit(event.target.value))}
            placeholder="без ліміту"
          />
          <TextField
            label="Ліміт очок"
            name="winningScoreLimit"
            inputMode="numeric"
            type="number"
            min="1"
            value={winningScoreLimit}
            onChange={(event) => handleFieldChange(() => setWinningScoreLimit(event.target.value))}
            placeholder="без ліміту"
          />
        </div>
        {hasScoreLimit ? (
          <label htmlFor="scoreLimitMode" className="grid gap-1.5 text-sm font-bold text-ink">
            <span className="text-xs font-black uppercase tracking-[0.08em] text-ink/58">Ліміт очок означає</span>
            <select
              id="scoreLimitMode"
              name="scoreLimitMode"
              value={scoreLimitMode}
              onChange={(event) => handleFieldChange(() => setScoreLimitMode(parseScoreLimitMode(event.target.value)))}
              className="tap-target rounded-md border border-ink/12 bg-white px-3 text-base font-bold text-ink outline-none focus:border-felt focus:ring-4 focus:ring-felt/12"
            >
              <option value="win">перемогу</option>
              <option value="lose">програш / вибування</option>
            </select>
          </label>
        ) : null}
        <Button type="submit" variant={isDirty ? "primary" : "secondary"} aria-disabled={!isDirty}>
          <Save size={18} />
          Зберегти правила
        </Button>
        {hint ? (
          <p className={`rounded-md px-3 py-2 text-sm font-bold ${isDirty ? "bg-gold/10 text-gold" : "bg-mist text-ink/58"}`}>
            {hint}
          </p>
        ) : null}
      </form>
    </>
  );
}

function getTemplateShape(template: {
  name: string;
  rules: {
    roundLimit: number | null;
    winningScoreLimit: number | null;
    scoreLimitMode: "win" | "lose";
    allowedRoundMultipliers: number[];
  };
}) {
  return {
    name: template.name,
    roundLimit: template.rules.roundLimit === null ? "" : String(template.rules.roundLimit),
    winningScoreLimit: template.rules.winningScoreLimit === null ? "" : String(template.rules.winningScoreLimit),
    scoreLimitMode: template.rules.scoreLimitMode
  };
}

function normalizeLimitValue(value: string) {
  return value.trim();
}
