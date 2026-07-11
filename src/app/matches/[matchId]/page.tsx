"use client";

import Link from "next/link";
import { useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, RotateCcw, Trash2, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  createRematch,
  finishMatch as finishMatchRecord,
  getMatchRounds,
  restartMatch as restartMatchRecord,
} from "@/lib/repositories/matchesRepository";
import { deleteLastRound } from "@/lib/repositories/roundsRepository";
import { calculateLeader, calculateMatchTotals, getScoreLimitState, isMatchFinished } from "@/lib/scoring/calculateTotals";
import { useAppData } from "@/lib/storage/useAppData";

type DialogState = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "finish";
  onConfirm: () => void;
};

export default function MatchDetailsPage() {
  const params = useParams<{ matchId: string }>();
  const router = useRouter();
  const { data, ready, setData } = useAppData();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const match = data.matches.find((item) => item.id === params.matchId);
  const template = match ? data.templates.find((item) => item.id === match.templateId) : null;
  const rounds = getMatchRounds(data, params.matchId);

  if (ready && !match) {
    notFound();
  }

  if (!match) {
    return <p className="text-sm text-ink/60">Завантаження...</p>;
  }

  const activeMatch = match;
  const isReadOnly = activeMatch.status !== "active";
  const activeTemplate = template;

  if (!activeTemplate && !isReadOnly) {
    return (
      <div className="space-y-4">
        <Link href="/matches" className="inline-flex items-center gap-2 text-sm font-black text-felt">
          <ArrowLeft size={18} />
          До партій
        </Link>
        <p className="rounded-md border border-dashed border-ink/20 bg-white p-4 text-sm font-bold text-ink/60">
          Шаблон цієї активної партії не знайдено.
        </p>
      </div>
    );
  }

  const templateName = activeTemplate?.name ?? activeMatch.templateNameSnapshot;
  const totals = calculateMatchTotals(activeMatch, rounds);
  const leader = calculateLeader(totals);
  const scoreLimitState = activeTemplate
    ? getScoreLimitState(
        activeMatch,
        rounds,
        activeTemplate.rules.winningScoreLimit,
        activeTemplate.rules.scoreLimitMode
      )
    : null;
  const finishedByRules = activeTemplate
    ? isMatchFinished(
        activeMatch,
        rounds,
        activeTemplate.rules.roundLimit,
        activeTemplate.rules.winningScoreLimit,
        activeTemplate.rules.scoreLimitMode
      )
    : false;

  function finishMatch(saveToLogs: boolean) {
    setDialog({
      title: saveToLogs ? "Зберегти партію в історію?" : "Закрити без історії?",
      description: saveToLogs
        ? "Партія стане доступною у вкладці Історія з фінальним рахунком і раундами."
        : "Партію буде закрито без запису в історію.",
      confirmLabel: saveToLogs ? "Зберегти" : "Закрити",
      variant: saveToLogs ? "finish" : "danger",
      onConfirm: () => {
        setData(finishMatchRecord(data, activeMatch.id, saveToLogs));
        setDialog(null);
        if (!saveToLogs) {
          router.push("/matches");
        }
      }
    });
  }

  function playAgain() {
    const result = createRematch(data, activeMatch.id);
    if (!result.matchId) {
      setDialog({
        title: "Не вдалося створити партію",
        description: "Перевір, чи шаблон гри ще існує.",
        confirmLabel: "Зрозуміло",
        cancelLabel: "",
        variant: "secondary",
        onConfirm: () => setDialog(null)
      });
      return;
    }

    setData(result.data);
    router.push(`/matches/${result.matchId}`);
  }

  function restartMatch() {
    setDialog({
      title: "Очистити раунди?",
      description: "Усі раунди цієї партії буде видалено, а рахунок стане нульовим.",
      confirmLabel: "Очистити",
      variant: "danger",
      onConfirm: () => {
        setData(restartMatchRecord(data, activeMatch.id));
        setDialog(null);
      }
    });
  }

  function removeLastRound() {
    setDialog({
      title: "Видалити останній раунд?",
      description: "Рахунок партії буде перераховано без цього раунду.",
      confirmLabel: "Видалити",
      variant: "danger",
      onConfirm: () => {
        setData(deleteLastRound(data, activeMatch.id));
        setDialog(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link href={isReadOnly ? "/logs" : "/matches"} className="inline-flex items-center gap-2 text-sm font-black text-felt">
          <ArrowLeft size={18} />
          {isReadOnly ? "До історії" : "До партій"}
        </Link>
        {!isReadOnly ? (
          <Link href={`/matches/${activeMatch.id}/edit`} aria-label="Редагувати партію">
            <Button type="button" variant="secondary" className="px-3">
              <Pencil size={17} />
            </Button>
          </Link>
        ) : null}
      </div>

      <section className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-start justify-between gap-3">
          <SectionTitle title={activeMatch.name} subtitle={`${templateName} · ${rounds.length} раундів зіграно`} />
          <span className="rounded-md bg-mist px-2 py-1 text-xs font-bold text-felt">{statusLabel(activeMatch.status)}</span>
        </div>
        {leader ? (
          <p className="mb-3 rounded-md bg-gold/10 px-3 py-2 text-sm font-bold text-gold">
            Лідер: {leader.name} · {leader.total}
          </p>
        ) : null}
        <div className="grid gap-2">
          {totals.map((player) => (
            <div key={player.playerId} className="flex items-center justify-between rounded-md bg-mist px-3 py-2">
              <span className="font-bold text-ink">{player.name}</span>
              <span className="text-lg font-black text-felt">{player.total}</span>
            </div>
          ))}
        </div>
      </section>

      {!isReadOnly && !finishedByRules ? (
        <Link href={`/matches/${activeMatch.id}/rounds/new`} className="block">
          <Button className="w-full">
            <Plus size={18} />
            Додати раунд
          </Button>
        </Link>
      ) : null}

      {finishedByRules || isReadOnly ? (
        <section className="rounded-md border border-gold/30 bg-gold/10 p-4">
          <SectionTitle
            title={isReadOnly ? "Партію збережено" : "Гру можна завершити"}
            subtitle={
              isReadOnly
                ? "Можна одразу почати нову партію з тим самим шаблоном і гравцями."
                : "Досягнуто ліміт раундів або очок за правилами шаблону."
            }
          />
          {isReadOnly ? (
            <div className="grid gap-2">
              <Button type="button" onClick={playAgain}>
                <Plus size={18} />
                Зіграти ще раз з цими гравцями
              </Button>
              <Link href="/logs" className="block">
                <Button type="button" variant="secondary" className="w-full">
                  До історії
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {scoreLimitState ? <ScoreLimitNotice state={scoreLimitState} /> : null}
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="secondary" onClick={restartMatch}>
                  <RotateCcw size={18} />
                  Очистити
                </Button>
                <Button type="button" variant="finish" onClick={() => finishMatch(true)}>
                  <Trophy size={18} />
                  В історію
                </Button>
              </div>
              <Link href={`/matches/${activeMatch.id}/rounds/new`} className="mt-2 block">
                <Button type="button" variant="secondary" className="w-full">
                  <Plus size={18} />
                  Продовжити ще раунд
                </Button>
              </Link>
              <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => finishMatch(false)}>
                <XCircle size={18} />
                Закрити без історії
              </Button>
            </>
          )}
        </section>
      ) : (
        <section className="grid gap-3 rounded-md border border-felt/20 bg-felt/8 p-3 shadow-[0_12px_34px_rgba(35,128,92,0.08)]">
          <p className="text-sm font-bold text-ink/68">Коли всі раунди зіграно, заверши партію і перенеси її в історію.</p>
          <div className="grid gap-2">
            <Button type="button" variant="finish" onClick={() => finishMatch(true)}>
              <Trophy size={18} />
              Завершити партію
            </Button>
            <Button type="button" variant="secondary" onClick={restartMatch} disabled={rounds.length === 0}>
              <RotateCcw size={18} />
              Очистити раунди
            </Button>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-start justify-between gap-3">
          <SectionTitle title="Раунди" />
          {!isReadOnly && rounds.length > 0 ? (
            <Button type="button" variant="danger" className="px-3" onClick={removeLastRound}>
              <Trash2 size={16} />
              Останній
            </Button>
          ) : null}
        </div>
        <div className="grid gap-2">
          {rounds
            .slice()
            .reverse()
            .map((round) => (
              <Link
                key={round.id}
                href={isReadOnly ? `/matches/${activeMatch.id}` : `/matches/${activeMatch.id}/rounds/${round.id}`}
                className="rounded-md border border-ink/10 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-bold text-ink">Раунд {round.roundNumber}</p>
                  <span className="text-sm font-bold text-felt">x{round.multiplier}</span>
                </div>
                {round.scores.map((score) => {
                  const player = activeMatch.players.find((item) => item.id === score.playerId);
                  return (
                    <div key={score.playerId} className="flex justify-between text-sm text-ink/70">
                      <span>{player?.nameSnapshot}</span>
                      <span>{score.total}</span>
                    </div>
                  );
                })}
              </Link>
            ))}
          {rounds.length === 0 ? <p className="text-sm text-ink/55">Ще немає раундів.</p> : null}
        </div>
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

type ScoreLimitNoticeProps = {
  state: NonNullable<ReturnType<typeof getScoreLimitState>>;
};

function ScoreLimitNotice({ state }: ScoreLimitNoticeProps) {
  const reachedNames = state.reached.map((player) => `${player.name} (${player.total})`).join(", ");
  const isSingle = state.reached.length === 1;

  if (state.mode === "lose") {
    return (
      <div className="mb-3 rounded-md border border-berry/20 bg-berry/10 p-3 text-sm text-ink">
        <p className="font-black text-berry">Ліміт {state.scoreLimit} очок досягнуто</p>
        <p className="mt-1 font-bold">
          {reachedNames} {isSingle ? "досяг ліміту і за правилами програє або вибуває." : "досягли ліміту і за правилами програють або вибувають."}
        </p>
        {state.singleRemainingWinner ? (
          <p className="mt-1 text-ink/68">Нижче ліміту залишився {state.singleRemainingWinner.name}. Можна завершити партію або продовжити, якщо ваші правила цього потребують.</p>
        ) : (
          <p className="mt-1 text-ink/68">Можна завершити партію зараз або продовжити, якщо гра триває до вибування кількох гравців.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-md border border-felt/20 bg-felt/10 p-3 text-sm text-ink">
      <p className="font-black text-felt">Ліміт {state.scoreLimit} очок досягнуто</p>
      <p className="mt-1 font-bold">
        {reachedNames} {isSingle ? "досяг переможного ліміту." : "досягли переможного ліміту."}
      </p>
      <p className="mt-1 text-ink/68">Можна завершити партію зараз або продовжити ще раунд.</p>
    </div>
  );
}

function statusLabel(status: "active" | "finished" | "archived") {
  if (status === "active") {
    return "активна";
  }

  if (status === "archived") {
    return "в історії";
  }

  return "закрита";
}
