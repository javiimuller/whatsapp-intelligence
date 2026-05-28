import { Field, TextAreaField } from "@/components/forms/Field";
import { createBrand } from "@/lib/actions";

export default function NewBrandPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Crear marca</h1>
      <p className="mt-2 text-ink/60">Configura el contexto comercial para que los indicadores tengan sentido.</p>
      <form action={createBrand} className="mt-8 grid gap-5 rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nombre de marca" name="name" required />
          <Field label="Industria" name="industry" placeholder="Moda, belleza, retail..." required />
          <Field label="País" name="country" required />
          <Field label="Moneda" name="currency" placeholder="COP, USD, MXN..." required />
          <Field label="Número de vendedoras" name="sellersCount" type="number" defaultValue={3} required />
          <Field label="Canal principal" name="mainChannel" defaultValue="WhatsApp" required />
        </div>
        <TextAreaField label="Objetivo del análisis" name="goal" placeholder="Ej: reducir oportunidades perdidas y mejorar seguimiento después de cotizar." required />
        <button className="rounded-md bg-ink px-4 py-3 font-medium text-white">Guardar y continuar</button>
      </form>
    </div>
  );
}
