import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Database, FileText, Search, ArrowRight, CheckCircle2, Zap, Shield, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      {/* ── Soft Gradient Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-6 w-6" />
            <span className="font-bold text-lg tracking-tight text-foreground">Draft</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/evaluate" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Answer Inspector
            </Link>
            <Link href="/knowledge" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Knowledge Library
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/workspace">
                <Button size="sm" className="rounded-[1rem] bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  Open App →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-start justify-center max-w-6xl mx-auto px-6 pt-28 pb-24">
        <p className="text-primary text-xs font-bold tracking-widest uppercase mb-6">
          PORTFOLIO PROJECT · FULL-STACK AI ENGINEERING
        </p>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight max-w-4xl">
          Sales teams lose <span className="text-primary">40+ hours</span><br />
          per RFP.<br />
          I built the fix.
        </h1>

        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Draft is a production-grade RAG system that ingests company knowledge bases into a vector database and auto-fills security questionnaires and RFPs in minutes — not weeks.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link href="/workspace">
            <Button size="lg" className="h-auto py-3 px-8 text-left rounded-[1rem] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 flex flex-col items-center justify-center gap-0.5">
              <span className="text-base font-semibold">Try the Live Demo</span>
              <span className="text-xs font-normal opacity-80">Upload a CSV & watch it work</span>
            </Button>
          </Link>

          <Link href="/evaluate">
            <Button size="lg" variant="outline" className="h-full py-3 px-8 text-base font-medium rounded-[1rem] bg-background hover:bg-accent border-border shadow-sm flex items-center justify-center">
              Inspect the AI
            </Button>
          </Link>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">THE PROBLEM</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance mx-auto">
              RFPs are a $10B problem hiding in plain sight.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                stat: "40+",
                unit: "hours",
                label: "Average time a sales engineer spends on a single RFP response",
              },
              {
                stat: "60%",
                unit: "",
                label: "Of RFP questions are repeated across different questionnaires",
              },
              {
                stat: "$200K+",
                unit: "",
                label: "Annual cost of dedicated RFP response staff at a mid-market company",
              },
            ].map((item) => (
              <div key={item.stat} className="bg-card p-10 rounded-[1.5rem] border border-border shadow-sm flex flex-col items-center text-center">
                <p className="text-5xl font-extrabold text-primary mb-2">
                  {item.stat}
                  <span className="text-2xl text-muted-foreground ml-1 font-semibold">{item.unit}</span>
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Solution / Architecture ── */}
      <section className="relative z-10 bg-muted/50 py-24 border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">THE ARCHITECTURE</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Not a ChatGPT wrapper.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every design decision was made deliberately. Here is why each component exists.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Database className="h-5 w-5 text-primary" />,
                title: "Pinecone Vector Database",
                why: "Why not SQLite/Postgres?",
                body: "RFP answers require semantic similarity search, not keyword matching. Pinecone provides ANN search at sub-10ms latency across millions of embeddings — no self-hosted infrastructure needed.",
              },
              {
                icon: <Zap className="h-5 w-5 text-primary" />,
                title: "RAG over Fine-tuning",
                why: "Why not fine-tune Llama3?",
                body: "Fine-tuning encodes knowledge into weights — so every time your policies change, you retrain. RAG reads from a live vector store, making updates instant and free.",
              },
              {
                icon: <Shield className="h-5 w-5 text-primary" />,
                title: "1000-token chunks, 200 overlap",
                why: "Why this chunking strategy?",
                body: "Smaller chunks increase retrieval precision. The 200-token overlap ensures context is not lost at boundaries — a key reason RAG systems fail in naive implementations.",
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-primary" />,
                title: "Source Attribution",
                why: "Why does this matter?",
                body: "Every answer shows which document it came from. This prevents hallucination from going undetected and makes the system auditable — a hard requirement for enterprise security teams.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-card p-8 rounded-[1.5rem] border border-border shadow-sm flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                  <p className="text-xs font-bold text-primary tracking-widest uppercase mt-2 mb-2">{item.why}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Three steps. Minutes, not weeks.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: <Database className="h-6 w-6 text-primary" />,
                title: "Build your Knowledge Library",
                body: "Upload policies, security docs, and past RFPs. The system safely stores them so the AI can read them later.",
                href: "/knowledge",
                cta: "Manage library",
              },
              {
                step: "02",
                icon: <FileText className="h-6 w-6 text-primary" />,
                title: "Upload the Questionnaire",
                body: "Drop in a CSV of questions. Our Response Engine instantly finds the right context and writes a professional, accurate answer.",
                href: "/workspace",
                cta: "Try it now",
              },
              {
                step: "03",
                icon: <Search className="h-6 w-6 text-primary" />,
                title: "Review & Verify",
                body: "Review every answer with its exact reference document before downloading. The Answer Inspector shows exactly how the AI thought.",
                href: "/evaluate",
                cta: "Open inspector",
              },
            ].map((item) => (
              <div key={item.step} className="group bg-card rounded-[1.5rem] border border-border p-8 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-extrabold text-muted-foreground/10 group-hover:text-primary/10 transition-colors">{item.step}</span>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.body}</p>
                </div>
                <Link href={item.href} className="inline-flex items-center gap-1 text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                  {item.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="relative z-10 border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">STACK</span>
            {[
              "FastAPI", "LangChain", "Pinecone", "Llama 3",
              "Next.js 15", "TypeScript", "Tailwind CSS", "SQLite",
            ].map((tech) => (
              <span key={tech} className="text-sm font-mono text-muted-foreground border border-border px-3 py-1">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer / CTA ── */}
      <section className="relative z-10 py-24 bg-card">
        <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div>
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-4">READY TO SEE IT?</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Built by someone who<br /> understands the full stack.
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/workspace">
              <Button size="lg" className="h-auto py-3 px-10 text-left rounded-[1rem] bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center justify-center gap-0.5">
                <span className="text-base font-semibold">Try the Live Demo</span>
                <span className="text-xs font-normal opacity-80">Upload a CSV & watch it work</span>
              </Button>
            </Link>
            <Link href="/evaluate">
              <Button size="lg" variant="outline" className="rounded-[1rem] h-12 px-8">
                Inspect the AI
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
