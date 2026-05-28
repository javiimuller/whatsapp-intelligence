"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Kpi = { label: string; value: string };
type SellerRow = { seller: string; total: number; followUps: number; lost: number; score: string };

type PresentationData = {
  brandId: string;
  brandName: string;
  period: string;
  sourceSummary: string;
  summary: string;
  funnelDiagnosis: string;
  recommendation: string;
  kpis: Kpi[];
  intentData: Array<{ name: string; value: number }>;
  statusData: Array<{ name: string; value: number }>;
  objectionData: Array<{ name: string; value: number }>;
  productData: Array<{ name: string; value: number }>;
  sellerRows: SellerRow[];
};

const colors = ["#a6ff3f", "#e56f51", "#d8a847", "#88b7aa", "#5b7f70", "#d6ff75"];

export function HtmlPresentation({ data }: { data: PresentationData }) {
  const [index, setIndex] = useState(0);
  const slides = useMemo(
    () => [
      <CoverSlide key="cover" data={data} />,
      <NarrativeSlide key="narrative" data={data} />,
      <KpiSlide key="kpis" data={data} />,
      <ChartSlide key="intent" title="Intención y estado comercial" subtitle="Dónde se concentra la oportunidad de cierre">
        <div className="grid h-full gap-6 lg:grid-cols-2">
          <ChartCard title="Intención de compra">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.intentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#101513", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                <Bar dataKey="value" fill="#a6ff3f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Estado comercial">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={115}>
                  {data.statusData.map((entry, entryIndex) => (
                    <Cell key={entry.name} fill={colors[entryIndex % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#101513", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </ChartSlide>,
      <ChartSlide key="objections" title="Objeciones y productos" subtitle="Temas que aparecen en las conversaciones analizadas">
        <div className="grid h-full gap-6 lg:grid-cols-2">
          <ChartCard title="Objeciones frecuentes">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.objectionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#101513", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                <Bar dataKey="value" fill="#e56f51" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Productos mencionados">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.productData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#101513", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                <Bar dataKey="value" fill="#a6ff3f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </ChartSlide>,
      <SellerSlide key="sellers" data={data} />,
      <ActionSlide key="actions" data={data} />
    ],
    [data]
  );

  const lastIndex = slides.length - 1;

  return (
    <main className="min-h-screen text-white">
      <div className="print:hidden sticky top-0 z-10 border-b border-white/10 bg-[#0d1210]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase text-neon">Presentación ejecutiva</p>
            <p className="text-sm text-white/50">{data.brandName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/api/brands/${data.brandId}/presentation`} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75">
              <Download size={16} /> PPTX
            </Link>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/75">
              <Printer size={16} /> Imprimir
            </button>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6 print:p-0">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101513] shadow-glow print:rounded-none print:border-0 print:shadow-none">
          {slides[index]}
        </div>

        <div className="print:hidden mt-5 flex items-center justify-between gap-4">
          <button
            onClick={() => setIndex((value) => Math.max(0, value - 1))}
            disabled={index === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white/75 disabled:opacity-40"
          >
            <ChevronLeft size={18} /> Anterior
          </button>
          <div className="flex flex-1 items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-neon transition-all" style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
            </div>
            <span className="w-14 text-right text-sm text-white/50">
              {index + 1}/{slides.length}
            </span>
          </div>
          <button
            onClick={() => setIndex((value) => Math.min(lastIndex, value + 1))}
            disabled={index === lastIndex}
            className="inline-flex items-center gap-2 rounded-lg neon-pill px-4 py-3 font-semibold disabled:opacity-40"
          >
            Siguiente <ChevronRight size={18} />
          </button>
        </div>

        <div className="hidden print:block">
          {slides.slice(1).map((slide, slideIndex) => (
            <div key={slideIndex} className="mt-8 break-before-page overflow-hidden border border-white/10 bg-[#101513]">
              {slide}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function SlideShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="grid aspect-video min-h-[560px] gap-6 bg-[radial-gradient(circle_at_75%_0%,rgba(166,255,63,.14),transparent_30rem)] p-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-neon">WhatsApp Sales Intelligence</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle ? <p className="mt-2 text-lg text-white/55">{subtitle}</p> : null}
      </header>
      <div className="min-h-0">{children}</div>
    </div>
  );
}

function CoverSlide({ data }: { data: PresentationData }) {
  return (
    <div className="grid aspect-video min-h-[560px] grid-cols-[1fr_0.72fr] gap-10 bg-[radial-gradient(circle_at_25%_0%,rgba(166,255,63,.24),transparent_32rem)] p-10">
      <div className="flex flex-col justify-center">
        <p className="text-sm font-semibold uppercase text-neon">WhatsApp Sales Intelligence</p>
        <h1 className="mt-5 max-w-3xl text-6xl font-semibold tracking-tight text-white">Reporte ejecutivo {data.brandName}</h1>
        <p className="mt-5 text-xl text-white/62">{data.period}</p>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-white/62">{data.sourceSummary}</p>
      </div>
      <div className="grid content-center gap-4">
        {data.kpis.slice(0, 4).map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs font-semibold uppercase text-white/45">{kpi.label}</p>
            <p className="mt-2 text-4xl font-semibold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NarrativeSlide({ data }: { data: PresentationData }) {
  return (
    <SlideShell title="Lectura ejecutiva" subtitle="Qué está pasando y dónde actuar primero">
      <div className="grid h-full gap-5 lg:grid-cols-3">
        <NarrativeCard title="Resumen ejecutivo" text={data.summary} />
        <NarrativeCard title="Diagnóstico del embudo" text={data.funnelDiagnosis} />
        <NarrativeCard title="Recomendación prioritaria" text={data.recommendation} />
      </div>
    </SlideShell>
  );
}

function KpiSlide({ data }: { data: PresentationData }) {
  return (
    <SlideShell title="Indicadores principales" subtitle="Resumen cuantitativo del proceso comercial por WhatsApp">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs font-semibold uppercase text-white/45">{kpi.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function ChartSlide({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <SlideShell title={title} subtitle={subtitle}>
      {children}
    </SlideShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid h-full grid-rows-[auto_1fr] rounded-xl border border-white/10 bg-white/[0.06] p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="min-h-[320px]">{children}</div>
    </div>
  );
}

function SellerSlide({ data }: { data: PresentationData }) {
  return (
    <SlideShell title="Desempeño por vendedora" subtitle="Volumen, seguimiento, oportunidades perdidas y score">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.06]">
        <table className="w-full text-left">
          <thead className="bg-neon/10 text-sm uppercase text-white/55">
            <tr>
              <th className="px-5 py-4">Vendedora</th>
              <th className="px-5 py-4">Chats</th>
              <th className="px-5 py-4">Seguimiento</th>
              <th className="px-5 py-4">Perdidas</th>
              <th className="px-5 py-4">Score</th>
            </tr>
          </thead>
          <tbody>
            {data.sellerRows.length ? (
              data.sellerRows.map((row) => (
                <tr key={row.seller} className="border-t border-white/10">
                  <td className="px-5 py-4 font-semibold text-white">{row.seller}</td>
                  <td className="px-5 py-4 text-white/70">{row.total}</td>
                  <td className="px-5 py-4 text-white/70">{row.followUps}</td>
                  <td className="px-5 py-4 text-white/70">{row.lost}</td>
                  <td className="px-5 py-4 text-white/70">{row.score}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-white/55">Aún no hay conversaciones asociadas a vendedoras.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SlideShell>
  );
}

function ActionSlide({ data }: { data: PresentationData }) {
  const actions = [
    data.recommendation,
    "Convertir las objeciones frecuentes en respuestas comerciales estandarizadas.",
    "Revisar conversaciones sin seguimiento y priorizar las recuperables.",
    "Aumentar volumen de datos para comparar próximos periodos."
  ];

  return (
    <SlideShell title="Plan de acción" subtitle="Siguiente ciclo comercial">
      <div className="grid gap-4">
        {actions.map((action, actionIndex) => (
          <div key={action} className="flex gap-5 rounded-xl border border-white/10 bg-white/[0.06] p-5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full neon-pill font-semibold">{actionIndex + 1}</div>
            <p className="text-xl leading-8 text-white/72">{action}</p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function NarrativeCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-6">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-white/65">{text}</p>
    </div>
  );
}
