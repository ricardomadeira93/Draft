"use client";

import { Link, usePathname } from "@/routing";
import { Compass, Database, Search, FileText, History, LayoutDashboard, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar — no borders, pure contrast separation */}
      <aside className="w-56 bg-card hidden md:flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-5">
          <Link href="/" className="flex items-center gap-2 group">
            <Compass className="h-4 w-4 text-primary" />
            <span
              className="font-mono text-sm font-medium tracking-widest uppercase text-foreground group-hover:text-primary transition-colors"
            >
              Draft
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 px-2 py-2 text-xs font-mono tracking-wide rounded-sm transition-colors ${
              pathname === "/dashboard" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
            Overview
          </Link>

          <p className="px-2 pt-4 pb-2 text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Workspace
          </p>
          <Link
            href="/setup"
            className={`flex items-center gap-2.5 px-2 py-2 text-xs font-mono tracking-wide rounded-sm transition-colors ${
              pathname === "/setup" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Database className="h-3.5 w-3.5 shrink-0" />
            1. Knowledge Library
          </Link>
          <Link
            href="/respond"
            className={`flex items-center gap-2.5 px-2 py-2 text-xs font-mono tracking-wide rounded-sm transition-colors ${
              pathname === "/respond" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            2. Auto-Filler
          </Link>
          <Link
            href="/inspect"
            className={`flex items-center gap-2.5 px-2 py-2 text-xs font-mono tracking-wide rounded-sm transition-colors ${
              pathname === "/inspect" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            3. Answer Inspector
          </Link>
          
          <p className="px-2 pt-6 pb-2 text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            {t('settings')}
          </p>
          <Link
            href="/history"
            className={`flex items-center gap-2.5 px-2 py-2 text-xs font-mono tracking-wide rounded-sm transition-colors ${
              pathname === "/history" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <History className="h-3.5 w-3.5 shrink-0" />
            {t('history')}
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-2.5 px-2 py-2 text-xs font-mono tracking-wide rounded-sm transition-colors ${
              pathname === "/settings" ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Settings className="h-3.5 w-3.5 shrink-0" />
            API & Settings
          </Link>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Theme
          </span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-border bg-background flex items-center justify-between px-8">
          <div></div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="h-4 w-px bg-border mx-2" />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
