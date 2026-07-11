import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyStateIllustration } from "@/components/ui/EmptyStateIllustration";

export default function NotFoundPage() {
  return (
    <section className="rounded-md border border-dashed border-ink/20 bg-white p-5 text-center shadow-soft">
      <EmptyStateIllustration variant="notFound" />
      <p className="text-xs font-black uppercase tracking-[0.16em] text-felt">404</p>
      <h2 className="mt-2 text-xl font-black text-ink">Сторінку не знайдено</h2>
      <p className="mt-2 text-sm leading-5 text-ink/60">
        Схоже, ця партія, шаблон або адреса вже не існує. Повернися до активних партій і продовж гру звідти.
      </p>
      <Link href="/matches" className="mt-4 inline-flex">
        <Button>
          <ArrowLeft size={18} />
          До партій
        </Button>
      </Link>
    </section>
  );
}
