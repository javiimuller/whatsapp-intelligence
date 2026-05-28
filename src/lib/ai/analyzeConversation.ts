import OpenAI from "openai";
import { removeSensitiveText } from "@/lib/privacy";

export type AnalysisSource = "manual_upload" | "whatsapp_api";

export type ConversationAnalysisResult = {
  conversation_id: string;
  source: "manual_upload_or_whatsapp_api" | AnalysisSource;
  customer_anonymous_id: string;
  seller_name: string | null;
  status:
    | "nuevo_lead"
    | "en_atencion"
    | "esperando_cliente"
    | "requiere_seguimiento"
    | "alta_intencion"
    | "objecion_pendiente"
    | "en_riesgo"
    | "posible_venta_perdida"
    | "venta_cerrada"
    | "finalizada"
    | "no_clasificada";
  purchase_intent: "alta" | "media" | "baja" | "sin_intencion_clara";
  commercial_stage: string;
  main_objection:
    | "precio"
    | "envio"
    | "tallas"
    | "disponibilidad"
    | "tiempo_entrega"
    | "metodos_pago"
    | "calidad"
    | "cambios_devoluciones"
    | "confianza"
    | "falta_informacion_producto"
    | "ninguna";
  secondary_objections: string[];
  products_mentioned: string[];
  sizes_mentioned: string[];
  colors_mentioned: string[];
  first_response_time_minutes: number | null;
  last_customer_message_at: string | null;
  last_seller_message_at: string | null;
  follow_up_detected: boolean;
  closing_attempt_detected: boolean;
  lost_opportunity: boolean;
  recoverable: boolean;
  risk_level: "alto" | "medio" | "bajo";
  seller_quality_score: number;
  summary: string;
  recommended_action: string;
  loss_reasons?: string[];
};

const allowedStatuses = [
  "nuevo_lead",
  "en_atencion",
  "esperando_cliente",
  "requiere_seguimiento",
  "alta_intencion",
  "objecion_pendiente",
  "en_riesgo",
  "posible_venta_perdida",
  "venta_cerrada",
  "finalizada",
  "no_clasificada"
] as const;

const allowedIntents = ["alta", "media", "baja", "sin_intencion_clara"] as const;

const allowedObjections = [
  "precio",
  "envio",
  "tallas",
  "disponibilidad",
  "tiempo_entrega",
  "metodos_pago",
  "calidad",
  "cambios_devoluciones",
  "confianza",
  "falta_informacion_producto",
  "ninguna"
] as const;

const mockResults: ConversationAnalysisResult[] = [
  {
    conversation_id: "mock-1",
    source: "manual_upload",
    customer_anonymous_id: "Cliente #001",
    seller_name: "Vendedora A",
    status: "requiere_seguimiento",
    purchase_intent: "alta",
    commercial_stage: "objecion_pendiente",
    main_objection: "precio",
    secondary_objections: ["envio"],
    products_mentioned: ["vestido negro"],
    sizes_mentioned: ["M"],
    colors_mentioned: ["negro"],
    first_response_time_minutes: 12,
    last_customer_message_at: new Date().toISOString(),
    last_seller_message_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    follow_up_detected: false,
    closing_attempt_detected: false,
    lost_opportunity: true,
    recoverable: true,
    risk_level: "alto",
    seller_quality_score: 72,
    summary:
      "La clienta pregunto por precio y disponibilidad. Mostro intencion alta, pero no se detecto cierre ni seguimiento.",
    recommended_action:
      "Enviar seguimiento con disponibilidad, beneficio principal y pregunta de cierre.",
    loss_reasons: ["falta_de_seguimiento", "no_hay_cierre"]
  },
  {
    conversation_id: "mock-2",
    source: "manual_upload",
    customer_anonymous_id: "Cliente #014",
    seller_name: "Vendedora B",
    status: "esperando_cliente",
    purchase_intent: "media",
    commercial_stage: "cotizacion_enviada",
    main_objection: "disponibilidad",
    secondary_objections: ["tallas"],
    products_mentioned: ["set deportivo"],
    sizes_mentioned: ["S", "M"],
    colors_mentioned: ["verde"],
    first_response_time_minutes: 7,
    last_customer_message_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    last_seller_message_at: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    follow_up_detected: true,
    closing_attempt_detected: true,
    lost_opportunity: false,
    recoverable: true,
    risk_level: "medio",
    seller_quality_score: 84,
    summary:
      "Hubo respuesta rapida y alternativa de producto, pero la conversacion quedo esperando confirmacion.",
    recommended_action:
      "Enviar recordatorio breve con una alternativa disponible y tiempo limite de reserva.",
    loss_reasons: []
  }
];

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pickAllowed<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function normalizeRisk(value: unknown): "alto" | "medio" | "bajo" {
  if (value === "alto" || value === "medio" || value === "bajo") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower.includes("alto")) return "alto";
    if (lower.includes("bajo")) return "bajo";
  }
  return "medio";
}

function isOnlyExtractionStub(text: string) {
  return text.includes("Conectar OCR real") || text.includes("Conectar extracción") || text.includes("Conectar parser");
}

function normalizeAnalysis(
  raw: unknown,
  input: {
    conversationId: string;
    source: AnalysisSource;
    customerAnonymousId: string;
    sellerName?: string | null;
  }
): ConversationAnalysisResult {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const status = pickAllowed(data.status, allowedStatuses, "no_clasificada");
  const intentSource = data.purchase_intent ?? data.intention ?? data.intent;
  const objectionSource = data.main_objection ?? data.objection;
  const recommendedSource = data.recommended_action ?? data.recommendedAction;
  const scoreSource = data.seller_quality_score ?? data.sellerQualityScore ?? data.quality_score;

  return {
    conversation_id: typeof data.conversation_id === "string" ? data.conversation_id : input.conversationId,
    source: input.source,
    customer_anonymous_id: typeof data.customer_anonymous_id === "string" ? data.customer_anonymous_id : input.customerAnonymousId,
    seller_name: typeof data.seller_name === "string" ? data.seller_name : input.sellerName ?? null,
    status,
    purchase_intent: pickAllowed(intentSource, allowedIntents, "sin_intencion_clara"),
    commercial_stage: typeof data.commercial_stage === "string" ? data.commercial_stage : status,
    main_objection: pickAllowed(objectionSource, allowedObjections, "ninguna"),
    secondary_objections: asStringArray(data.secondary_objections),
    products_mentioned: asStringArray(data.products_mentioned ?? data.products),
    sizes_mentioned: asStringArray(data.sizes_mentioned ?? data.sizes),
    colors_mentioned: asStringArray(data.colors_mentioned ?? data.colors),
    first_response_time_minutes: asNullableNumber(data.first_response_time_minutes ?? data.firstResponseTimeMinutes),
    last_customer_message_at: typeof data.last_customer_message_at === "string" ? data.last_customer_message_at : null,
    last_seller_message_at: typeof data.last_seller_message_at === "string" ? data.last_seller_message_at : null,
    follow_up_detected: typeof data.follow_up_detected === "boolean" ? data.follow_up_detected : Boolean(data.followUpDetected),
    closing_attempt_detected: typeof data.closing_attempt_detected === "boolean" ? data.closing_attempt_detected : Boolean(data.closingAttemptDetected),
    lost_opportunity: typeof data.lost_opportunity === "boolean" ? data.lost_opportunity : false,
    recoverable: typeof data.recoverable === "boolean" ? data.recoverable : false,
    risk_level: normalizeRisk(data.risk_level ?? data.risk),
    seller_quality_score: Math.max(0, Math.min(100, Math.round(asNumber(scoreSource, 0)))),
    summary: typeof data.summary === "string" ? data.summary : "No se pudo generar un resumen confiable con la informacion disponible.",
    recommended_action: typeof recommendedSource === "string" ? recommendedSource : "Cargar texto exportado de WhatsApp o conectar OCR para analizar esta conversacion.",
    loss_reasons: asStringArray(data.loss_reasons)
  };
}

export async function analyzeConversation(input: {
  conversationId: string;
  source: AnalysisSource;
  customerAnonymousId: string;
  sellerName?: string | null;
  text: string;
}): Promise<ConversationAnalysisResult> {
  if (!process.env.OPENAI_API_KEY || isOnlyExtractionStub(input.text)) {
    const index = Math.abs(input.conversationId.length + input.text.length) % mockResults.length;
    const fallback = {
      ...mockResults[index],
      conversation_id: input.conversationId,
      source: input.source,
      customer_anonymous_id: input.customerAnonymousId,
      seller_name: input.sellerName ?? mockResults[index].seller_name
    };

    if (isOnlyExtractionStub(input.text)) {
      return {
        ...fallback,
        status: "no_clasificada",
        purchase_intent: "sin_intencion_clara",
        commercial_stage: "ocr_pendiente",
        main_objection: "ninguna",
        secondary_objections: [],
        products_mentioned: [],
        sizes_mentioned: [],
        colors_mentioned: [],
        first_response_time_minutes: null,
        follow_up_detected: false,
        closing_attempt_detected: false,
        lost_opportunity: false,
        recoverable: false,
        risk_level: "bajo",
        seller_quality_score: 0,
        summary: "El archivo fue recibido, pero todavia no hay OCR real para leer el contenido de la imagen o PDF escaneado.",
        recommended_action: "Subir una exportacion TXT/CSV de WhatsApp o conectar OCR para analizar capturas e imagenes."
      };
    }

    return fallback;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const sanitizedText = removeSensitiveText(input.text).slice(0, 15000);
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Eres un analista comercial de WhatsApp. Devuelve solo JSON valido con snake_case exacto. No incluyas conversaciones completas ni datos sensibles."
      },
      {
        role: "user",
        content:
          `Analiza esta conversacion comercial anonimizada. Devuelve exactamente estas claves: conversation_id, source, customer_anonymous_id, seller_name, status, purchase_intent, commercial_stage, main_objection, secondary_objections, products_mentioned, sizes_mentioned, colors_mentioned, first_response_time_minutes, last_customer_message_at, last_seller_message_at, follow_up_detected, closing_attempt_detected, lost_opportunity, recoverable, risk_level, seller_quality_score, summary, recommended_action, loss_reasons. Usa purchase_intent solo como alta, media, baja o sin_intencion_clara. Usa risk_level solo como alto, medio o bajo. Usa seller_quality_score como numero 0-100. conversation_id=${input.conversationId}, source=${input.source}, customer=${input.customerAnonymousId}. Texto:\n${sanitizedText}`
      }
    ]
  });

  const raw = completion.choices[0]?.message.content ?? "{}";
  return normalizeAnalysis(JSON.parse(raw), input);
}
