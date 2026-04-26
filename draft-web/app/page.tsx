import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Database, FileText, Search, ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <Compass className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm font-medium tracking-widest uppercase text-foreground group-hover:text-primary transition-colors">Draft</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/inspect" className="font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Answer Inspector
            </Link>
            <Link href="/setup" className="font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Knowledge Library
            </Link>
            <div className="flex items-center gap-4 border-l border-border pl-4">
              <ThemeToggle />
              <Link href="/respond">
                <Button size="sm" className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase px-6 h-9">
                  App →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex flex-col items-start justify-center max-w-5xl mx-auto px-8 pt-32 pb-24 border-b border-border w-full">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-6">
          Portfolio Project · Full-Stack AI Engineering
        </p>

        <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-[1.1] max-w-4xl">
          Sales teams lose <span className="text-primary font-normal">40+ hours</span><br />
          per RFP.<br />
          I built the fix.
        </h1>

        <p className="mt-8 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
          Draft is a production-grade RAG system that ingests company knowledge bases into a vector database and auto-fills security questionnaires and RFPs in minutes — not weeks.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link href="/respond">
            <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase px-8 h-12">
              Try the Live Demo
            </Button>
          </Link>
          <Link href="/inspect">
            <Button size="lg" variant="ghost" className="rounded-none font-mono text-xs tracking-widest uppercase px-8 h-12 text-muted-foreground hover:text-foreground">
              Inspect the AI
            </Button>
          </Link>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="py-24 border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-8">
          <div className="mb-16">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-4">The Problem</p>
            <h2 className="text-3xl font-light tracking-tight">
              RFPs are a $10B problem hiding in plain sight.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
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
              <div key={item.stat} className="bg-card p-10 flex flex-col items-start">
                <p className="text-4xl font-normal text-primary mb-2 font-mono">
                  {item.stat}
                  <span className="text-xl text-muted-foreground ml-1">{item.unit}</span>
                </p>
                <p className="text-muted-foreground text-sm font-light leading-relaxed mt-4">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Solution / Architecture ── */}
      <section className="py-24 border-b border-border">
        <div className="max-w-5xl mx-auto px-8">
          <div className="mb-16">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-4">The Architecture</p>
            <h2 className="text-3xl font-light tracking-tight mb-4">
              Not a ChatGPT wrapper.
            </h2>
            <p className="text-muted-foreground text-sm font-light max-w-2xl">
              Every design decision was made deliberately. Here is why each component exists.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                icon: <Database className="h-5 w-5 text-primary shrink-0" />,
                title: "Pinecone Vector Database",
                why: "Why not SQLite/Postgres?",
                body: "RFP answers require semantic similarity search, not keyword matching. Pinecone provides ANN search at sub-10ms latency across millions of embeddings — no self-hosted infrastructure needed.",
              },
              {
                icon: <Zap className="h-5 w-5 text-primary shrink-0" />,
                title: "RAG over Fine-tuning",
                why: "Why not fine-tune Llama3?",
                body: "Fine-tuning encodes knowledge into weights — so every time your policies change, you retrain. RAG reads from a live vector store, making updates instant and free.",
              },
              {
                icon: <Shield className="h-5 w-5 text-primary shrink-0" />,
                title: "1000-token chunks, 200 overlap",
                why: "Why this chunking strategy?",
                body: "Smaller chunks increase retrieval precision. The 200-token overlap ensures context is not lost at boundaries — a key reason RAG systems fail in naive implementations.",
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-primary shrink-0" />,
                title: "Source Attribution",
                why: "Why does this matter?",
                body: "Every answer shows which document it came from. This prevents hallucination from going undetected and makes the system auditable — a hard requirement for enterprise security teams.",
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-start gap-4 group">
                <div className="flex items-center gap-4 w-full border-b border-border pb-4">
                  {item.icon}
                  <h3 className="font-light text-xl text-foreground">{item.title}</h3>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-primary mb-2 mt-2">{item.why}</p>
                  <p className="text-muted-foreground text-sm font-light leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-8">
          <div className="mb-16">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-4">How it works</p>
            <h2 className="text-3xl font-light tracking-tight">Three steps. Minutes, not weeks.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {[
              {
                step: "01",
                icon: <Database className="h-5 w-5 text-primary shrink-0" />,
                title: "Build your Knowledge Library",
                body: "Upload policies, security docs, and past RFPs. The system safely stores them so the AI can read them later.",
                href: "/setup",
                cta: "Manage library",
              },
              {
                step: "02",
                icon: <FileText className="h-5 w-5 text-primary shrink-0" />,
                title: "Upload the Questionnaire",
                body: "Drop in a CSV of questions. Our Response Engine instantly finds the right context and writes a professional, accurate answer.",
                href: "/respond",
                cta: "Try it now",
              },
              {
                step: "03",
                icon: <Search className="h-5 w-5 text-primary shrink-0" />,
                title: "Review & Verify",
                body: "Review every answer with its exact reference document before downloading. The Answer Inspector shows exactly how the AI thought.",
                href: "/inspect",
                cta: "Open inspector",
              },
            ].map((item) => (
              <div key={item.step} className="bg-card p-8 flex flex-col justify-between group h-full">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <span className="font-mono text-2xl text-muted-foreground/30 font-light">{item.step}</span>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-light text-lg mb-3 text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground text-sm font-light leading-relaxed">{item.body}</p>
                  </div>
                </div>
                <Link href={item.href} className="mt-8 font-mono text-[10px] tracking-[0.15em] uppercase text-primary inline-flex items-center gap-2 group-hover:gap-3 transition-all w-fit">
                  {item.cta} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="py-12 border-b border-border bg-background">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Stack</span>
            {[
              "FastAPI", "LangChain", "Pinecone", "Llama 3",
              "Next.js 15", "TypeScript", "Tailwind CSS", "SQLite",
            ].map((tech) => (
              <span key={tech} className="font-mono text-xs text-muted-foreground">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer / CTA ── */}
      <section className="py-24 bg-card">
        <div className="max-w-5xl mx-auto px-8 flex flex-col md:flex-row items-start justify-between gap-12">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-4">Ready to see it?</p>
            <h2 className="text-3xl font-light tracking-tight">
              Built by someone who<br /> understands the full stack.
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Link href="/respond">
              <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase px-8 h-12">
                Try the Live Demo
              </Button>
            </Link>
            <Link href="/inspect">
              <Button size="lg" variant="ghost" className="rounded-none font-mono text-xs tracking-widest uppercase px-8 h-12 text-muted-foreground hover:text-foreground">
                Inspect the AI
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
