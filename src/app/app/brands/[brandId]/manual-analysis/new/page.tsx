import { Field, TextAreaField } from "@/components/forms/Field";
import { createManualAnalysis } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export default async function ManualAnalysisPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const sellers = await prisma.seller.findMany({ where: { brandId } });
  const action = createManualAnalysis.bind(null, brandId);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Nuevo diagnóstico manual</h1>
      <p className="mt-2 text-ink/60">Sube información del periodo. La app mostrará métricas y resúmenes, no conversaciones completas.</p>
      <form action={action} className="mt-8 grid gap-5 rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
        <Field label="Nombre del diagnóstico" name="name" placeholder="Diagnóstico mayo 2026" required />
        <Field label="Periodo analizado" name="period" placeholder="01/05/2026 - 31/05/2026" required />
        <label className="grid gap-2 text-sm font-medium">
          Vendedora, opcional
          <select name="sellerId" className="rounded-md border border-ink/15 bg-white px-3 py-2">
            <option value="">Todas</option>
            {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Archivos
          <input
            name="files"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf,.csv,.xlsx,.txt"
            className="rounded-md border border-dashed border-ink/20 bg-[#fbfdfb] px-3 py-6"
            required
          />
        </label>
        <TextAreaField label="Notas internas" name="notes" placeholder="Contexto del periodo, campañas, productos agotados o cambios del equipo." />
        <button className="rounded-md bg-ink px-4 py-3 font-medium text-white">Procesar diagnóstico</button>
      </form>
    </div>
  );
}
