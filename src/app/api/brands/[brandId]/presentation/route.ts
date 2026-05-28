import pptxgen from "pptxgenjs";
import { getDemoUserId } from "@/lib/demoUser";
import { prisma } from "@/lib/prisma";
import { parseAnalysis, average, countBy, mostCommon } from "@/lib/utils";

type StoredAnalysis = {
  products_mentioned?: string[];
  secondary_objections?: string[];
  loss_reasons?: string[];
};

type Section = {
  title: string;
  text: string;
};


function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function pct(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function addTitle(slide: pptxgen.Slide, title: string, subtitle?: string) {
  slide.addText(title, {
    x: 0.55,
    y: 0.35,
    w: 8.9,
    h: 0.5,
    fontFace: "Aptos Display",
    fontSize: 25,
    bold: true,
    color: "17211D",
    margin: 0
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.58,
      y: 0.9,
      w: 7.8,
      h: 0.32,
      fontFace: "Aptos",
      fontSize: 10,
      color: "62706A",
      margin: 0
    });
  }
}

function addFooter(slide: pptxgen.Slide, brandName: string, page: number) {
  slide.addText(`WhatsApp Sales Intelligence · ${brandName}`, {
    x: 0.55,
    y: 7.05,
    w: 5,
    h: 0.18,
    fontSize: 7,
    color: "7A8580",
    margin: 0
  });
  slide.addText(String(page).padStart(2, "0"), {
    x: 12.35,
    y: 7.05,
    w: 0.35,
    h: 0.18,
    fontSize: 7,
    color: "7A8580",
    align: "right",
    margin: 0
  });
}

function addKpi(slide: pptxgen.Slide, label: string, value: string, x: number, y: number, color = "17211D") {
  slide.addShape(pptxgen.ShapeType.roundRect, {
    x,
    y,
    w: 2.55,
    h: 1.15,
    rectRadius: 0.06,
    fill: { color: "FFFFFF" },
    line: { color: "DCE4DF", width: 0.8 }
  });
  slide.addText(label.toUpperCase(), {
    x: x + 0.18,
    y: y + 0.2,
    w: 2.1,
    h: 0.25,
    fontSize: 7.5,
    color: "6A7772",
    bold: true,
    margin: 0
  });
  slide.addText(value, {
    x: x + 0.18,
    y: y + 0.53,
    w: 2.12,
    h: 0.4,
    fontSize: 19,
    color,
    bold: true,
    margin: 0
  });
}

function addTextBlock(slide: pptxgen.Slide, section: Section, x: number, y: number, w: number, h: number) {
  slide.addShape(pptxgen.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.05,
    fill: { color: "FFFFFF" },
    line: { color: "DCE4DF", width: 0.7 }
  });
  slide.addText(section.title, {
    x: x + 0.25,
    y: y + 0.22,
    w: w - 0.5,
    h: 0.28,
    fontSize: 12,
    bold: true,
    color: "17211D",
    margin: 0
  });
  slide.addText(section.text, {
    x: x + 0.25,
    y: y + 0.64,
    w: w - 0.5,
    h: h - 0.8,
    fontSize: 9.5,
    color: "42504A",
    breakLine: false,
    fit: "shrink",
    valign: "middle",
    margin: 0.02
  });
}

export async function GET(_request: Request, context: { params: Promise<{ brandId: string }> }) {
  const userId = await getDemoUserId();

  const { brandId } = await context.params;
  const brand = await prisma.brand.findFirstOrThrow({
    where: { id: brandId, userId },
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

  const sellerRows = Object.entries(sellerGroups).map(([seller, stats]) => [
    seller,
    String(stats.total),
    String(stats.followUps),
    String(stats.lost),
    String(average(stats.scoreValues) ?? "sin datos")
  ]);

  const sections: Section[] = [
    {
      title: "Resumen ejecutivo",
      text: total
        ? `${brand.name} tiene ${total} conversacion(es) analizadas. ${highIntent} muestran alta intencion, ${followUp} requieren seguimiento y ${lost} estan marcadas como oportunidad perdida.`
        : "Todavia no hay conversaciones analizadas para generar una lectura ejecutiva confiable."
    },
    {
      title: "Diagnostico del embudo",
      text: `${active} conversaciones siguen activas. ${followUp} necesitan seguimiento y ${recoverable} pueden recuperarse. Motivo de perdida mas comun: ${topLossReason}.`
    },
    {
      title: "Recomendacion prioritaria",
      text: total
        ? `Atacar objecion ${topObjection}, preparar alternativas para ${topProduct}, y dar seguimiento a las conversaciones con intencion alta o riesgo comercial.`
        : "Cargar una exportacion TXT/CSV o capturas legibles para generar recomendaciones comerciales."
    }
  ];

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "WhatsApp Sales Intelligence";
  pptx.subject = `Reporte comercial de ${brand.name}`;
  pptx.title = `Reporte mensual ${brand.name}`;
  pptx.company = "WhatsApp Sales Intelligence";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos"
  };

  let page = 1;

  const cover = pptx.addSlide();
  cover.background = { color: "F7FAF7" };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: "F7FAF7" }, line: { color: "F7FAF7" } });
  cover.addText("WhatsApp Sales Intelligence", { x: 0.65, y: 0.5, w: 4.8, h: 0.25, fontSize: 10, bold: true, color: "6F8F80", margin: 0 });
  cover.addText(`Reporte ejecutivo\n${brand.name}`, {
    x: 0.65,
    y: 1.35,
    w: 7.4,
    h: 1.4,
    fontSize: 34,
    bold: true,
    color: "17211D",
    breakLine: false,
    margin: 0
  });
  cover.addText(latestManual ? `Periodo: ${latestManual.period}` : "Periodo: datos acumulados", {
    x: 0.68,
    y: 2.95,
    w: 5,
    h: 0.32,
    fontSize: 13,
    color: "42504A",
    margin: 0
  });
  addKpi(cover, "Conversaciones", String(total), 8.9, 1.2, "17211D");
  addKpi(cover, "Alta intencion", String(highIntent), 8.9, 2.55, "E56F51");
  addKpi(cover, "Recuperables", String(recoverable), 8.9, 3.9, "6F8F80");
  cover.addNotes("Animacion sugerida: aparecer titulo, luego KPIs uno por uno, cerrando con el periodo.");
  addFooter(cover, brand.name, page++);

  const summary = pptx.addSlide();
  summary.background = { color: "F7FAF7" };
  addTitle(summary, "Lectura ejecutiva", "Datos reales guardados en el sistema para la marca.");
  addTextBlock(summary, sections[0], 0.65, 1.35, 5.85, 2.0);
  addTextBlock(summary, sections[1], 6.85, 1.35, 5.85, 2.0);
  addTextBlock(summary, sections[2], 0.65, 3.75, 12.05, 1.75);
  summary.addText(`Fuente: ${latestManual ? `${uploadedFiles.length} archivo(s) cargados` : "sin carga manual"} · API: ${brand.whatsappConnection?.status ?? "no conectada"}`, {
    x: 0.68,
    y: 6.0,
    w: 10,
    h: 0.25,
    fontSize: 8,
    color: "6A7772",
    margin: 0
  });
  summary.addNotes("Animacion sugerida: revelar cada bloque narrativo de izquierda a derecha.");
  addFooter(summary, brand.name, page++);

  const kpis = pptx.addSlide();
  kpis.background = { color: "F7FAF7" };
  addTitle(kpis, "Indicadores principales", "Resumen cuantitativo del proceso comercial por WhatsApp.");
  [
    ["Total chats", String(total), "17211D"],
    ["Alta intencion", String(highIntent), "E56F51"],
    ["Sin claridad", String(unclearIntent), "D8A847"],
    ["Seguimiento", String(followUp), "6F8F80"],
    ["Perdidas", String(lost), "E56F51"],
    ["Recuperables", String(recoverable), "6F8F80"],
    ["Score", avgScore === null ? "Sin datos" : `${avgScore}/100`, "17211D"],
    ["Primera respuesta", avgFirstResponse === null ? "Sin datos" : `${avgFirstResponse} min`, "17211D"]
  ].forEach(([label, value, color], index) => {
    const x = 0.65 + (index % 4) * 3.08;
    const y = 1.35 + Math.floor(index / 4) * 1.55;
    addKpi(kpis, label, value, x, y, color);
  });
  kpis.addNotes("Animacion sugerida: revelar los KPIs por fila, primero volumen y luego calidad.");
  addFooter(kpis, brand.name, page++);

  const intentSlide = pptx.addSlide();
  intentSlide.background = { color: "F7FAF7" };
  addTitle(intentSlide, "Intencion y estado comercial", "Donde se concentra la oportunidad de cierre.");
  intentSlide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: "Conversaciones",
        labels: ["Alta", "Media", "Baja", "Sin claridad"],
        values: [highIntent, mediumIntent, lowIntent, unclearIntent]
      }
    ],
    {
      x: 0.75,
      y: 1.35,
      w: 5.65,
      h: 4.4,
      catAxisLabelFontFace: "Aptos",
      catAxisLabelFontSize: 9,
      valAxisLabelFontSize: 8,
      showLegend: false,
      showTitle: false,
      showValue: true,
      valAxisMinVal: 0,
      chartColors: ["6F8F80"]
    }
  );
  intentSlide.addChart(
    pptx.ChartType.doughnut,
    [
      {
        name: "Estado",
        labels: ["Activas", "Seguimiento", "Perdidas", "Recuperables"],
        values: [active, followUp, lost, recoverable]
      }
    ],
    {
      x: 7.05,
      y: 1.35,
      w: 4.6,
      h: 4.4,
      showLegend: true,
      showTitle: false,
      holeSize: 55,
      chartColors: ["6F8F80", "D8A847", "E56F51", "88B7AA"]
    }
  );
  intentSlide.addText(`${pct(highIntent, total)} de las conversaciones tienen alta intencion. ${pct(followUp, total)} requieren seguimiento.`, {
    x: 0.8,
    y: 6.0,
    w: 10.6,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: "17211D",
    margin: 0
  });
  intentSlide.addNotes("Animacion sugerida: primero barra de intencion, despues dona de estado, al final insight inferior.");
  addFooter(intentSlide, brand.name, page++);

  const objectionsSlide = pptx.addSlide();
  objectionsSlide.background = { color: "F7FAF7" };
  addTitle(objectionsSlide, "Objeciones y productos", "Temas comerciales que aparecen en las conversaciones.");
  const objectionCounts = Object.entries(countBy([...objections, ...secondaryObjections])).slice(0, 6);
  const productCounts = Object.entries(countBy(products)).slice(0, 6);
  objectionsSlide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: "Objeciones",
        labels: objectionCounts.map(([label]) => label),
        values: objectionCounts.map(([, value]) => value)
      }
    ],
    {
      x: 0.75,
      y: 1.35,
      w: 5.5,
      h: 4.4,
      showLegend: false,
      showValue: true,
      chartColors: ["E56F51"]
    }
  );
  objectionsSlide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: "Productos",
        labels: productCounts.map(([label]) => label),
        values: productCounts.map(([, value]) => value)
      }
    ],
    {
      x: 6.9,
      y: 1.35,
      w: 5.5,
      h: 4.4,
      showLegend: false,
      showValue: true,
      chartColors: ["6F8F80"]
    }
  );
  objectionsSlide.addText(`Objecion principal: ${topObjection}. Producto mas mencionado: ${topProduct}.`, {
    x: 0.8,
    y: 6.0,
    w: 10,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: "17211D",
    margin: 0
  });
  objectionsSlide.addNotes("Animacion sugerida: revelar objeciones, luego productos, luego conclusion.");
  addFooter(objectionsSlide, brand.name, page++);

  const sellers = pptx.addSlide();
  sellers.background = { color: "F7FAF7" };
  addTitle(sellers, "Desempeno por vendedora", "Volumen, seguimiento, oportunidades perdidas y score.");
  const sellerTableRows = [["Vendedora", "Chats", "Seguimiento", "Perdidas", "Score"], ...sellerRows].map((row) =>
    row.map((text) => ({ text }))
  );
  sellers.addTable(sellerTableRows, {
    x: 0.75,
    y: 1.35,
    w: 11.8,
    h: 3.8,
    border: { color: "DCE4DF", type: "solid", pt: 0.7 },
    fill: { color: "FFFFFF" },
    color: "17211D",
    fontFace: "Aptos",
    fontSize: 10,
    margin: 0.08,
    valign: "middle"
  });
  sellers.addText(
    sellerRows.length
      ? "Usa esta vista para enfocar coaching comercial por volumen, seguimiento y calidad."
      : "Aun no hay conversaciones asociadas a vendedoras para evaluar desempeno individual.",
    { x: 0.8, y: 5.7, w: 10.8, h: 0.42, fontSize: 13, bold: true, color: "17211D", margin: 0 }
  );
  sellers.addNotes("Animacion sugerida: revelar tabla por filas y cerrar con la recomendacion.");
  addFooter(sellers, brand.name, page++);

  const recommendations = pptx.addSlide();
  recommendations.background = { color: "F7FAF7" };
  addTitle(recommendations, "Plan de accion recomendado", "Acciones comerciales inmediatas a partir del analisis.");
  [
    `Dar seguimiento a ${followUp} conversacion(es) con riesgo o intencion clara.`,
    `Preparar respuestas para objecion principal: ${topObjection}.`,
    `Crear alternativas comerciales para producto/tema mas mencionado: ${topProduct}.`,
    recoverable ? `Priorizar ${recoverable} oportunidad(es) recuperable(s).` : "Aumentar volumen de datos para detectar oportunidades recuperables."
  ].forEach((text, index) => {
    const y = 1.35 + index * 1.08;
    recommendations.addShape(pptx.ShapeType.roundRect, {
      x: 0.85,
      y,
      w: 11.3,
      h: 0.75,
      rectRadius: 0.05,
      fill: { color: index === 0 ? "D8EEE5" : "FFFFFF" },
      line: { color: "DCE4DF", width: 0.7 }
    });
    recommendations.addText(`${index + 1}`, { x: 1.05, y: y + 0.22, w: 0.25, h: 0.22, fontSize: 11, bold: true, color: "E56F51", margin: 0 });
    recommendations.addText(text, { x: 1.48, y: y + 0.2, w: 9.9, h: 0.28, fontSize: 12, color: "17211D", bold: index === 0, margin: 0 });
  });
  recommendations.addNotes("Animacion sugerida: revelar acciones una por una y terminar en la accion 1 como prioridad.");
  addFooter(recommendations, brand.name, page++);

  const buffer = await pptx.write({ outputType: "nodebuffer" });
  const fileName = `reporte-${safeFileName(brand.name)}.pptx`;
  return new Response(buffer as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${fileName}"`
    }
  });
}
