"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { conversationStatusData, intentData, objectionsData, sellerPerformanceData } from "@/lib/mockData";

const colors = ["#6f8f80", "#e56f51", "#d8a847", "#88b7aa", "#273c35"];

export function DashboardCharts() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Estado de conversaciones">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={conversationStatusData} dataKey="value" nameKey="name" outerRadius={88}>
              {conversationStatusData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Intención de compra">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={intentData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#6f8f80" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Objeciones frecuentes">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={objectionsData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#e56f51" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Desempeño por vendedora">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sellerPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="seller" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#273c35" radius={[6, 6, 0, 0]} />
            <Bar dataKey="followUp" fill="#d8a847" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
