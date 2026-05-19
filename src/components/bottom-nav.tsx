"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
};

const publicNavItems: NavItem[] = [
  { 
    href: "/dashboard", 
    label: "Home", 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, 
    match: (p) => p === "/" || p === "/dashboard" 
  },
  { 
    href: "/iuran", 
    label: "Iuran", 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>, 
    match: (p) => p.startsWith("/iuran") 
  },
  { 
    href: "/keuangan", 
    label: "Kas", 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>, 
    match: (p) => p.startsWith("/keuangan") || p.startsWith("/laporan") 
  },
  { 
    href: "/agenda", 
    label: "Agenda", 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>, 
    match: (p) => p.startsWith("/agenda") 
  },
  { 
    href: "/insidental", 
    label: "Info", 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>, 
    match: (p) => p.startsWith("/insidental") || p.startsWith("/jadwal-takjil") 
  },
];

const adminNavItems: NavItem[] = [
  { 
    href: "/admin/dashboard", 
    label: "Dasbor", 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>, 
    match: (p) => p === "/admin/dashboard" 
  },
  { 
    href: "/admin/iuran", 
    label: "Kel. Iuran", 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>, 
    match: (p) => p.startsWith("/admin/iuran") 
  },
  { 
    href: "/admin/pengeluaran", 
    label: "Kel. Kas", 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>, 
    match: (p) => p.startsWith("/admin/pengeluaran") 
  },
  { 
    href: "/admin/agenda", 
    label: "Kel. Agenda", 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>, 
    match: (p) => p.startsWith("/admin/agenda") 
  },
  { 
    href: "/admin/laporan", 
    label: "Laporan", 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, 
    match: (p) => p.startsWith("/admin/laporan") 
  },
];

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? adminNavItems : publicNavItems;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 md:hidden flex justify-center pointer-events-none px-4">
      <nav 
        className="glass-panel pointer-events-auto flex w-full max-w-sm rounded-3xl p-1.5 shadow-xl shadow-[var(--app-accent-glow)]" 
        aria-label="Bottom navigation"
      >
        <ul className="grid w-full grid-cols-5 gap-1">
          {items.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href} className="relative">
                {active && (
                  <div className="absolute inset-0 rounded-2xl bg-[var(--app-surface-2)] shadow-sm" />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition-all duration-300",
                    active ? "text-[var(--app-accent)] scale-105" : "text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:scale-105",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={cn("text-lg transition-transform duration-300", active ? "-translate-y-0.5" : "")}>
                    {item.icon}
                  </span>
                  <span className={cn("transition-opacity duration-300", active ? "opacity-100" : "opacity-70")}>
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[var(--app-accent)] shadow-[0_0_8px_var(--app-accent-glow)]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
