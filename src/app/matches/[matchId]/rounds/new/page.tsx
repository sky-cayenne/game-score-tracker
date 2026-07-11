"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { RoundEditor } from "@/components/rounds/RoundEditor";
import { getRoundsForMatch } from "@/lib/repositories/roundsRepository";
import { useAppData } from "@/lib/storage/useAppData";

export default function NewRoundPage() {
  const params = useParams<{ matchId: string }>();
  const router = useRouter();
  const { data, ready } = useAppData();
  const match = data.matches.find((item) => item.id === params.matchId);
  const template = match ? data.templates.find((item) => item.id === match.templateId) : null;
  const rounds = getRoundsForMatch(data, params.matchId);

  if (ready && !match) {
    notFound();
  }

  if (!match || !template) {
    return <p className="text-sm text-ink/60">Завантаження...</p>;
  }

  if (match.status !== "active") {
    router.push(`/matches/${match.id}`);
    return null;
  }

  return <RoundEditor match={match} template={template} roundNumber={rounds.length + 1} />;
}
