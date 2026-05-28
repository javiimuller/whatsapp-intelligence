import Link from "next/link";
import {
  BarChart3,
  Bell,
  Building2,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  PlusCircle,
  Search,
  Settings,
  Sparkles,
  UploadCloud,
  Zap
} from "lucide-react";
import { getDemoUser } from "@/lib/demoUser";
import { prisma } from "@/lib/prisma";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getDemoUser();
  const firstBrand = await prisma.brand.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true }
  });


  const navItems = [
    { label: "Overview", href: "/app", icon: LayoutDashboard },
    { label: "Nueva marca", href: "/app/brands/new", icon: PlusCircle },
    { label: "Diagnósticos", href: "/app/diagnostics", icon: UploadCloud },
    { label: "Reportes", href: "/app/reports", icon: FileText },
    { label: "WhatsApp API", href: firstBrand ? `/app/brands/${firstBrand.id}/whatsapp` : "/app/brands/new", icon: MessageSquareText }
  ];

  const settingsItems = [
    { label: "Marcas", href: "/app/brands", icon: Building2 },
    { label: "Analítica", href: "/app/analytics", icon: BarChart3 },
    { label: "Ajustes", href: "/app/settings", icon: Settings }
  ];

  return (
    <div className="app-dark font-sans selection:bg-neon/30 selection:text-white">
      <div className="flex min-h-screen gap-0 p-3 xl:p-4">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 rounded-l-2xl border border-white/5 bg-[#050706]/60 p-4 backdrop-blur-xl lg:block xl:w-72 relative z-10 shadow-soft">
          <Link href="/app" className="group flex items-center gap-3 px-2 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-full neon-pill shadow-glow transition-transform duration-300 group-hover:scale-110">
              <Sparkles size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white tracking-wide">WhatsApp Sales</span>
              <span className="block text-xs text-white/45">Intelligence</span>
            </span>
          </Link>

          <form action="/app/search" className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition-all focus-within:border-neon/50 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_15px_rgba(166,255,63,0.1)]">
            <Search size={15} className="text-white/45" />
            <input
              name="q"
              placeholder="Buscar marca..."
              className="clean-input min-w-0 flex-1 border-0 p-0 text-sm text-white outline-none placeholder:text-white/35"
            />
          </form>

          <nav className="mt-8">
            <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-white/35">Dashboards</p>
            <div className="grid gap-1.5">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = index === 0;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-300 ${
                      isActive ? "neon-pill font-semibold shadow-glow-hover" : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon size={16} className={`transition-transform duration-300 ${!isActive && "group-hover:scale-110 group-hover:text-neon"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <nav className="mt-10">
            <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-white/35">Gestión</p>
            <div className="grid gap-1.5">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} href={item.href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 transition-all duration-300 hover:bg-white/[0.06] hover:text-white">
                    <Icon size={16} className="transition-transform duration-300 group-hover:scale-110 group-hover:text-neon" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="absolute bottom-4 left-4 right-4 mt-10 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-neon animate-pulse-subtle"></div>
              <p className="text-xs font-semibold text-white">Privacidad activa</p>
            </div>
            <p className="text-[11px] leading-relaxed text-white/50">Clientes anonimizados y conversaciones ocultas por defecto.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/5 bg-[#0a0d0c]/40 backdrop-blur-md lg:rounded-l-none relative z-0 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <header className="sticky top-0 z-20 border-b border-white/5 bg-[#050706]/60 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 xl:px-8">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neon animate-fade-in">Commercial Dashboard</p>
                <h1 className="text-lg font-semibold text-white mt-0.5">WhatsApp Sales Intelligence</h1>
              </div>
              <nav className="flex items-center gap-3 text-sm">
                <Link className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-white/70 transition-all hover:bg-white/[0.08] hover:text-white sm:inline-flex hover:border-white/20" href="/app/brands/new">
                  <PlusCircle size={16} /> <span className="font-medium">Nueva marca</span>
                </Link>
                <Link className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-white/70 transition-all hover:bg-white/[0.08] hover:text-white md:inline-flex hover:border-white/20" href="/app/search">
                  <Search size={16} /> <span className="font-medium">Buscar</span>
                </Link>
                <button className="grid h-[38px] w-[38px] place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70 transition-all hover:bg-white/[0.08] hover:text-white hover:border-white/20">
                  <Bell size={16} />
                </button>
                <div className="hidden h-6 w-px bg-white/10 xl:block mx-1"></div>
                <span className="hidden max-w-52 truncate text-xs font-medium text-white/40 xl:inline">Modo demo</span>
                <Link className="inline-flex items-center gap-2 rounded-xl neon-pill px-4 py-2 font-semibold shadow-glow transition-transform hover:scale-105" href="/app">
                  <Zap size={16} /> Plataforma
                </Link>
              </nav>
            </div>
          </header>
          
          <main className="min-h-[calc(100vh-5rem)] overflow-x-hidden px-4 py-8 md:px-6 xl:px-8 2xl:px-10 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
