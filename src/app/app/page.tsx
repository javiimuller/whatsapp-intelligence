import Link from "next/link";
import { BarChart3, Building2, MessageSquareWarning, PlusCircle } from "lucide-react";
import { getDemoUserId } from "@/lib/demoUser";
import { prisma } from "@/lib/prisma";

export default async function AppHomePage() {
  const userId = await getDemoUserId();

  const brands = await prisma.brand.findMany({
    where: { userId },
    include: {
      conversations: true,
      commercialAlerts: true,
      manualAnalyses: true
    },
    orderBy: { createdAt: "desc" }
  });

  const totalConversations = brands.reduce((sum, brand) => sum + brand.conversations.length, 0);
  const highIntent = brands.reduce((sum, brand) => sum + brand.conversations.filter((item) => item.purchaseIntent === "alta").length, 0);
  const alerts = brands.reduce((sum, brand) => sum + brand.commercialAlerts.length, 0);
  const analyses = brands.reduce((sum, brand) => sum + brand.manualAnalyses.length, 0);

  return (
    <div className="grid gap-10 animate-fade-in">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-neon mb-2 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>Overview</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>Centro comercial de WhatsApp</h1>
          <p className="mt-3 max-w-2xl text-white/55 leading-relaxed animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>Vista general de marcas, diagnósticos, alertas y oportunidades comerciales.</p>
        </div>
        <Link href="/app/brands/new" className="inline-flex items-center justify-center gap-2 rounded-xl neon-pill px-5 py-3.5 font-semibold transition-transform hover:scale-105 shadow-glow animate-slide-up-fade" style={{ animationDelay: '0.4s' }}>
          <PlusCircle size={18} /> Crear marca
        </Link>
      </div>

      <section className="dashboard-grid animate-slide-up-fade" style={{ animationDelay: '0.5s' }}>
        {[
          { label: "Marcas", value: brands.length, Icon: Building2 },
          { label: "Diagnósticos", value: analyses, Icon: BarChart3 },
          { label: "Conversaciones", value: totalConversations, Icon: MessageSquareWarning },
          { label: "Alta intención", value: highIntent, Icon: BarChart3 },
          { label: "Alertas", value: alerts, Icon: MessageSquareWarning }
        ].map(({ label, value, Icon }, i) => (
          <div key={label} className="glass-card group flex flex-col justify-between rounded-2xl p-6 h-36" style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/45 transition-colors group-hover:text-white/60">{label}</p>
              <div className="rounded-full bg-white/[0.03] p-2 transition-colors group-hover:bg-neon/10">
                <Icon className="text-neon" size={18} />
              </div>
            </div>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-white">{String(value)}</p>
          </div>
        ))}
      </section>

      <section className="glass-card rounded-2xl p-6 sm:p-8 animate-slide-up-fade" style={{ animationDelay: '0.8s' }}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Marcas recientes</h2>
            <p className="mt-1.5 text-sm text-white/50">Entra al dashboard o administra tus marcas.</p>
          </div>
          <Link href="/app/brands" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white hover:border-white/20">
            Ver todas
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {brands.slice(0, 6).map((brand, i) => (
            <Link key={brand.id} href={`/app/brands/${brand.id}/dashboard`} className="group rounded-2xl border border-white/5 bg-[#0a0d0c]/50 p-6 transition-all hover:bg-[#0f1412] hover:border-neon/30 hover:shadow-glow-hover">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-neon transition-colors">{brand.name}</h3>
              </div>
              <p className="text-sm text-white/40 mb-6">{brand.industry} · {brand.country}</p>
              <div className="flex items-center text-sm font-semibold text-neon gap-2">
                <span>Ver dashboard</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
          {brands.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-white/50 col-span-full">
              Aún no tienes marcas. Crea una para iniciar el diagnóstico.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
