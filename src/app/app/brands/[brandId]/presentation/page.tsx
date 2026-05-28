import { HtmlPresentation } from "@/components/presentation/HtmlPresentation";
import { prisma } from "@/lib/prisma";
import { parseAnalysis, average, countBy, mostCommon } from "@/lib/utils";

type StoredAnalysis = {
  products_mentioned?: string[];
  secondary_objections?: string[];
  loss_reasons?: string[];
};


function chartData(values: string[], fallback: string) {
  const entries = Object.entries(countBy(values.length ? values : [fallback]))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return entries.map(([name, value]) => ({ name, value }));
}



export default async function PresentationPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const brand = await prisma.brand.findUniqueOrThrow({
    where: { id: brandId },
    include: {
      manualAnalyses: {
        include: { uploadedFiles: true },
        orderBy: { createdAt: "desc" },
        take: 1
      },
      conversations: {
        include: { analyses: true, seller: true },
        orderBy: { lastActivityAt: "desc" }
      },
      whatsappConnection: true
    }
  });

  const conversations = brand.conversations;
  const latestManual = brand.manualAnalyses[0];
  const uploadedFiles = latestManual?.uploadedFiles ?? [];
  const analyses = conversations.flatMap((conversation) => conversation.analyses);
  const parsedAnalyses = analyses.map((analysis) => parseAnalysis(analysis.rawJson));

  const total = conversations.length;
  const highIntent = conversations.filter((item) => item.purchaseIntent === "alta").length;
  const mediumIntent = conversations.filter((item) => item.purchaseIntent === "media").length;
  const lowIntent = conversations.filter((item) => item.purchaseIntent === "baja").length;
  const unclearIntent = conversations.filter((item) => item.purchaseIntent === "sin_intencion_clara").length;
  const followUp = conversations.filter((item) => item.status === "requiere_seguimiento").length;
  const lost = conversations.filter((item) => item.lostOpportunity).length;
  const recoverable = conversations.filter((item) => item.recoverable).length;
  const active = conversations.filter((item) => !["venta_cerrada", "finalizada"].includes(item.status)).length;
  const avgScore = average(analyses.map((item) => item.sellerQualityScore).filter((value): value is number => typeof value === "number"));
  const avgFirstResponse = average(
    analyses
      .map((item) => item.firstResponseTimeMinutes)
      .filter((value): value is number => typeof value === "number")
  );

  const objections = conversations.map((item) => item.mainObjection).filter((item) => item && item !== "ninguna");
  const secondaryObjections = parsedAnalyses.flatMap((item) => item.secondary_objections ?? []);
  const products = parsedAnalyses.flatMap((item) => item.products_mentioned ?? []);
  const lossReasons = parsedAnalyses.flatMap((item) => item.loss_reasons ?? []);
  const topObjection = mostCommon([...objections, ...secondaryObjections]);
  const topProduct = mostCommon(products);
  const topLossReason = mostCommon(lossReasons);

  const sellerGroups = conversations.reduce<Record<string, { total: number; scoreValues: number[]; followUps: number; lost: number }>>(
    (acc, conversation) => {
      const seller = conversation.seller?.name ?? "Sin vendedora";
      acc[seller] ??= { total: 0, scoreValues: [], followUps: 0, lost: 0 };
      acc[seller].total += 1;
      if (conversation.status === "requiere_seguimiento") acc[seller].followUps += 1;
      if (conversation.lostOpportunity) acc[seller].lost += 1;
      const score = conversation.analyses[0]?.sellerQualityScore;
      if (typeof score === "number") acc[seller].scoreValues.push(score);
      return acc;
    },
    {}
  );

  const sellerRows = Object.entries(sellerGroups).map(([seller, stats]) => ({
    seller,
    total: stats.total,
    followUps: stats.followUps,
    lost: stats.lost,
    score: String(average(stats.scoreValues) ?? "sin datos")
  }));

  return (
    <HtmlPresentation
      data={{
        brandId,
        brandName: brand.name,
        period: latestManual ? `Periodo: ${latestManual.period}` : "Periodo: datos acumulados",
        sourceSummary: [
          latestManual ? `Carga manual con ${uploadedFiles.length} archivo(s)` : "Sin carga manual",
          brand.whatsappConnection ? `WhatsApp API ${brand.whatsappConnection.status}` : "WhatsApp API no conectada"
        ].join(" · "),
        summary: total
          ? `${brand.name} tiene ${total} conversación(es) analizadas. ${highIntent} muestran alta intención, ${followUp} requieren seguimiento y ${lost} están marcadas como oportunidad perdida.`
          : "Todavía no hay conversaciones analizadas para generar una lectura ejecutiva confiable.",
        funnelDiagnosis: `${active} conversaciones siguen activas. ${followUp} necesitan seguimiento y ${recoverable} pueden recuperarse. Motivo de pérdida más común: ${topLossReason}.`,
        recommendation: total
          ? `Atacar objeción ${topObjection}, preparar alternativas para ${topProduct}, y dar seguimiento a conversaciones con intención alta o riesgo comercial.`
          : "Cargar una exportación TXT/CSV o capturas legibles para generar recomendaciones comerciales.",
        kpis: [
          { label: "Total chats", value: String(total) },
          { label: "Alta intención", value: String(highIntent) },
          { label: "Seguimiento", value: String(followUp) },
          { label: "Perdidas", value: String(lost) },
          { label: "Recuperables", value: String(recoverable) },
          { label: "Score", value: avgScore === null ? "Sin datos" : `${avgScore}/100` },
          { label: "Primera respuesta", value: avgFirstResponse === null ? "Sin datos" : `${avgFirstResponse} min` },
          { label: "Archivos", value: String(uploadedFiles.length) }
        ],
        intentData: [
          { name: "Alta", value: highIntent },
          { name: "Media", value: mediumIntent },
          { name: "Baja", value: lowIntent },
          { name: "Sin claridad", value: unclearIntent }
        ],
        statusData: [
          { name: "Activas", value: active },
          { name: "Seguimiento", value: followUp },
          { name: "Perdidas", value: lost },
          { name: "Recuperables", value: recoverable }
        ],
        objectionData: chartData([...objections, ...secondaryObjections], "Sin objeción"),
        productData: chartData(products, "Sin producto"),
        sellerRows
      }}
    />
  );
}
