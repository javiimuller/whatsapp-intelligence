import Link from "next/link";
import { Search } from "lucide-react";
import { getDemoUserId } from "@/lib/demoUser";
import { prisma } from "@/lib/prisma";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const userId = await getDemoUserId();

  const { q = "" } = await searchParams;
  const query = q.trim();
  const brands = query
    ? await prisma.brand.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query } },
            { industry: { contains: query } },
            { country: { contains: query } }
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 20
      })
    : [];

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase text-neon">Búsqueda</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Buscar marcas</h1>
        <p className="mt-2 text-white/55">Encuentra marcas por nombre, industria o país.</p>
      </div>

      <form className="flex max-w-3xl items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
        <Search size={18} className="text-white/45" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Ej: moda, Colombia, nombre de marca..."
          className="clean-input min-w-0 flex-1 border-0 p-0 text-white outline-none placeholder:text-white/35"
        />
        <button className="rounded-lg neon-pill px-4 py-2 text-sm font-semibold">Buscar</button>
      </form>

      <section className="grid gap-3">
        {brands.map((brand) => (
          <Link key={brand.id} href={`/app/brands/${brand.id}/dashboard`} className="rounded-xl border border-white/10 bg-white/[0.06] p-5 hover:border-neon/40">
            <h2 className="text-lg font-semibold text-white">{brand.name}</h2>
            <p className="mt-1 text-sm text-white/50">{brand.industry} · {brand.country}</p>
          </Link>
        ))}
        {query && brands.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] p-6 text-white/55">No encontramos marcas para “{query}”.</div>
        ) : null}
        {!query ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] p-6 text-white/55">Escribe una búsqueda para ver resultados.</div>
        ) : null}
      </section>
    </div>
  );
}
