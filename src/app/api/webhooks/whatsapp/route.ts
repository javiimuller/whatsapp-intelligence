import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerLabel } from "@/lib/privacy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && challenge && (!expected || token === expected)) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const entries = payload?.entry ?? [];
  const saved: string[] = [];

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      const connection = await prisma.whatsappConnection.findFirst({
        where: { phoneNumberId },
        include: { brand: true }
      });
      if (!connection) continue;

      for (const message of value.messages ?? []) {
        const from = String(message.from ?? "unknown");
        const customerAnonymousId = customerLabel(from);
        const timestamp = message.timestamp
          ? new Date(Number(message.timestamp) * 1000)
          : new Date();

        const conversation = await prisma.conversation.create({
          data: {
            brandId: connection.brandId,
            source: "whatsapp_api",
            customerAnonymousId,
            status: "nuevo_lead",
            purchaseIntent: "sin_intencion_clara",
            startedAt: timestamp,
            lastActivityAt: timestamp
          }
        });

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            externalMessageId: message.id,
            direction: "incoming",
            messageType: message.type ?? "text",
            bodyText: message.text?.body ? "[mensaje_anonimizado_guardado]" : null,
            timestamp,
            status: "received"
          }
        });
        saved.push(conversation.id);
      }

      await prisma.whatsappConnection.update({
        where: { id: connection.id },
        data: { lastSyncAt: new Date(), webhookStatus: "receiving" }
      });
    }
  }

  return NextResponse.json({ ok: true, saved });
}
