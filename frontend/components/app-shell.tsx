"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Feather, LayoutGrid, MessageSquareText, MoonStar, Sun } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems =
    user?.role === "ADMIN"
      ? [
          { href: "/admin", label: "Ticket Dashboard", icon: LayoutGrid },
          { href: "/admin", label: "All Tickets", icon: MessageSquareText },
        ]
      : [
          { href: "/author", label: "Dashboard", icon: LayoutGrid },
          { href: "/author", label: "My Tickets", icon: MessageSquareText },
        ];

  function isActivePath(href: string) {
    if (href === "/author") {
      return pathname === "/author" || pathname.startsWith("/tickets/");
    }
    return pathname === href;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur dark:bg-slate-900 dark:border-slate-800">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="ink-kicker inline-flex items-center gap-1.5">
              <Feather className="size-3.5" />
              BookLeaf
            </p>
            <h1 className="font-display text-xl text-foreground dark:text-slate-100">Author Support Atelier</h1>
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              {user?.role === "ADMIN" ? "Admin Workspace" : "Author Workspace"}
            </p>
          </div>

          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                  isActivePath(item.href)
                    ? "bg-primary text-primary-foreground dark:bg-slate-700 dark:text-slate-100"
                    : "bg-muted text-foreground hover:bg-accent dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground dark:text-slate-100">{user?.name}</p>
              <p className="text-xs text-muted-foreground dark:text-slate-400">{user?.role}</p>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              className="dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <MoonStar className="size-4" />}
            </Button>
            <Button variant="outline" className="dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl p-3 sm:p-6">{children}</main>
    </div>
  );
}
