"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { analyzeConversation } from "@/lib/ai/analyzeConversation";
import { getDemoUserId } from "@/lib/demoUser";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/services/tokenCrypto";
import { extractTextFromFile, saveUploadedFile } from "@/lib/storage/fileStorage";

async function requireUserId() {
  return getDemoUserId();
}


export async function createBrand(formData: FormData) {
  const userId = await requireUserId();
  const parsed = z
    .object({
      name: z.string().min(2),
      industry: z.string().min(2),
      country: z.string().min(2),
      currency: z.string().min(2),
      sellersCount: z.coerce.number().int().min(1),
      mainChannel: z.string().min(2),
      goal: z.string().min(5)
    })
    .parse(Object.fromEntries(formData));

  const brand = await prisma.brand.create({
    data: {
      ...parsed,
      userId,
      sellers: {
        create: Array.from({ length: parsed.sellersCount }, (_, index) => ({
          name: `Vendedora ${String.fromCharCode(65 + index)}`
        }))
      }
    }
  });
  redirect(`/app/brands/${brand.id}/setup`);
}

export async function deleteBrand(brandId: string) {
  const userId = await requireUserId();
  await prisma.brand.deleteMany({
    where: { id: brandId, userId }
  });
  redirect("/app/brands");
}

export async function saveWhatsappConnection(brandId: string, formData: FormData) {
  await requireUserId();
  const parsed = z
    .object({
      wabaId: z.string().min(2),
      phoneNumberId: z.string().min(2),
      accessToken: z.string().min(8),
      verifyToken: z.string().min(4)
    })
    .parse(Object.fromEntries(formData));

  await prisma.whatsappConnection.upsert({
    where: { brandId },
    update: {
      wabaId: parsed.wabaId,
      phoneNumberId: parsed.phoneNumberId,
      accessTokenEncrypted: encryptToken(parsed.accessToken),
      verifyToken: parsed.verifyToken,
      status: "configured"
    },
    create: {
      brandId,
      wabaId: parsed.wabaId,
      phoneNumberId: parsed.phoneNumberId,
      accessTokenEncrypted: encryptToken(parsed.accessToken),
      verifyToken: parsed.verifyToken,
      status: "configured"
    }
  });
  redirect(`/app/brands/${brandId}/whatsapp`);
}

export async function createManualAnalysis(brandId: string, formData: FormData) {
  await requireUserId();
  const name = String(formData.get("name") ?? "");
  const period = String(formData.get("period") ?? "");
  const sellerId = String(formData.get("sellerId") ?? "") || null;
  const notes = String(formData.get("notes") ?? "");
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);

  const analysis = await prisma.manualAnalysis.create({
    data: { brandId, name, period, sellerId, notes, status: "processing" }
  });

  const extractedTexts: string[] = [];
  for (const file of files) {
    const stored = await saveUploadedFile(file, analysis.id);
    const extractedText = await extractTextFromFile(file);
    extractedTexts.push(extractedText);
    await prisma.uploadedFile.create({
      data: {
        manualAnalysisId: analysis.id,
        ...stored,
        extractedText,
        status: "processed"
      }
    });
  }

  const conversation = await prisma.conversation.create({
    data: {
      brandId,
      manualAnalysisId: analysis.id,
      source: "manual_upload",
      customerAnonymousId: "Cliente #001",
      status: "no_clasificada",
      startedAt: new Date(),
      lastActivityAt: new Date()
    }
  });

  const result = await analyzeConversation({
    conversationId: conversation.id,
    source: "manual_upload",
    customerAnonymousId: conversation.customerAnonymousId,
    text: `${notes}\n${extractedTexts.join("\n\n")}`
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      status: result.status,
      purchaseIntent: result.purchase_intent,
      commercialStage: result.commercial_stage,
      mainObjection: result.main_objection,
      lostOpportunity: result.lost_opportunity,
      recoverable: result.recoverable,
      riskLevel: result.risk_level,
      summary: result.summary,
      recommendedAction: result.recommended_action
    }
  });

  await prisma.conversationAnalysis.create({
    data: {
      conversationId: conversation.id,
      rawJson: result as any,
      sellerQualityScore: result.seller_quality_score,
      followUpDetected: result.follow_up_detected,
      closingAttemptDetected: result.closing_attempt_detected,
      firstResponseTimeMinutes: result.first_response_time_minutes
    }
  });

  await prisma.commercialAlert.create({
    data: {
      brandId,
      conversationId: conversation.id,
      type: "cliente_alta_intencion_sin_respuesta",
      title: "Alta intención requiere seguimiento",
      description: result.recommended_action,
      severity: result.risk_level
    }
  });

  await prisma.manualAnalysis.update({
    where: { id: analysis.id },
    data: { status: "completed" }
  });

  redirect(`/app/brands/${brandId}/dashboard?analysisId=${analysis.id}`);
}
