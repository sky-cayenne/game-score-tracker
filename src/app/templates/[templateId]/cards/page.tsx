"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { CardEditor } from "@/components/templates/CardEditor";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  deleteCard as deleteCardRecord,
  moveCard,
  parseInteger,
  updateCard as updateCardRecord
} from "@/lib/repositories/templatesRepository";
import { useAppData } from "@/lib/storage/useAppData";

export default function TemplateCardsPage() {
  const params = useParams<{ templateId: string }>();
  const { data, ready, setData } = useAppData();
  const template = data.templates.find((item) => item.id === params.templateId);

  if (ready && !template) {
    notFound();
  }

  if (!template) {
    return <p className="text-sm text-ink/60">Завантаження...</p>;
  }

  const orderedCards = template.cards.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  function updateCard(cardId: string, formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const suitOrColor = String(formData.get("suitOrColor") ?? "").trim();
    const points = parseInteger(formData.get("points"));

    if (!name || points === null || !template) {
      return;
    }

    setData(updateCardRecord(data, template.id, cardId, { name, points, suitOrColor }));
  }

  function deleteCard(cardId: string) {
    if (!template) {
      return;
    }

    setData(deleteCardRecord(data, template.id, cardId));
  }

  function reorderCard(cardId: string, direction: "up" | "down") {
    if (!template) {
      return;
    }

    setData(moveCard(data, template.id, cardId, direction));
  }

  return (
    <div className="space-y-5">
      <Link href={`/templates/${template.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-felt">
        <ArrowLeft size={18} />
        До шаблону
      </Link>

      <section className="flex items-start justify-between gap-3">
        <SectionTitle title="Колода карт" subtitle={`${template.name} · ${orderedCards.length} карт`} />
        <Link href={`/templates/${template.id}/cards/new`}>
          <Button type="button" className="px-3" aria-label="Додати карту">
            <Plus size={18} />
          </Button>
        </Link>
      </section>

      <Link href={`/templates/${template.id}/cards/new`} className="block">
        <Button type="button" className="w-full">
          <Plus size={18} />
          Створити нову карту
        </Button>
      </Link>

      <section>
        <SectionTitle title="Список карт" subtitle="Очки можуть бути додатніми, нульовими або від’ємними." />
        <div className="grid gap-2">
          {orderedCards.map((card, index) => (
            <CardEditor
              key={card.id}
              card={card}
              index={index}
              totalCards={orderedCards.length}
              onSave={(formData) => updateCard(card.id, formData)}
              onDelete={() => deleteCard(card.id)}
              onMove={(direction) => reorderCard(card.id, direction)}
            />
          ))}
          {orderedCards.length === 0 ? (
            <div className="rounded-md border border-dashed border-ink/20 p-4 text-center">
              <p className="text-sm font-bold text-ink/55">У цій колоді ще немає карт.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
