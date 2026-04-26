"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

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
    <div className="bg-card">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-widest text-primary">#{chunk.rank}</span>
          <span className="font-mono text-xs text-muted-foreground">{chunk.source}</span>
        </div>
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          <p className="text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">{chunk.text}</p>
        </div>
      )}
    </div>
  );
}

export default function EvaluatePage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  const { getToken, orgId } = useAuth();

  const handleEvaluate = async () => {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setResult(null);
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/evaluate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          ...(orgId && { "X-Org-Id": orgId })
        },
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
      <main className="max-w-4xl mx-auto px-8 py-14 space-y-12">

        {/* Header */}
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-3">
            Answer Inspector
          </p>
          <h1 className="text-3xl font-light tracking-tight text-foreground">
            Evaluate AI Logic
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-light max-w-2xl">
            Ask a question and inspect the pipeline. See which references were retrieved, where they came from, and how the AI used them.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Question</p>
          <textarea
            className="w-full min-h-[100px] bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none font-mono border-0"
            placeholder="e.g. Does the company have a SOC 2 Type II certification?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleEvaluate(); }}
          />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono text-muted-foreground">⌘ + Enter to run</p>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase rounded-none h-9 px-6"
              onClick={handleEvaluate}
              disabled={!question.trim() || loading}
            >
              {loading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Retrieving...</> : "Run"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-10">

            {/* Answer */}
            <div className="space-y-3">
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Generated Answer</p>
              <div className="bg-card p-6">
                <p className="text-base text-foreground/90 leading-relaxed">{result.answer}</p>
              </div>
            </div>

            {/* Retrieved Chunks */}
            <div className="space-y-3">
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                Retrieved References — {result.retrieved_chunks.length} blocks
              </p>
              <p className="text-xs text-muted-foreground font-light">
                These are the exact text blocks passed to the AI as context. Expand each to inspect.
              </p>
              <div className="space-y-1">
                {result.retrieved_chunks.map(chunk => <ChunkCard key={chunk.rank} chunk={chunk} />)}
              </div>
            </div>

            {/* Source Table */}
            <div className="space-y-3">
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Source Attribution</p>
              <div className="bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Document</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Snippet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.sources.map((s, i) => (
                      <TableRow key={i} className="border-0 hover:bg-accent/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
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
