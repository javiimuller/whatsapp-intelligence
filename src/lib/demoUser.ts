import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@whatsapp-sales.local";

export async function getDemoUserId() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "Demo WhatsApp Sales",
      passwordHash: null
    },
    select: { id: true }
  });

  return user.id;
}

export async function getDemoUser() {
  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "Demo WhatsApp Sales",
      passwordHash: null
    },
    select: { id: true, email: true, name: true }
  });
}
