import { getDemoUserId } from "@/lib/demoUser";
import { prisma } from "@/lib/prisma";

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default async function AnalyticsPage() {
  const userId = await getDemoUserId();

  const brands = await prisma.brand.findMany({
    where: { userId },
    include: {
      conversations: { include: { analyses: true } },
      manualAnalyses: true,
      commercialAlerts: true
    }
  });

  const conversations = brands.flatMap((brand) => brand.conversations);
  const analyses = conversations.flatMap((conversation) => conversation.analyses);
  const avgScore = average(analyses.map((item) => item.sellerQualityScore));
  const highIntent = conversations.filter((item) => item.purchaseIntent === "alta").length;
  const followUp = conversations.filter((item) => item.status === "requiere_seguimiento").length;
  const lost = conversations.filter((item) => item.lostOpportunity).length;
  const recoverable = conversations.filter((item) => item.recoverable).length;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase text-neon">Analítica</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Rendimiento comercial global</h1>
        <p className="mt-2 text-white/55">Consolidado de todas las marcas y diagnósticos creados.</p>
      </div>

      <section className="dashboard-grid">
        {[
          ["Conversaciones", conversations.length],
          ["Alta intención", highIntent],
          ["Requieren seguimiento", followUp],
          ["Perdidas", lost],
          ["Recuperables", recoverable],
          ["Score promedio", avgScore === null ? "Sin datos" : `${avgScore}/100`]
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs font-semibold uppercase text-white/45">{label}</p>
            <p className="mt-4 text-3xl font-semibold text-white">{String(value)}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
        <h2 className="text-xl font-semibold text-white">Lectura rápida</h2>
        <p className="mt-3 max-w-4xl leading-7 text-white/60">
          Esta sección consolida el desempeño de tus marcas. A medida que subas más diagnósticos o conectes WhatsApp API, aquí podrás comparar intención,
          seguimiento, oportunidades perdidas y calidad de atención entre marcas.
        </p>
      </section>
    </div>
  );
}
