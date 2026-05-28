import { getDemoUser } from "@/lib/demoUser";

export default async function SettingsPage() {
  const user = await getDemoUser();

  const settings = [
    ["Cuenta", user.email],
    ["Privacidad", "Anonimización activa por defecto"],
    ["OPENAI_API_KEY", process.env.OPENAI_API_KEY ? "Configurada" : "No configurada"],
    ["WhatsApp Verify Token", process.env.WHATSAPP_VERIFY_TOKEN ? "Configurado" : "No configurado"],
    ["Storage", process.env.STORAGE_PROVIDER ?? "local"]
  ];

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase text-neon">Ajustes</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Configuración del workspace</h1>
        <p className="mt-2 text-white/55">Estado de cuenta, privacidad e integraciones del MVP.</p>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
        <div className="grid gap-3">
          {settings.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
              <span className="text-sm text-white/45">{label}</span>
              <span className="text-right text-sm font-medium text-white">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
