import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { DeleteBrandButton } from "@/components/brands/DeleteBrandButton";
import { getDemoUserId } from "@/lib/demoUser";
import { prisma } from "@/lib/prisma";

export default async function BrandsPage() {
  const userId = await getDemoUserId();

  const brands = await prisma.brand.findMany({
    where: { userId },
    include: {
      conversations: true,
      manualAnalyses: true,
      whatsappConnection: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-neon">Marcas</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Administrar marcas</h1>
          <p className="mt-2 text-white/55">Crea, revisa o elimina marcas que ya no siguen con el servicio.</p>
        </div>
        <Link href="/app/brands/new" className="inline-flex items-center justify-center gap-2 rounded-lg neon-pill px-4 py-3 font-semibold">
          <PlusCircle size={18} /> Nueva marca
        </Link>
      </div>

      <div className="grid gap-4">
        {brands.map((brand) => (
          <article key={brand.id} className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">{brand.name}</h2>
                <p className="mt-1 text-sm text-white/50">{brand.industry} · {brand.country} · {brand.currency}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
                  <span className="rounded-full bg-white/[0.06] px-3 py-1">{brand.conversations.length} conversaciones</span>
                  <span className="rounded-full bg-white/[0.06] px-3 py-1">{brand.manualAnalyses.length} diagnósticos</span>
                  <span className="rounded-full bg-white/[0.06] px-3 py-1">WhatsApp: {brand.whatsappConnection?.status ?? "no conectado"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/app/brands/${brand.id}/dashboard`} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white">Dashboard</Link>
                <Link href={`/app/brands/${brand.id}/setup`} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white">Setup</Link>
                <Link href={`/app/brands/${brand.id}/reports/demo`} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white">Reporte</Link>
                <DeleteBrandButton brandId={brand.id} brandName={brand.name} />
              </div>
            </div>
          </article>
        ))}
        {brands.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] p-8 text-white/55">
            Aún no tienes marcas creadas.
          </div>
        ) : null}
      </div>
    </div>
  );
}
