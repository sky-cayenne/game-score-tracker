"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SignedNumberField } from "@/components/ui/SignedNumberField";
import { TextField } from "@/components/ui/TextField";
import type { CardTemplate } from "@/types/domain";

type CardEditorProps = {
  card: CardTemplate;
  index: number;
  totalCards: number;
  onSave: (formData: FormData) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
};

export function CardEditor({ card, index, totalCards, onSave, onDelete, onMove }: CardEditorProps) {
  const [pointsValue, setPointsValue] = useState(String(card.points));

  useEffect(() => {
    setPointsValue(String(card.points));
  }, [card.points]);

  return (
    <article className="rounded-md border border-ink/10 bg-white p-3 shadow-soft">
      <form action={onSave} className="grid gap-3">
        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
          <div className="grid gap-3">
            <TextField label="Назва" name="name" defaultValue={card.name} required />
            <div className="grid grid-cols-2 gap-3">
              <SignedNumberField label="Очки" name="points" value={pointsValue} onChange={setPointsValue} required />
              <TextField label="Колір/масть" name="suitOrColor" defaultValue={card.suitOrColor} />
            </div>
          </div>
          <div className="grid gap-2">
            <Button
              type="button"
              variant="secondary"
              className="px-3"
              aria-label={`Підняти ${card.name}`}
              disabled={index === 0}
              onClick={() => onMove("up")}
            >
              <ArrowUp size={17} />
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="px-3"
              aria-label={`Опустити ${card.name}`}
              disabled={index === totalCards - 1}
              onClick={() => onMove("down")}
            >
              <ArrowDown size={17} />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="submit" variant="secondary">
            <Save size={16} />
            Зберегти
          </Button>
          <Button type="button" variant="danger" onClick={onDelete}>
            <Trash2 size={16} />
            Видалити
          </Button>
        </div>
      </form>
    </article>
  );
}
