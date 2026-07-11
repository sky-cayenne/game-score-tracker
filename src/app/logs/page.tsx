"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyStateIllustration } from "@/components/ui/EmptyStateIllustration";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { deleteMatch, getMatchRounds } from "@/lib/repositories/matchesRepository";
import { calculateLeader, calculateMatchTotals } from "@/lib/scoring/calculateTotals";
import { useAppData } from "@/lib/storage/useAppData";

type DialogState = {
  title: string;
  description?: string;
  confirmLabel: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "finish";
  onConfirm: () => void;
};

export default function LogsPage() {
  const { data, setData } = useAppData();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const archived = data.matches.filter((match) => match.status === "archived" || match.status === "finished");

  function removeHistoryItem(matchId: string, matchName: string) {
    setDialog({
      title: "Видалити з історії?",
      description: `Запис "${matchName}" буде видалено разом із раундами цієї партії.`,
      confirmLabel: "Видалити",
      variant: "danger",
      onConfirm: () => {
        setData(deleteMatch(data, matchId));
        setDialog(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Історія" subtitle="Завершені партії з фінальним рахунком." />
      {archived.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink/20 p-5 text-center">
          <EmptyStateIllustration variant="history" />
          <p className="text-sm text-ink/55">Завершені ігри ще не збережені.</p>
        </div>
      ) : (
        archived.map((match) => {
          const rounds = getMatchRounds(data, match.id);
          const totals = calculateMatchTotals(match, rounds);
          const leader = calculateLeader(totals);

          return (
            <article key={match.id} className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
              <Link href={`/matches/${match.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-ink">{match.name}</h3>
                    <p className="mt-1 text-sm text-ink/55">
                      {match.templateNameSnapshot} · {rounds.length} раундів
                    </p>
                  </div>
                  <span className="rounded-md bg-mist px-2 py-1 text-xs font-bold text-felt">
                    {match.endedAt ? new Date(match.endedAt).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" }) : "без дати"}
                  </span>
                </div>
                {leader ? (
                  <p className="mt-3 rounded-md bg-gold/10 px-3 py-2 text-sm font-bold text-gold">
                    Переможець: {leader.name} · {leader.total}
                  </p>
                ) : null}
                <div className="mt-3 grid gap-1">
                  {totals.map((player) => (
                    <div key={player.playerId} className="flex justify-between text-sm text-ink/65">
                      <span>{player.name}</span>
                      <span>{player.total}</span>
                    </div>
                  ))}
                </div>
              </Link>
              <Button type="button" variant="danger" className="mt-3 w-full" onClick={() => removeHistoryItem(match.id, match.name)}>
                <Trash2 size={16} />
                Видалити з історії
              </Button>
            </article>
          );
        })
      )}
      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title ?? ""}
        description={dialog?.description}
        confirmLabel={dialog?.confirmLabel ?? ""}
        variant={dialog?.variant}
        onConfirm={() => dialog?.onConfirm()}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
