"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, FileText, Download, Loader2, FileCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
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
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div>
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">RESPONSE ENGINE</p>
          <h1 className="text-4xl font-bold tracking-tight">RFP Auto-Filler</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Upload a CSV with a &quot;Question&quot; column. Our AI will instantly search your Knowledge Library and generate an accurate response with references for every row.
          </p>
        </div>

        <Card className="border-border">
          <CardHeader><CardTitle className="text-base font-medium">Process Questionnaire</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors p-10 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <Input
                type="file" accept=".csv" className="max-w-xs mx-auto"
                onChange={e => { setResults(null); setFile(e.target.files?.[0] || null); }}
              />
              <p className="text-xs text-muted-foreground mt-3">CSV must have a &quot;Question&quot; column.</p>
            </div>
            <Button className="w-full rounded-[1rem] bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleProcess} disabled={!file || loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />AI is writing answers...</> : "Generate Answers"}
            </Button>
          </CardContent>
        </Card>

        {results !== null && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Results
                <span className="text-muted-foreground font-normal text-sm ml-1">
                  — {results.length} {results.length === 1 ? "answer" : "answers"} generated
                </span>
              </h2>
              <Button variant="outline" size="sm" className="rounded-[1rem] gap-2"
                onClick={() => downloadCSV(results, `answered_${file?.name ?? "rfp.csv"}`)}>
                <Download className="h-4 w-4" />Download CSV
              </Button>
            </div>

            {results.length === 0 ? (
              <div className="border border-border p-12 text-center text-muted-foreground text-sm">
                No questions found. Make sure your CSV has a &quot;Question&quot; column.
              </div>
            ) : (
              <div className="border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Question</TableHead>
                      <TableHead className="w-[45%]">Answer</TableHead>
                      <TableHead>References</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm align-top text-foreground/90">{row.Question}</TableCell>
                        <TableCell className="text-sm text-muted-foreground leading-relaxed align-top">{row.Answer}</TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-1">
                            {row.Sources.map((s, j) => (
                              <span key={j} className="inline-flex items-center gap-1 text-xs font-mono text-primary border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-[0.5rem] w-fit">
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
