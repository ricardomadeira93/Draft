"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FileText, Download, Loader2, FileCheck } from "lucide-react";

interface Source { source: string; snippet: string; }
interface QARow { Question: string; Answer: string; Sources: Source[]; }

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

export default function Workspace() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QARow[] | null>(null);

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setResults(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/process-csv`, { method: "POST", body: formData });
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

        {/* Upload */}
        <div className="space-y-4">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
            Upload Questionnaire
          </p>
          <div className="bg-card p-8 text-center space-y-4">
            <FileText className="h-6 w-6 text-muted-foreground mx-auto" />
            <Input
              type="file"
              accept=".csv"
              className="max-w-xs mx-auto bg-transparent border-0 text-sm font-mono text-muted-foreground"
              onChange={e => { setResults(null); setFile(e.target.files?.[0] || null); }}
            />
            <p className="text-[11px] font-mono text-muted-foreground">CSV must have a &quot;Question&quot; column</p>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase rounded-none h-10"
            onClick={handleProcess}
            disabled={!file || loading}
          >
            {loading
              ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />AI is writing answers...</>
              : "Generate Answers"
            }
          </Button>
        </div>

        {/* Results */}
        {results !== null && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                  Results — {results.length} {results.length === 1 ? "answer" : "answers"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground rounded-none gap-2 hover:bg-transparent"
                onClick={() => downloadCSV(results, `answered_${file?.name ?? "rfp.csv"}`)}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>

            {results.length === 0 ? (
              <div className="bg-card p-12 text-center text-muted-foreground text-xs font-mono">
                No questions found. Check that your CSV has a &quot;Question&quot; column.
              </div>
            ) : (
              <div className="bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground w-[28%]">Question</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground w-[48%]">Answer</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">References</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, i) => (
                      <TableRow key={i} className="border-0 hover:bg-accent/30 align-top">
                        <TableCell className="font-mono text-xs text-foreground align-top py-4">{row.Question}</TableCell>
                        <TableCell className="text-xs text-muted-foreground leading-relaxed align-top py-4 font-light">{row.Answer}</TableCell>
                        <TableCell className="align-top py-4">
                          <div className="flex flex-col gap-1">
                            {row.Sources.map((s, j) => (
                              <span
                                key={j}
                                className="inline-flex items-center text-[10px] font-mono text-primary bg-primary/5 px-2 py-0.5 w-fit"
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
