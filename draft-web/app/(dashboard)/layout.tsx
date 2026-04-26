import Link from "next/link";
import { Compass, Database, Search, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
          <p className="px-2 pt-4 pb-2 text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Workspace
          </p>
          <Link
            href="/setup"
            className="flex items-center gap-2.5 px-2 py-2 text-xs font-mono tracking-wide text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
          >
            <Database className="h-3.5 w-3.5 shrink-0" />
            1. Knowledge Library
          </Link>
          <Link
            href="/respond"
            className="flex items-center gap-2.5 px-2 py-2 text-xs font-mono tracking-wide text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
          >
            <FileText className="h-3.5 w-3.5 shrink-0" />
            2. Auto-Filler
          </Link>
          <Link
            href="/inspect"
            className="flex items-center gap-2.5 px-2 py-2 text-xs font-mono tracking-wide text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            3. Answer Inspector
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
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
