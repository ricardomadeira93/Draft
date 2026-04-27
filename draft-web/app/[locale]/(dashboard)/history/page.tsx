"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2, Download, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface HistoryItem {
  id: string;
  filename: string;
  question_count: number;
  created_at: string;
}

interface Source { source: string; snippet: string; }
interface QARow { Question: string; Answer: string; Sources: Source[]; }

// Utility to download CSV
function downloadCSV(rows: QARow[], filename: string) {
  const header = "Question,Answer,Sources\n";
  const body = rows.map(r =>
    `"${r.Question.replace(/"/g, '""')}","${r.Answer.replace(/"/g, '""')}","${r.Sources.map(s => s.source).join("; ")}"`
  ).join("\n");
  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  URL.revokeObjectURL(url); document.body.removeChild(a);
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const t = useTranslations("History");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${API_URL}/history`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error(error);
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

  const handleDownload = async (item: HistoryItem, format: "csv" | "pdf" | "docx") => {
    setDownloadingId(item.id);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      
      // 1. Fetch the full answers for this session
      const res = await fetch(`${API_URL}/history/${item.id}`);
      if (!res.ok) throw new Error("Failed to fetch history details");
      const data = await res.json();
      const results: QARow[] = data.answers;

      // 2. Export based on format
      if (format === "csv") {
        downloadCSV(results, `answered_${item.filename}`);
      } else {
        const exportRes = await fetch(`${API_URL}/export`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ results, format })
        });
        if (!exportRes.ok) throw new Error("Export failed");
        const blob = await exportRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; 
        a.download = `answered_${item.filename.replace(".csv", "")}.${format}`;
        document.body.appendChild(a); a.click();
        URL.revokeObjectURL(url); document.body.removeChild(a);
      }
    } catch {
      toast.error("Export failed", { description: "Please try again." });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (item: HistoryItem) => {
    setDownloadingId(item.id);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      
      const res = await fetch(`${API_URL}/history/${item.id}`);
      const data = await res.json();
      
      const shareRes = await fetch(`${API_URL}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: data.answers })
      });
      
      const shareData = await shareRes.json();
      const shareUrl = `${window.location.origin}/review/${shareData.token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Share failed", { description: "Please try again." });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-8 py-14 space-y-12">
        {/* Header */}
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-3">
            {t("title")}
          </p>
          <h1 className="text-3xl font-light tracking-tight text-foreground">
            {t("subtitle")}
          </h1>
        </div>

        {/* List */}
        <div className="space-y-4">
          <div className="bg-card">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="p-12 text-center">
                <p className="font-mono text-xs text-muted-foreground">{t("no_history")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground w-[40%]">File</TableHead>
                    <TableHead className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground">Questions</TableHead>
                    <TableHead className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground">Date</TableHead>
                    <TableHead className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} className="border-0 hover:bg-accent/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-mono text-sm text-foreground">{item.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{item.question_count}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(item.created_at + "Z").toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="font-mono text-xs text-muted-foreground rounded-none gap-2"
                            onClick={() => handleShare(item)}
                            disabled={downloadingId === item.id}
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="font-mono text-xs text-muted-foreground rounded-none gap-2"
                            onClick={() => handleDownload(item, "pdf")}
                            disabled={downloadingId === item.id}
                          >
                            PDF
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="font-mono text-xs text-muted-foreground rounded-none gap-2"
                            onClick={() => handleDownload(item, "docx")}
                            disabled={downloadingId === item.id}
                          >
                            Word
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="font-mono text-xs text-primary rounded-none border-border"
                            onClick={() => handleDownload(item, "csv")}
                            disabled={downloadingId === item.id}
                          >
                            {downloadingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
