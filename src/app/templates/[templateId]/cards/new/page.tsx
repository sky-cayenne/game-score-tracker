"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useParams, notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SignedNumberField } from "@/components/ui/SignedNumberField";
import { TextField } from "@/components/ui/TextField";
import { createCard as createCardRecord, parseInteger } from "@/lib/repositories/templatesRepository";
import { useAppData } from "@/lib/storage/useAppData";

export default function NewTemplateCardPage() {
  const params = useParams<{ templateId: string }>();
  const router = useRouter();
  const { data, ready, setData } = useAppData();
  const [pointsValue, setPointsValue] = useState("");
  const template = data.templates.find((item) => item.id === params.templateId);

  if (ready && !template) {
    notFound();
  }

  if (!template) {
    return <p className="text-sm text-ink/60">Завантаження...</p>;
  }

  function addCard(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const suitOrColor = String(formData.get("suitOrColor") ?? "").trim();
    const points = parseInteger(pointsValue);

    if (!name || points === null || !template) {
      return;
    }

    setData(
      createCardRecord(data, template.id, {
        name,
        points,
        suitOrColor
      })
    );
    router.push(`/templates/${template.id}/cards`);
  }

  return (
    <div className="space-y-5">
      <Link href={`/templates/${template.id}/cards`} className="inline-flex items-center gap-2 text-sm font-bold text-felt">
        <ArrowLeft size={18} />
        До колоди
      </Link>

      <SectionTitle title="Додати карту" subtitle={`Колода шаблону ${template.name}.`} />

      <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
        <form action={addCard} className="grid gap-3">
          <TextField label="Назва карти" name="name" placeholder="6, Валет, Туз" required />
          <div className="grid grid-cols-2 gap-3">
            <SignedNumberField label="Очки" name="points" value={pointsValue} onChange={setPointsValue} placeholder="Число" required />
            <TextField label="Колір/масть" name="suitOrColor" placeholder="Червоний, Чирви" />
          </div>
          <Button type="submit">
            <Plus size={18} />
            Додати карту
          </Button>
        </form>
      </section>
    </div>
  );
}
