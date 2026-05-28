import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { getDemoUserId } from "@/lib/demoUser";
import { prisma } from "@/lib/prisma";

export default async function DiagnosticsPage() {
  const userId = await getDemoUserId();

  const brands = await prisma.brand.findMany({
    where: { userId },
    include: {
      manualAnalyses: {
        include: { uploadedFiles: true, seller: true, conversations: true },
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const totalDiagnostics = brands.reduce((sum, brand) => sum + brand.manualAnalyses.length, 0);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-neon">Diagnósticos</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Historial de diagnósticos</h1>
          <p className="mt-2 text-white/55">Todos los análisis manuales creados, organizados por marca.</p>
        </div>
        <p className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/60">{totalDiagnostics} diagnósticos</p>
      </div>

      <div className="grid gap-5">
        {brands.map((brand) => (
          <section key={brand.id} className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-semibold text-white">{brand.name}</h2>
                <p className="mt-1 text-sm text-white/50">{brand.industry} · {brand.country}</p>
              </div>
              <Link href={`/app/brands/${brand.id}/manual-analysis/new`} className="inline-flex items-center gap-2 rounded-lg neon-pill px-3 py-2 text-sm font-semibold">
                <UploadCloud size={16} /> Nuevo diagnóstico
              </Link>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
              {brand.manualAnalyses.length ? (
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-neon/10 text-xs uppercase text-white/50">
                    <tr>
                      <th className="px-4 py-3">Diagnóstico</th>
                      <th className="px-4 py-3">Periodo</th>
                      <th className="px-4 py-3">Vendedora</th>
                      <th className="px-4 py-3">Archivos</th>
                      <th className="px-4 py-3">Conversaciones</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brand.manualAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-medium text-white">{analysis.name}</td>
                        <td className="px-4 py-3 text-white/60">{analysis.period}</td>
                        <td className="px-4 py-3 text-white/60">{analysis.seller?.name ?? "Todas"}</td>
                        <td className="px-4 py-3 text-white/60">{analysis.uploadedFiles.length}</td>
                        <td className="px-4 py-3 text-white/60">{analysis.conversations.length}</td>
                        <td className="px-4 py-3 text-white/60">{analysis.status}</td>
                        <td className="px-4 py-3">
                          <Link href={`/app/brands/${brand.id}/dashboard?analysisId=${analysis.id}`} className="text-neon hover:underline">
                            Ver dashboard
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-white/55">Esta marca aún no tiene diagnósticos.</div>
              )}
            </div>
          </section>
        ))}
        {brands.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] p-8 text-white/55">Crea una marca para iniciar diagnósticos.</div>
        ) : null}
      </div>
    </div>
  );
}
