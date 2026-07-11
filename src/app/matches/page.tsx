"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyStateIllustration } from "@/components/ui/EmptyStateIllustration";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getMatchRounds } from "@/lib/repositories/matchesRepository";
import { calculateLeader, calculateMatchTotals } from "@/lib/scoring/calculateTotals";
import { useAppData } from "@/lib/storage/useAppData";
import type { Match } from "@/types/domain";

export default function MatchesPage() {
  const { data } = useAppData();
  const activeMatches = data.matches.filter((match) => match.status === "active");

  return (
    <div className="space-y-5">
      <section className="flex items-start justify-between gap-3">
        <SectionTitle title="Партії" subtitle="Тут тільки активні ігри. Завершені партії зберігаються в історії." />
        <Link href="/matches/new">
          <Button className="px-3" aria-label="Нова партія">
            <Plus size={20} />
          </Button>
        </Link>
      </section>

      <MatchSection matches={activeMatches} />
    </div>
  );

  function MatchSection({ matches }: { matches: Match[] }) {
    return (
      <section>
        <div className="grid gap-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
          {matches.length === 0 ? (
            <div className="rounded-md border border-dashed border-ink/20 p-5 text-center">
              <EmptyStateIllustration variant="matches" />
              <p className="text-base font-black text-ink">Почни з нової партії</p>
              <p className="mt-2 text-sm leading-5 text-ink/60">
                Створи партію, обери гру з шаблонів, додай мінімум двох гравців і після кожного раунду вводь очки.
              </p>
              {activeMatches.length === 0 ? (
                <Link href="/matches/new" className="mt-3 inline-flex">
                  <Button>
                    <Plus size={18} />
                    Створити партію
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  function MatchCard({ match }: { match: Match }) {
    const rounds = getMatchRounds(data, match.id);
    const totals = calculateMatchTotals(match, rounds);
    const leader = calculateLeader(totals);

    return (
      <Link href={`/matches/${match.id}`} className="rounded-md border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">{match.name}</h3>
            <p className="mt-1 text-sm text-ink/55">
              {match.templateNameSnapshot} · {match.players.length} гравців · {rounds.length} раундів
            </p>
          </div>
          <span className="rounded-md bg-mist px-2 py-1 text-xs font-bold text-felt">активна</span>
        </div>
        {leader ? (
          <p className="mt-3 rounded-md bg-mist px-3 py-2 text-sm font-bold text-ink">
            Лідер: {leader.name} · {leader.total}
          </p>
        ) : null}
      </Link>
    );
  }
}
