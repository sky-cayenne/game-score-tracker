"use client";

import { useRef, useState } from "react";
import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { clearData, createBackup, emptyData, parseBackup, resetToSeedData } from "@/lib/storage/localDb";
import { useAppData } from "@/lib/storage/useAppData";
import type { AppData } from "@/types/domain";

type DialogState = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "finish";
  onConfirm: () => void;
};

export default function SettingsPage() {
  const { data, setData } = useAppData();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  function resetSeed() {
    setDialog({
      title: "Скинути до стартових шаблонів?",
      description: "Поточні шаблони, партії та історія будуть замінені стартовими шаблонами Брідж і Uno Flip.",
      confirmLabel: "Скинути",
      variant: "danger",
      onConfirm: () => {
        setData(resetToSeedData());
        setDialog(null);
      }
    });
  }

  function clearAll() {
    setDialog({
      title: "Очистити всі дані?",
      description: "Локальні шаблони, партії, історія та гравці будуть видалені з цього пристрою.",
      confirmLabel: "Очистити",
      variant: "danger",
      onConfirm: () => {
        clearData();
        setData(emptyData);
        setDialog(null);
      }
    });
  }

  function exportData() {
    const payload = JSON.stringify(createBackup(data), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `card-scorekeeper-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File | null) {
    if (!file) {
      return;
    }

    const text = await file.text();
    const importResult = parseBackup(text);
    if (importInputRef.current) {
      importInputRef.current.value = "";
    }

    if (!importResult.ok) {
      setDialog({
        title: "Не вдалося імпортувати",
        description: `${importResult.error} Обери JSON, який був експортований з вкладки Дані.`,
        confirmLabel: "Зрозуміло",
        cancelLabel: "",
        variant: "secondary",
        onConfirm: () => setDialog(null)
      });
      return;
    }

    requestImport(importResult.data);
  }

  function requestImport(importedData: AppData) {
    setDialog({
      title: "Імпортувати резервну копію?",
      description: "Поточні локальні дані на цьому пристрої буде замінено даними з файлу.",
      confirmLabel: "Імпортувати",
      variant: "finish",
      onConfirm: () => {
        setData(importedData);
        setDialog(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="Дані" subtitle="Локальне сховище цього пристрою." />

      <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-mist p-3">
            <p className="text-xs font-bold uppercase text-ink/50">Шаблони</p>
            <p className="mt-1 text-2xl font-black text-felt">{data.templates.length}</p>
          </div>
          <div className="rounded-md bg-mist p-3">
            <p className="text-xs font-bold uppercase text-ink/50">Партії</p>
            <p className="mt-1 text-2xl font-black text-felt">{data.matches.length}</p>
          </div>
          <div className="rounded-md bg-mist p-3">
            <p className="text-xs font-bold uppercase text-ink/50">Раунди</p>
            <p className="mt-1 text-2xl font-black text-felt">{data.rounds.length}</p>
          </div>
          <div className="rounded-md bg-mist p-3">
            <p className="text-xs font-bold uppercase text-ink/50">Гравці</p>
            <p className="mt-1 text-2xl font-black text-felt">{data.players.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-md border border-ink/10 bg-white p-4 shadow-soft">
        <SectionTitle
          title="Резервна копія"
          subtitle="Експорт та імпорт шаблонів, партій, історії, раундів і гравців."
        />
        <Button type="button" variant="secondary" onClick={exportData}>
          <Download size={18} />
          Експортувати JSON
        </Button>
        <Button type="button" variant="secondary" onClick={() => importInputRef.current?.click()}>
          <Upload size={18} />
          Імпортувати JSON
        </Button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => void importData(event.target.files?.[0] ?? null)}
        />
      </section>

      <section className="grid gap-3 rounded-md border border-ink/10 bg-white p-4 shadow-soft">
        <SectionTitle title="Скидання" subtitle="Корисно після тестових партій на етапі MVP." />
        <Button type="button" variant="secondary" onClick={resetSeed}>
          <RotateCcw size={18} />
          Скинути до стартових шаблонів
        </Button>
        <Button type="button" variant="danger" onClick={clearAll}>
          <Trash2 size={18} />
          Очистити все
        </Button>
      </section>

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
