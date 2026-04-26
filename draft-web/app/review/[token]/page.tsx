"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Flag, Loader2, Compass } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface Source {
  source: string;
  snippet: string;
}

interface ReviewState {
  status: "pending" | "approved" | "flagged";
  comment: string;
}

interface QARow {
  Question: string;
  Answer: string;
  Sources: Source[];
  review?: ReviewState;
}

export default function ReviewPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QARow[]>([]);
  const [overallStatus, setOverallStatus] = useState<string>("pending");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;

    async function fetchReview() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${API_URL}/review/${token}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("This review link is invalid or has expired.");
          throw new Error("Failed to load review session.");
        }
        const data = await res.json();
        setAnswers(data.answers);
        setOverallStatus(data.status);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReview();
  }, [token]);

  const handleUpdate = async (index: number, newStatus: "approved" | "flagged", comment: string = "") => {
    setUpdating(index);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/review/${token}/answer/${index}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, comment })
      });
      if (!res.ok) throw new Error("Failed to update status");

      // Optimistic UI update
      setAnswers(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], review: { status: newStatus, comment } };
        return copy;
      });
    } catch (e) {
      alert("Failed to save review status. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <p className="font-mono text-sm tracking-widest uppercase text-muted-foreground">{error}</p>
      </div>
    );
  }

  const approvedCount = answers.filter(a => a.review?.status === "approved").length;
  const flaggedCount = answers.filter(a => a.review?.status === "flagged").length;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm font-medium tracking-widest uppercase">Draft Review</span>
          </div>
          <div className="flex items-center gap-4">
            <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground hidden sm:block">
              {approvedCount} / {answers.length} Approved
            </p>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-14 space-y-12">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-foreground">
            RFP Answer Review
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-light">
            Review the AI-generated answers below. Approve them or flag them for revision.
          </p>
        </div>

        <div className="space-y-8">
          {answers.map((row, index) => {
            const status = row.review?.status || "pending";
            return (
              <div key={index} className="bg-card p-6 border-l-2" style={{ borderLeftColor: status === "approved" ? "hsl(var(--primary))" : status === "flagged" ? "hsl(0 84% 60%)" : "transparent" }}>
                <div className="space-y-4">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Question {index + 1}</p>
                    <p className="text-base text-foreground font-medium">{row.Question}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">Generated Answer</p>
                    <p className="text-sm text-foreground leading-relaxed font-light">{row.Answer}</p>
                  </div>
                  
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/50">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={status === "approved" ? "default" : "outline"}
                        className="rounded-none font-mono text-[10px] tracking-widest uppercase h-8"
                        onClick={() => handleUpdate(index, "approved", row.review?.comment)}
                        disabled={updating === index}
                      >
                        {updating === index ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Check className="h-3 w-3 mr-2" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant={status === "flagged" ? "destructive" : "outline"}
                        className="rounded-none font-mono text-[10px] tracking-widest uppercase h-8"
                        onClick={() => handleUpdate(index, "flagged", row.review?.comment)}
                        disabled={updating === index}
                      >
                        {updating === index ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Flag className="h-3 w-3 mr-2" />}
                        Flag Issue
                      </Button>
                    </div>
                    
                    {status === "flagged" && (
                      <Input 
                        placeholder="Why is this flagged?"
                        className="max-w-xs h-8 text-xs font-mono rounded-none"
                        defaultValue={row.review?.comment}
                        onBlur={(e) => handleUpdate(index, "flagged", e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
