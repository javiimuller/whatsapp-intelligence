import Link from "next/link";
import { FileText, Presentation } from "lucide-react";
import { getDemoUserId } from "@/lib/demoUser";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const userId = await getDemoUserId();

  const brands = await prisma.brand.findMany({
    where: { userId },
    include: {
      manualAnalyses: {
        orderBy: { createdAt: "desc" }
      },
      conversations: true,
      monthlyReports: {
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const totalReports = brands.reduce((sum, brand) => sum + Math.max(1, brand.manualAnalyses.length + brand.monthlyReports.length), 0);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-neon">Reportes</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Reportes por marca</h1>
          <p className="mt-2 text-white/55">Accede a reportes ejecutivos, presentaciones HTML y descargas PPTX por cada marca.</p>
        </div>
        <p className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/60">{totalReports} disponibles</p>
      </div>

      <div className="grid gap-5">
        {brands.map((brand) => {
          const reportRows = brand.manualAnalyses.length
            ? brand.manualAnalyses.map((analysis) => ({
                id: analysis.id,
                title: analysis.name,
                period: analysis.period,
                createdAt: analysis.createdAt
              }))
            : [{
                id: "demo",
                title: "Reporte acumulado",
                period: "Datos acumulados",
                createdAt: brand.createdAt
              }];

          return (
            <section key={brand.id} className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-semibold text-white">{brand.name}</h2>
                  <p className="mt-1 text-sm text-white/50">{brand.conversations.length} conversaciones analizadas</p>
                </div>
                <Link href={`/app/brands/${brand.id}/presentation`} className="inline-flex items-center gap-2 rounded-lg neon-pill px-3 py-2 text-sm font-semibold">
                  <Presentation size={16} /> Ver presentación
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
                {reportRows.map((report) => (
                  <article key={report.id} className="rounded-xl border border-white/10 bg-[#101513] p-4">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <p className="flex items-center gap-2 text-lg font-semibold text-white">
                          <FileText size={18} className="text-neon" /> {report.title}
                        </p>
                        <p className="mt-1 text-sm text-white/50">{report.period} · creado {report.createdAt.toLocaleDateString("es-CO")}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/app/brands/${brand.id}/reports/${report.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white">
                          Ver reporte
                        </Link>
                        <Link href={`/app/brands/${brand.id}/presentation`} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white">
                          Ver presentación
                        </Link>
                        <Link href={`/api/brands/${brand.id}/presentation`} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white">
                          Descargar PPTX
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        {brands.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] p-8 text-white/55">Crea una marca para generar reportes.</div>
        ) : null}
      </div>
    </div>
  );
}
