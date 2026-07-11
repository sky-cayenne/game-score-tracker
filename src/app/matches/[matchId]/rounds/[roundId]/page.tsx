"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { RoundEditor } from "@/components/rounds/RoundEditor";
import { useAppData } from "@/lib/storage/useAppData";

export default function EditRoundPage() {
  const params = useParams<{ matchId: string; roundId: string }>();
  const router = useRouter();
  const { data, ready } = useAppData();
  const match = data.matches.find((item) => item.id === params.matchId);
  const template = match ? data.templates.find((item) => item.id === match.templateId) : null;
  const round = data.rounds.find((item) => item.id === params.roundId && item.matchId === params.matchId);

  if (ready && (!match || !round)) {
    notFound();
  }

  if (!match || !template || !round) {
    return <p className="text-sm text-ink/60">Завантаження...</p>;
  }

  if (match.status !== "active") {
    router.push(`/matches/${match.id}`);
    return null;
  }

  return <RoundEditor match={match} template={template} round={round} roundNumber={round.roundNumber} />;
}
