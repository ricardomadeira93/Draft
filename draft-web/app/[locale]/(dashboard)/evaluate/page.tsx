"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, Search, Loader2, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface Source { source: string; snippet: string; }
interface Chunk { source: string; text: string; rank: number; }
interface EvalResult {
  question: string;
  answer: string;
  sources: Source[];
  retrieved_chunks: Chunk[];
}

function ChunkCard({ chunk }: { chunk: Chunk }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary border border-primary/40 px-2 py-0.5">#{chunk.rank}</span>
          <span className="font-mono text-xs text-muted-foreground">{chunk.source}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          <p className="text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">{chunk.text}</p>
        </div>
      )}
    </div>
  );
}

export default function EvaluatePage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);

  const handleEvaluate = async () => {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setResult(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error("Backend error.");
      setResult(await res.json());
    } catch {
      toast.error("Connection failed", { description: "Could not reach the server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div>
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">ANSWER INSPECTOR</p>
          <h1 className="text-4xl font-bold tracking-tight">Evaluate AI Logic</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Ask a question and inspect the pipeline: see which references the AI retrieved, exactly where they came from, and how it used them to generate the answer.
          </p>
        </div>

        <Card className="border-border">
          <CardHeader><CardTitle className="text-base font-medium">Ask a Question</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full min-h-[100px] bg-transparent border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none transition-colors font-mono"
              placeholder="e.g. Does the company have a SOC 2 Type II certification?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleEvaluate(); }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">⌘ + Enter to run</p>
              <Button className="rounded-[1rem] bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleEvaluate} disabled={!question.trim() || loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Retrieving...</> : "Run Evaluation"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-8">
            <div>
              <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">GENERATED ANSWER</h2>
              <div className="border border-primary/30 bg-primary/5 p-6">
                <p className="text-foreground leading-relaxed">{result.answer}</p>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">
                RETRIEVED REFERENCES ({result.retrieved_chunks.length})
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                These are the exact text blocks the system retrieved. Expand each to see the raw context passed to the AI.
              </p>
              <div className="space-y-2">
                {result.retrieved_chunks.map(chunk => <ChunkCard key={chunk.rank} chunk={chunk} />)}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">SOURCE ATTRIBUTION</h2>
              <div className="border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Retrieved Snippet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.sources.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span className="font-mono text-xs">{s.source}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono leading-relaxed">{s.snippet}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
