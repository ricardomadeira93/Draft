"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FileText, Download, Loader2, FileCheck } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface Source { source: string; snippet: string; }
interface QARow { Question: string; Answer: string; Sources: Source[]; }

// ~6 seconds per question is a conservative estimate for cold Render + Groq
const SECS_PER_QUESTION = 6;

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

async function handleExportDoc(results: QARow[], format: "pdf" | "docx", originalFilename: string, setExporting: (state: boolean) => void, getToken: () => Promise<string | null>, orgId: string | null | undefined) {
  setExporting(true);
  try {
    const token = await getToken();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${API_URL}/export`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...(orgId && { "X-Org-Id": orgId })
      },
      body: JSON.stringify({ results, format })
    });
    if (!res.ok) throw new Error("Failed to export document");
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = `answered_${originalFilename.replace(".csv", "")}.${format}`;
    document.body.appendChild(a); a.click();
    URL.revokeObjectURL(url); document.body.removeChild(a);
  } catch (e) {
    alert("Export failed. Ensure backend has weasyprint/python-docx installed.");
  } finally {
    setExporting(false);
  }
}

async function handleShare(results: QARow[], setSharing: (state: boolean) => void, setShared: (state: boolean) => void, getToken: () => Promise<string | null>, orgId: string | null | undefined) {
  setSharing(true);
  try {
    const token = await getToken();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${API_URL}/share`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...(orgId && { "X-Org-Id": orgId })
      },
      body: JSON.stringify({ results })
    });
    if (!res.ok) throw new Error("Failed to generate share link");
    
    const data = await res.json();
    const shareUrl = `${window.location.origin}/review/${data.token}`;
    await navigator.clipboard.writeText(shareUrl);
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  } catch (e) {
    alert("Share failed. Please check server logs.");
  } finally {
    setSharing(false);
  }
}

function countCsvRows(file: File): Promise<number> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string ?? "";
      // subtract 1 for the header row, minimum 1
      const rows = text.trim().split("\n").length - 1;
      resolve(Math.max(rows, 1));
    };
    reader.readAsText(file);
  });
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function ProcessingState({ rowCount, elapsed }: { rowCount: number; elapsed: number }) {
  const estimated = rowCount * SECS_PER_QUESTION;
  const progress = Math.min((elapsed / estimated) * 100, 95); // cap at 95% until done
  const remaining = Math.max(estimated - elapsed, 0);
  // Rough "current row" estimate
  const currentRow = Math.min(Math.floor(elapsed / SECS_PER_QUESTION) + 1, rowCount);

  return (
    <div className="bg-card p-8 space-y-6">
      {/* Status line */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
          <span className="font-mono text-sm text-foreground">
            Writing answer {currentRow} of {rowCount}...
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {formatTime(elapsed)} elapsed
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-[2px] bg-secondary w-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ETA */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6">
          <div>
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Questions</p>
            <p className="font-mono text-base text-foreground">{rowCount}</p>
          </div>
          <div>
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Estimated total</p>
            <p className="font-mono text-base text-foreground">{formatTime(estimated)}</p>
          </div>
          <div>
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Time remaining</p>
            <p className="font-mono text-base text-primary">{formatTime(remaining)}</p>
          </div>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Blinking activity dots */}
      <div className="flex items-center gap-1.5 pt-1">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div
            key={i}
            className="h-1 w-1 rounded-full bg-primary/30"
            style={{
              backgroundColor: i < currentRow ? "hsl(22 100% 50%)" : undefined,
              opacity: i === currentRow - 1 ? 1 : i < currentRow - 1 ? 0.6 : 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Workspace() {
  const [file, setFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [language, setLanguage] = useState("English");
  const [results, setResults] = useState<QARow[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { getToken, orgId } = useAuth();

  // Parse row count whenever file changes
  useEffect(() => {
    if (!file) { setRowCount(0); return; }
    countCsvRows(file).then(setRowCount);
  }, [file]);

  // Elapsed timer while loading
  useEffect(() => {
    if (loading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setResults(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/process-csv`, { 
        method: "POST", 
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`,
          ...(orgId && { "X-Org-Id": orgId })
        }
      });
      if (!res.ok) throw new Error("Backend error.");
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      alert("Error connecting to the backend. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-8 py-14 space-y-12">

        {/* Header */}
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-3">
            Response Engine
          </p>
          <h1 className="text-3xl font-light tracking-tight text-foreground">
            RFP Auto-Filler
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-light max-w-xl">
            Upload a CSV with a &quot;Question&quot; column. The AI will search your Knowledge Library and generate an accurate response with references for every row.
          </p>
        </div>

        {/* Upload — hidden while processing */}
        {!loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground">
                Upload Questionnaire
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="/samples/sample_questionnaire.csv"
                  download
                  className="font-mono text-xs tracking-widest uppercase text-primary hover:text-primary/80 transition-colors"
                >
                  Download Template (CSV)
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguage(l => l === "English" ? "Portuguese (pt-PT)" : "English")}
                  className="rounded-none font-mono text-xs tracking-widest uppercase h-8 px-3 border-border"
                >
                  {language === "English" ? "EN" : "PT"}
                </Button>
              </div>
            </div>
            <div className="bg-card p-8 text-center space-y-4">
              <FileText className="h-6 w-6 text-muted-foreground mx-auto" />
              <Input
                type="file"
                accept=".csv"
                className="max-w-xs mx-auto bg-transparent border-0 text-base font-mono text-muted-foreground"
                onChange={e => { setResults(null); setFile(e.target.files?.[0] || null); }}
              />
              {rowCount > 0 && (
                <p className="font-mono text-xs text-primary">
                  {rowCount} question{rowCount !== 1 ? "s" : ""} detected
                  <span className="text-muted-foreground ml-2">
                    — est. {formatTime(rowCount * SECS_PER_QUESTION)}
                  </span>
                </p>
              )}
              {!rowCount && (
                <p className="text-xs font-mono text-muted-foreground">CSV must have a &quot;Question&quot; column</p>
              )}
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-sm tracking-widest uppercase rounded-none h-12"
              onClick={handleProcess}
              disabled={!file || loading}
            >
              Generate Answers
            </Button>
          </div>
        )}

        {/* Processing state */}
        {loading && (
          <div className="space-y-3">
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground">
              Processing
            </p>
            <ProcessingState rowCount={rowCount} elapsed={elapsed} />
          </div>
        )}

        {/* Results */}
        {results !== null && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <p className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground">
                  Results — {results.length} {results.length === 1 ? "answer" : "answers"}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs tracking-widest uppercase rounded-none gap-2 h-8 border-border"
                  onClick={() => handleShare(results, setSharing, setShared, getToken, orgId)}
                  disabled={sharing || shared}
                >
                  {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {shared ? "Link Copied!" : "Share for Review"}
                </Button>
                <div className="h-4 w-px bg-border mx-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground rounded-none gap-2 hover:bg-transparent"
                  onClick={() => handleExportDoc(results, "pdf", file?.name ?? "rfp.csv", setExporting, getToken, orgId)}
                  disabled={exporting}
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground rounded-none gap-2 hover:bg-transparent"
                  onClick={() => handleExportDoc(results, "docx", file?.name ?? "rfp.csv", setExporting, getToken, orgId)}
                  disabled={exporting}
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Word
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground rounded-none gap-2 hover:bg-transparent"
                  onClick={() => downloadCSV(results, `answered_${file?.name ?? "rfp.csv"}`)}
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="bg-card p-12 text-center text-muted-foreground text-sm font-mono">
                No questions found. Check that your CSV has a &quot;Question&quot; column.
              </div>
            ) : (
              <div className="bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground w-[28%]">Question</TableHead>
                      <TableHead className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground w-[48%]">Answer</TableHead>
                      <TableHead className="font-mono text-xs tracking-[0.15em] uppercase text-muted-foreground">References</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, i) => (
                      <TableRow key={i} className="border-0 hover:bg-accent/30 align-top">
                        <TableCell className="font-mono text-sm text-foreground align-top py-4">{row.Question}</TableCell>
                        <TableCell className="text-base text-foreground/90 leading-relaxed align-top py-4">{row.Answer}</TableCell>
                        <TableCell className="align-top py-4">
                          <div className="flex flex-col gap-1">
                            {row.Sources.map((s, j) => (
                              <span
                                key={j}
                                className="inline-flex items-center text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 w-fit"
                              >
                                {s.source}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
