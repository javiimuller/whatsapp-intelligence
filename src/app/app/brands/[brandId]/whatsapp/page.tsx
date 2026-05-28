import { Field } from "@/components/forms/Field";
import { saveWhatsappConnection } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export default async function WhatsappPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const connection = await prisma.whatsappConnection.findUnique({ where: { brandId } });
  const action = saveWhatsappConnection.bind(null, brandId);

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr]">
      <section>
        <h1 className="text-3xl font-semibold">WhatsApp Business API</h1>
        <p className="mt-2 text-ink/60">Solo se usa para trazabilidad y análisis comercial. No hay inbox ni respuestas desde la app.</p>
        <div className="mt-6 grid gap-3 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <Info label="Estado de conexión" value={connection?.status ?? "sin_configurar"} />
          <Info label="WhatsApp Business Account ID" value={connection?.wabaId ?? "Pendiente"} />
          <Info label="Phone Number ID" value={connection?.phoneNumberId ?? "Pendiente"} />
          <Info label="Webhook Verify Token" value={connection?.verifyToken ?? "Pendiente"} />
          <Info label="Última sincronización" value={connection?.lastSyncAt?.toLocaleString("es-CO") ?? "Sin eventos"} />
          <Info label="Estado del webhook" value={connection?.webhookStatus ?? "not_verified"} />
        </div>
      </section>
      <form action={action} className="grid gap-5 rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
        <Field label="wabaId" name="wabaId" defaultValue={connection?.wabaId} required />
        <Field label="phoneNumberId" name="phoneNumberId" defaultValue={connection?.phoneNumberId} required />
        <Field label="accessToken" name="accessToken" type="password" placeholder="Token de Meta" required />
        <Field label="verifyToken" name="verifyToken" defaultValue={connection?.verifyToken} required />
        <button className="rounded-md bg-ink px-4 py-3 font-medium text-white">Guardar conexión</button>
      </form>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-ink/50">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
