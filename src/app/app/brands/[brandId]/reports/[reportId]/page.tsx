import Link from "next/link";
import { Download, Presentation } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parseAnalysis, average, mostCommon } from "@/lib/utils";

type StoredAnalysis = {
  products_mentioned?: string[];
  secondary_objections?: string[];
  loss_reasons?: string[];
};


function percent(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function sentenceList(items: string[]) {
  if (!items.length) return "Sin datos suficientes";
  return items.slice(0, 4).join(", ");
}

export default async function ReportPage({ params }: { params: Promise<{ brandId: string; reportId: string }> }) {
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
      commercialAlerts: {
        orderBy: { createdAt: "desc" },
        take: 10
      },
      whatsappConnection: true
    }
  });

  const conversations = brand.conversations;
  const latestManual = brand.manualAnalyses[0];
  const uploadedFiles = latestManual?.uploadedFiles ?? [];
  const analyses = conversations.flatMap((conversation) => conversation.analyses);
  const parsedAnalyses = analyses.map((analysis) => parseAnalysis(analysis.rawJson));
  const totalChats = conversations.length;
  const highIntent = conversations.filter((item) => item.purchaseIntent === "alta").length;
  const mediumIntent = conversations.filter((item) => item.purchaseIntent === "media").length;
  const lowIntent = conversations.filter((item) => item.purchaseIntent === "baja").length;
  const withoutClearIntent = conversations.filter((item) => item.purchaseIntent === "sin_intencion_clara").length;
  const followUpRequired = conversations.filter((item) => item.status === "requiere_seguimiento").length;
  const lost = conversations.filter((item) => item.lostOpportunity).length;
  const recoverable = conversations.filter((item) => item.recoverable).length;
  const active = conversations.filter((item) => !["venta_cerrada", "finalizada"].includes(item.status)).length;
  const avgScore = average(analyses.map((item) => item.sellerQualityScore).filter((value): value is number => typeof value === "number"));
  const avgFirstResponse = average(
    analyses
      .map((item) => item.firstResponseTimeMinutes)
      .filter((value): value is number => typeof value === "number")
  );
  const objections = conversations
    .map((item) => item.mainObjection)
    .filter((item) => item && item !== "ninguna");
  const secondaryObjections = parsedAnalyses.flatMap((item) => item.secondary_objections ?? []);
  const products = parsedAnalyses.flatMap((item) => item.products_mentioned ?? []);
  const lossReasons = parsedAnalyses.flatMap((item) => item.loss_reasons ?? []);
  const topObjection = mostCommon([...objections, ...secondaryObjections]);
  const topProduct = mostCommon(products);
  const topLossReason = mostCommon(lossReasons);
  const sellerGroups = conversations.reduce<Record<string, { total: number; scoreValues: number[]; followUps: number; lost: number }>>(
    (acc, conversation) => {
      const seller = conversation.seller?.name ?? "Sin vendedora asignada";
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
  const sellerSummary = Object.entries(sellerGroups)
    .map(([seller, stats]) => {
      const score = average(stats.scoreValues);
      return `${seller}: ${stats.total} conversaciones, ${stats.followUps} requieren seguimiento, score ${score ?? "sin datos"}`;
    })
    .join(". ");

  const sourceSummary = [
    latestManual ? `Carga manual: ${latestManual.name} (${latestManual.period}) con ${uploadedFiles.length} archivo(s)` : "Sin diagnostico manual",
    brand.whatsappConnection ? `WhatsApp API: ${brand.whatsappConnection.status}, webhook ${brand.whatsappConnection.webhookStatus}` : "WhatsApp API no conectada"
  ].join(". ");

  const hasEnoughData = totalChats > 0;
  const sections = [
    [
      "Resumen ejecutivo",
      hasEnoughData
        ? `${brand.name} tiene ${totalChats} conversacion(es) analizadas en el periodo actual. ${highIntent} muestran alta intencion, ${followUpRequired} requieren seguimiento y ${lost} estan marcadas como oportunidad perdida.`
        : "Todavia no hay conversaciones analizadas para generar un diagnostico ejecutivo confiable."
    ],
    [
      "Indicadores principales",
      `${totalChats} chats, ${highIntent} alta intencion, ${mediumIntent} intencion media, ${lowIntent} baja intencion, ${withoutClearIntent} sin intencion clara, ${followUpRequired} requieren seguimiento, ${recoverable} recuperables, score promedio ${avgScore ?? "sin datos"}${avgScore === null ? "" : "/100"} y primera respuesta promedio ${avgFirstResponse === null ? "sin datos" : `${avgFirstResponse} min`}.`
    ],
    [
      "Fuentes y calidad de datos",
      `${sourceSummary}. Producto mas mencionado: ${topProduct}. Objecion principal: ${topObjection}.`
    ],
    [
      "Hallazgos comerciales",
      hasEnoughData
        ? `La distribucion de intencion es ${percent(highIntent, totalChats)} alta, ${percent(mediumIntent, totalChats)} media y ${percent(withoutClearIntent, totalChats)} sin claridad. La objecion mas repetida es ${topObjection}.`
        : "Sube una exportacion TXT/CSV o capturas legibles para detectar intencion, objeciones y productos."
    ],
    [
      "Diagnostico del embudo de WhatsApp",
      `${active} conversaciones siguen activas. ${followUpRequired} necesitan seguimiento y ${lost} pueden representar ventas perdidas. Motivo de perdida mas comun: ${topLossReason}.`
    ],
    [
      "Evaluacion por vendedora",
      sellerSummary || "Aun no hay suficientes conversaciones asociadas a vendedoras para evaluar desempeno individual."
    ],
    [
      "Objeciones frecuentes",
      sentenceList([...new Set([...objections, ...secondaryObjections])])
    ],
    [
      "Oportunidades perdidas",
      `${lost} oportunidades perdidas y ${recoverable} recuperables. Prioriza conversaciones con alta intencion, objecion ${topObjection} y estado requiere_seguimiento.`
    ],
    [
      "Alertas comerciales",
      brand.commercialAlerts.length
        ? brand.commercialAlerts.map((alert) => `${alert.title}: ${alert.description}`).join(" ")
        : "No hay alertas comerciales activas registradas para este periodo."
    ],
    [
      "Recomendaciones accionables",
      hasEnoughData
        ? `Trabajar seguimiento sobre ${followUpRequired} conversaciones, reforzar respuestas a objecion ${topObjection}, y preparar alternativas para ${topProduct}.`
        : "Crear un primer diagnostico con datos reales antes de tomar decisiones comerciales."
    ],
    [
      "Comparativo mensual",
      "Comparativo no disponible todavia. Se activara cuando existan reportes de dos o mas periodos para la marca."
    ],
    [
      "Conclusion estrategica",
      hasEnoughData
        ? `La prioridad actual es convertir informacion de WhatsApp en seguimiento accionable: ${followUpRequired} conversaciones necesitan accion comercial y ${recoverable} pueden recuperarse.`
        : "El sistema esta listo, pero falta volumen de datos para una conclusion estrategica real."
    ]
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Reporte mensual: {brand.name}</h1>
          <p className="mt-2 text-ink/60">Reporte ejecutivo generado con datos reales guardados para la marca.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/app/brands/${brandId}/presentation`}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 text-white"
          >
            <Presentation size={16} /> Ver presentación
          </Link>
          <Link
            href={`/api/brands/${brandId}/presentation`}
            className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-4 py-3 text-ink"
          >
            <Download size={16} /> Descargar PPTX
          </Link>
        </div>
      </div>
      <div className="grid gap-4">
        {sections.map(([title, text]) => (
          <section key={title} className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-3 leading-7 text-ink/70">{text}</p>
          </section>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink/50">La presentacion se genera con datos reales, graficas editables y notas con sugerencias de animacion.</p>
    </div>
  );
}
