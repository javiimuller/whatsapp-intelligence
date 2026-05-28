"use client";

import { Fragment, useState } from "react";

type Row = {
  id: string;
  customer: string;
  date: string;
  seller: string;
  status: string;
  intent: string;
  objection: string;
  product: string;
  risk: string;
  action: string;
  lastActivity: string;
  summary: string;
  reason: string;
};

export function OpportunityTable({ rows }: { rows: Row[] }) {
  const [openId, setOpenId] = useState<string | null>(rows[0]?.id ?? null);
  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#eef5f1] text-xs uppercase text-ink/60">
            <tr>
              {["Cliente anónimo", "Fecha", "Vendedora", "Estado", "Intención", "Objeción", "Producto", "Riesgo", "Acción sugerida", "Última actividad"].map((head) => (
                <th key={head} className="px-4 py-3 font-semibold">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <tr onClick={() => setOpenId(openId === row.id ? null : row.id)} className="cursor-pointer border-t border-ink/10 hover:bg-[#fbfdfb]">
                  <td className="px-4 py-3 font-medium">{row.customer}</td>
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{row.seller}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row.intent}</td>
                  <td className="px-4 py-3">{row.objection}</td>
                  <td className="px-4 py-3">{row.product}</td>
                  <td className="px-4 py-3">{row.risk}</td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3">{row.lastActivity}</td>
                </tr>
                {openId === row.id ? (
                  <tr className="border-t border-ink/10 bg-[#fbfdfb]">
                    <td colSpan={10} className="px-4 py-4">
                      <div className="grid gap-3 md:grid-cols-4">
                        <Detail title="Resumen corto" text={row.summary} />
                        <Detail title="Motivo de clasificación" text={row.reason} />
                        <Detail title="Acción recomendada" text={row.action} />
                        <Detail title="Indicadores" text={`Riesgo ${row.risk}, intención ${row.intent}, estado ${row.status}.`} />
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Detail({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-ink/50">{title}</p>
      <p className="mt-1 text-sm text-ink/70">{text}</p>
    </div>
  );
}
