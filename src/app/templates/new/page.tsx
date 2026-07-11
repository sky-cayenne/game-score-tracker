"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScoreLimitModeField } from "@/components/ui/ScoreLimitModeField";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { TextField } from "@/components/ui/TextField";
import { createTemplate as createTemplateRecord, parsePositiveInteger, parseScoreLimitMode } from "@/lib/repositories/templatesRepository";
import { useAppData } from "@/lib/storage/useAppData";
import { randomSuggestion, templateNameSuggestions } from "@/lib/suggestions";

export default function NewTemplatePage() {
  const router = useRouter();
  const { data, setData } = useAppData();
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    setTemplateName((current) => current || randomSuggestion(templateNameSuggestions));
  }, []);

  function createTemplate(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      return;
    }

    const result = createTemplateRecord(data, {
      name,
      roundLimit: parsePositiveInteger(formData.get("roundLimit")),
      winningScoreLimit: parsePositiveInteger(formData.get("winningScoreLimit")),
      scoreLimitMode: parseScoreLimitMode(formData.get("scoreLimitMode")),
      allowedRoundMultipliers: [1, 2, 3, 4]
    });

    const createdTemplate = result.templates[0];
    setData(result);
    router.push(createdTemplate ? `/templates/${createdTemplate.id}` : "/templates");
  }

  return (
    <div className="space-y-5">
      <Link href="/templates" className="inline-flex items-center gap-2 text-sm font-black text-felt">
        <ArrowLeft size={18} />
        До шаблонів
      </Link>

      <SectionTitle title="Новий шаблон" subtitle="Задай базові правила гри, а потім додай карти." />
      <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
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
            Створити шаблон
          </Button>
        </form>
      </section>
    </div>
  );
}
