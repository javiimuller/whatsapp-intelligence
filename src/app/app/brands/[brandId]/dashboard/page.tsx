import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { OpportunityTable } from "@/components/dashboard/OpportunityTable";
import { prisma } from "@/lib/prisma";
import { parseAnalysis, average, mostCommon } from "@/lib/utils";



export default async function DashboardPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const brand = await prisma.brand.findUniqueOrThrow({
    where: { id: brandId },
    include: {
      whatsappConnection: true,
      manualAnalyses: { include: { uploadedFiles: true }, orderBy: { createdAt: "desc" }, take: 1 },
      conversations: { include: { analyses: true, seller: true }, orderBy: { lastActivityAt: "desc" }, take: 50 },
      commercialAlerts: { orderBy: { createdAt: "desc" }, take: 6 }
    }
  });

  const conversations = brand.conversations;
  const latestManual = brand.manualAnalyses[0];
  const uploadedFiles = latestManual?.uploadedFiles ?? [];
  const analyses = conversations.flatMap((item) => item.analyses);
  const parsedAnalyses = analyses.map((item) => parseAnalysis(item.rawJson));
  const isOpenAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const hasOnlyStubExtraction =
    uploadedFiles.length > 0 &&
    uploadedFiles.every((file) =>
      (file.extractedText ?? "").includes("Conectar OCR real") ||
      (file.extractedText ?? "").includes("Conectar extracción") ||
      (file.extractedText ?? "").includes("Conectar parser")
    );

  const totalChats = conversations.length;
  const chatsNew = conversations.filter((item) => item.status === "nuevo_lead").length;
  const chatsReplied = conversations.filter((item) => item.status === "en_atencion" || item.status === "esperando_cliente").length;
  const chatsWithoutResponse = conversations.filter((item) => item.status === "nuevo_lead" || item.status === "requiere_seguimiento").length;
  const activeConversations = conversations.filter((item) => !["finalizada", "venta_cerrada"].includes(item.status)).length;
  const highIntent = conversations.filter((item) => item.purchaseIntent === "alta").length;
  const mediumIntent = conversations.filter((item) => item.purchaseIntent === "media").length;
  const lowIntent = conversations.filter((item) => item.purchaseIntent === "baja").length;
  const followUpRequired = conversations.filter((item) => item.status === "requiere_seguimiento").length;
  const lost = conversations.filter((item) => item.lostOpportunity).length;
  const recoverable = conversations.filter((item) => item.recoverable).length;
  const avgFirstResponse = average(
    analyses
      .map((item) => item.firstResponseTimeMinutes)
      .filter((value): value is number => typeof value === "number")
  );
  const avgScore = average(
    analyses
      .map((item) => item.sellerQualityScore)
      .filter((value): value is number => typeof value === "number")
  );
  const products = parsedAnalyses.flatMap((item) => item.products_mentioned ?? []);
  const dataQuality = hasOnlyStubExtraction ? "OCR pendiente" : uploadedFiles.length ? "Procesada" : "Sin archivos";
  const confidence = hasOnlyStubExtraction || !isOpenAiConfigured ? "Baja" : "Alta";

  const metrics = [
    ["Total de chats", totalChats],
    ["Chats nuevos", chatsNew],
    ["Chats respondidos", chatsReplied],
    ["Chats sin respuesta", chatsWithoutResponse],
    ["Tiempo promedio primera respuesta", avgFirstResponse === null ? "Sin datos" : `${avgFirstResponse} min`],
    ["Conversaciones activas", activeConversations],
    ["Alta intención", highIntent],
    ["Intención media", mediumIntent],
    ["Intención baja", lowIntent],
    ["Requieren seguimiento", followUpRequired],
    ["Sin seguimiento", followUpRequired],
    ["Oportunidades perdidas", lost],
    ["Oportunidades recuperables", recoverable],
    ["Objeción principal", mostCommon(conversations.map((item) => item.mainObjection).filter((item) => item !== "ninguna"))],
    ["Producto más consultado", mostCommon(products)],
    ["Score promedio de atención", avgScore === null ? "Sin datos" : `${avgScore}/100`],
    ["Chats de hoy", conversations.filter((item) => item.createdAt.toDateString() === new Date().toDateString()).length],
    ["Última sincronización", brand.whatsappConnection?.lastSyncAt?.toLocaleDateString("es-CO") ?? "Sin sync"],
    ["Alertas activas", brand.commercialAlerts.length],
    ["Leads sin respuesta", chatsWithoutResponse],
    ["Estado de webhook", brand.whatsappConnection?.webhookStatus ?? "not_verified"],
    ["Periodo analizado", latestManual?.period ?? "Sin periodo"],
    ["Archivos procesados", uploadedFiles.length],
    ["Calidad de datos", dataQuality],
    ["Conversaciones detectadas", totalChats],
    ["Datos incompletos", hasOnlyStubExtraction ? "Sí" : "No"],
    ["Confianza del análisis", confidence]
  ];

  const rows = conversations.map((item, index) => {
    const analysis = parseAnalysis(item.analyses[0]?.rawJson);
    return {
      id: item.id,
      customer: item.customerAnonymousId,
      date: item.startedAt.toLocaleDateString("es-CO"),
      seller: item.seller?.name ?? `Vendedora ${String.fromCharCode(65 + (index % Math.max(brand.sellersCount, 1)))}`,
      status: item.status,
      intent: item.purchaseIntent,
      objection: item.mainObjection,
      product: analysis.products_mentioned?.[0] ?? "Sin datos",
      risk: item.riskLevel,
      action: item.recommendedAction ?? "Pendiente de análisis confiable.",
      lastActivity: item.lastActivityAt.toLocaleString("es-CO"),
      summary: item.summary ?? "Resumen comercial no disponible todavía.",
      reason: hasOnlyStubExtraction || !isOpenAiConfigured
        ? "Clasificación provisional: falta OCR real para leer la imagen y/o OPENAI_API_KEY para análisis real."
        : "Clasificada por intención, objeción y señales de seguimiento."
    };
  });

  return (
    <div className="grid gap-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold">{brand.name}: dashboard comercial</h1>
          <p className="mt-2 text-ink/60">Indicadores unificados de carga manual y WhatsApp API. Sin conversaciones completas por defecto.</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/app/brands/${brandId}/manual-analysis/new`} className="rounded-md border border-ink/15 bg-white px-4 py-3">Nuevo diagnóstico</Link>
          <Link href={`/app/brands/${brandId}/reports/demo`} className="rounded-md bg-ink px-4 py-3 text-white">Reporte mensual</Link>
        </div>
      </div>

      {(hasOnlyStubExtraction || !isOpenAiConfigured) && (
        <div className="flex gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm text-ink/75">
          <AlertTriangle className="mt-0.5 shrink-0 text-gold" size={18} />
          <p>
            Este diagnóstico es provisional. Subiste {uploadedFiles.length} archivo(s), pero las imágenes/PDF escaneados todavía no tienen OCR real
            {isOpenAiConfigured ? "." : " y no hay OPENAI_API_KEY configurada, así que la clasificación usa datos mock de desarrollo."}
          </p>
        </div>
      )}

      <section className="dashboard-grid">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
            <p className="text-xs font-medium uppercase text-ink/50">{label}</p>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      {conversations.length >= 2 && !hasOnlyStubExtraction ? (
        <DashboardCharts />
      ) : (
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold">Gráficas</h2>
          <p className="mt-2 text-ink/60">
            Las gráficas se activan cuando haya al menos dos conversaciones con texto extraído de forma confiable.
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">Tabla de oportunidades</h2>
        {rows.length ? (
          <OpportunityTable rows={rows} />
        ) : (
          <div className="rounded-lg border border-ink/10 bg-white p-5 text-ink/60 shadow-soft">
            Aún no hay oportunidades detectadas.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-semibold">Alertas comerciales</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {brand.commercialAlerts.length ? (
            brand.commercialAlerts.map((alert) => (
              <div key={alert.id} className="rounded-md border border-ink/10 bg-[#fbfdfb] p-4 text-sm text-ink/70">
                <p className="font-medium text-ink">{alert.title}</p>
                <p className="mt-1">{alert.description}</p>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-ink/10 bg-[#fbfdfb] p-4 text-sm text-ink/70">
              Sin alertas reales todavía.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
