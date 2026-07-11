"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyStateIllustration } from "@/components/ui/EmptyStateIllustration";
import { ScoreLimitModeField } from "@/components/ui/ScoreLimitModeField";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { TextField } from "@/components/ui/TextField";
import {
  canDeleteTemplate,
  createTemplate as createTemplateRecord,
  deleteTemplate as deleteTemplateRecord,
  duplicateTemplate,
  parsePositiveInteger,
  parseScoreLimitMode
} from "@/lib/repositories/templatesRepository";
import { useAppData } from "@/lib/storage/useAppData";
import { randomSuggestion, templateNameSuggestions } from "@/lib/suggestions";

type DialogState = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "finish";
  onConfirm: () => void;
};

export default function TemplatesPage() {
  const { data, ready, setData } = useAppData();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    setTemplateName((current) => current || randomSuggestion(templateNameSuggestions));
  }, []);

  function createTemplate(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      return;
    }

    setData(
      createTemplateRecord(data, {
        name,
        roundLimit: parsePositiveInteger(formData.get("roundLimit")),
        winningScoreLimit: parsePositiveInteger(formData.get("winningScoreLimit")),
        scoreLimitMode: parseScoreLimitMode(formData.get("scoreLimitMode")),
        allowedRoundMultipliers: [1, 2, 3, 4]
      })
    );
    setTemplateName(randomSuggestion(templateNameSuggestions));
  }

  function handleDuplicate(templateId: string) {
    setData(duplicateTemplate(data, templateId));
  }

  function handleDelete(templateId: string, templateName: string) {
    if (!canDeleteTemplate(data, templateId)) {
      setDialog({
        title: "Шаблон використовується",
        description: "Цей шаблон є в активній партії. Заверши або закрий партію перед видаленням.",
        confirmLabel: "Зрозуміло",
        cancelLabel: "",
        variant: "secondary",
        onConfirm: () => setDialog(null)
      });
      return;
    }

    setDialog({
      title: "Видалити шаблон?",
      description: `Шаблон "${templateName}" буде видалено з цього пристрою.`,
      confirmLabel: "Видалити",
      variant: "danger",
      onConfirm: () => {
        setData(deleteTemplateRecord(data, templateId));
        setDialog(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="flex items-start justify-between gap-3">
        <SectionTitle title="Шаблони ігор" subtitle="Створи гру один раз, потім використовуй її для нових партій." />
        <Link href="/templates/new">
          <Button className="px-3" aria-label="Новий шаблон">
            <Plus size={20} />
          </Button>
        </Link>
      </section>

      <section>
        {!ready ? <p className="text-sm text-ink/60">Завантаження...</p> : null}
        <div className="grid gap-3">
          {data.templates.map((template) => {
            const activeMatchesCount = data.matches.filter(
              (match) => match.templateId === template.id && match.status === "active"
            ).length;
            const isLocked = activeMatchesCount > 0;

            return (
              <article key={template.id} className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
                <Link href={`/templates/${template.id}`} className="block transition active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-ink">{template.name}</h3>
                      <p className="mt-1 text-sm text-ink/55">
                        {template.cards.length} карт · {template.rules.roundLimit ?? "без ліміту"} раундів
                      </p>
                    </div>
                    <span className="rounded-md bg-mist px-2 py-1 text-xs font-bold text-felt">
                      {template.rules.winningScoreLimit ?? "без"} оч. · {scoreLimitModeShortLabel(template.rules.scoreLimitMode)}
                    </span>
                  </div>
                  {isLocked ? (
                    <p className="mt-3 rounded-md bg-gold/10 px-3 py-2 text-xs font-bold text-gold">
                      Використовується в активних партіях: {activeMatchesCount}
                    </p>
                  ) : null}
                </Link>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" onClick={() => handleDuplicate(template.id)}>
                    <Copy size={16} />
                    Дублювати
                  </Button>
                  <Button
                    type="button"
                    variant={isLocked ? "secondary" : "danger"}
                    onClick={() => handleDelete(template.id, template.name)}
                  >
                    <Trash2 size={16} />
                    Видалити
                  </Button>
                </div>
              </article>
            );
          })}
          {ready && data.templates.length === 0 ? (
            <div className="rounded-md border border-dashed border-ink/20 p-5 text-center">
              <EmptyStateIllustration variant="templates" />
              <p className="text-sm text-ink/55">Шаблонів ще немає. Створи перший нижче або через кнопку плюс.</p>
            </div>
          ) : null}
        </div>
      </section>

      {ready && data.templates.length < 3 ? (
        <section className="rounded-md border border-ink/10 bg-mist p-4">
          <SectionTitle title="Новий шаблон" />
          <form action={createTemplate} className="grid gap-3">
            <TextField
              label="Назва гри"
              name="name"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="К-сть раундів" name="roundLimit" inputMode="numeric" type="number" min="1" placeholder="без ліміту" />
              <TextField
                label="Ліміт очок"
                name="winningScoreLimit"
                inputMode="numeric"
                type="number"
                min="1"
                placeholder="без ліміту"
              />
            </div>
            <ScoreLimitModeField forceVisible />
            <Button type="submit">
              <Plus size={18} />
              Створити
            </Button>
          </form>
        </section>
      ) : null}

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title ?? ""}
        description={dialog?.description}
        confirmLabel={dialog?.confirmLabel ?? ""}
        cancelLabel={dialog?.cancelLabel}
        variant={dialog?.variant}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}

function scoreLimitModeShortLabel(mode: "win" | "lose" | undefined) {
  return mode === "lose" ? "програш" : "перемога";
}
