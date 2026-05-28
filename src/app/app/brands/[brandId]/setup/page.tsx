import Link from "next/link";
import { Plug, UploadCloud } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function SetupPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const brand = await prisma.brand.findUniqueOrThrow({ where: { id: brandId } });
  return (
    <div>
      <h1 className="text-3xl font-semibold">{brand.name}: método de análisis</h1>
      <p className="mt-2 text-ink/60">Elige cómo quieres convertir WhatsApp en indicadores comerciales.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Link href={`/app/brands/${brandId}/manual-analysis/new`} className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
          <UploadCloud className="text-coral" />
          <h2 className="mt-5 text-xl font-semibold">Subir información</h2>
          <p className="mt-3 text-ink/70">Carga archivos, capturas o exportaciones para generar un diagnóstico comercial del periodo.</p>
        </Link>
        <Link href={`/app/brands/${brandId}/whatsapp`} className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
          <Plug className="text-sage" />
          <h2 className="mt-5 text-xl font-semibold">Conectar WhatsApp Business</h2>
          <p className="mt-3 text-ink/70">Conecta WhatsApp Business API para recibir información automáticamente y tener trazabilidad en tiempo real.</p>
        </Link>
      </div>
    </div>
  );
}
