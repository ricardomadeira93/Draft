"use client";

import { useState, useEffect } from "react";
import { FileText, FileCheck, History, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@/routing";

interface HistoryItem {
  id: string;
  filename: string;
  question_count: number;
  created_at: string;
}

interface KBFile {
  filename: string;
  chunk_count: number;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-card p-6 flex items-start gap-4">
      <div className="p-2 bg-primary/10 rounded-none">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-light text-foreground tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [kbFiles, setKbFiles] = useState<KBFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const [histRes, kbRes] = await Promise.all([
          fetch(`${API_URL}/history`, { cache: "no-store" }),
          fetch(`${API_URL}/kb/files`, { cache: "no-store" }),
        ]);

        const [histData, kbData] = await Promise.all([histRes.json(), kbRes.json()]);
        if (!cancelled) {
          setHistory(histData.history || []);
          setKbFiles(kbData.files || []);
        }
      } catch {
        // backend may not be running
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalQuestions = history.reduce((sum, h) => sum + h.question_count, 0);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-8 py-14 space-y-12">

        {/* Header */}
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-3">
            Workspace
          </p>
          <h1 className="text-3xl font-light tracking-tight text-foreground">
            Overview
          </h1>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-xs">Loading...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Documents Indexed" value={kbFiles.length} icon={FileText} />
            <StatCard label="RFP Runs Completed" value={history.length} icon={FileCheck} />
            <StatCard label="Questions Answered" value={totalQuestions} icon={History} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
            Quick Actions
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              href="/setup"
              className="group bg-card hover:bg-accent/40 p-5 flex items-center justify-between transition-colors"
            >
              <div>
                <p className="font-mono text-xs tracking-widest uppercase text-foreground mb-1">Knowledge Library</p>
                <p className="text-xs text-muted-foreground font-light">Upload and manage your source documents</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            <Link
              href="/respond"
              className="group bg-card hover:bg-accent/40 p-5 flex items-center justify-between transition-colors"
            >
              <div>
                <p className="font-mono text-xs tracking-widest uppercase text-foreground mb-1">Auto-Filler</p>
                <p className="text-xs text-muted-foreground font-light">Upload a CSV and generate answers with AI</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
              Recent Activity
            </p>
            <Link href="/history" className="font-mono text-[10px] tracking-widest uppercase text-primary hover:text-primary/80 transition-colors">
              View All
            </Link>
          </div>

          <div className="bg-card">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-mono text-xs text-muted-foreground">No runs yet. Upload a CSV to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-accent/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-mono text-sm text-foreground truncate">{item.filename}</span>
                    </div>
                    <div className="flex items-center gap-6 shrink-0 ml-4">
                      <span className="font-mono text-xs text-muted-foreground hidden md:block">
                        {item.question_count} answers
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(item.created_at + "Z").toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
