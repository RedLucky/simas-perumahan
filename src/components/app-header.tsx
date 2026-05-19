"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const publicNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", match: (p) => p === "/" || p === "/dashboard" },
  { href: "/iuran", label: "Iuran", match: (p) => p.startsWith("/iuran") },
  { href: "/keuangan", label: "Keuangan", match: (p) => p.startsWith("/keuangan") },
  { href: "/insidental", label: "Insidental", match: (p) => p.startsWith("/insidental") },
  { href: "/jadwal-takjil", label: "Takjil", match: (p) => p.startsWith("/jadwal-takjil") },
  { href: "/agenda", label: "Agenda", match: (p) => p.startsWith("/agenda") },
  { href: "/laporan", label: "Laporan", match: (p) => p.startsWith("/laporan") },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dasbor Admin", match: (p) => p === "/admin/dashboard" },
  { href: "/admin/iuran", label: "Iuran", match: (p) => p.startsWith("/admin/iuran") },
  { href: "/admin/pengeluaran", label: "Kas", match: (p) => p.startsWith("/admin/pengeluaran") },
  { href: "/admin/insidental", label: "Insidental", match: (p) => p.startsWith("/admin/insidental") },
  { href: "/admin/takjil", label: "Takjil", match: (p) => p.startsWith("/admin/takjil") },
  { href: "/admin/agenda", label: "Agenda", match: (p) => p.startsWith("/admin/agenda") },
  { href: "/admin/laporan", label: "Laporan", match: (p) => p.startsWith("/admin/laporan") },
];

function navClass(active: boolean) {
  return cn(
    "relative rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap",
    active 
      ? "text-[var(--app-accent)]" 
      : "text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-surface-2)]",
  );
}

export function AppHeader({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/dashboard");
    router.refresh();
  }

  const items = isAdmin ? adminNavItems : publicNavItems;
  const homeLink = isAdmin ? "/admin/dashboard" : "/dashboard";

  return (
    <header className="glass sticky top-0 z-40 border-b-0 border-[var(--app-border-soft)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4 flex-1 overflow-x-auto no-scrollbar mask-gradient-right">
          <Link href={homeLink} className="flex items-center gap-2 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--app-accent)] to-[#3b82f6] text-white shadow-md transition-transform group-hover:scale-105 group-active:scale-95">
              <span className="font-bold text-lg leading-none">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gradient hidden sm:block">
              SiMas
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex ml-4" aria-label="Primary navigation">
            {items.map((item) => {
              const active = item.match(pathname);
              return (
                <Link key={item.href} href={item.href} className={navClass(active)} aria-current={active ? "page" : undefined}>
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-[3px] w-1/2 -translate-x-1/2 rounded-t-full bg-[var(--app-accent)] shadow-[0_0_8px_var(--app-accent-glow)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          {isAdmin && (
            <button
              onClick={() => void handleLogout()}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
              aria-label="Logout"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
