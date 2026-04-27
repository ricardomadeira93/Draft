import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Database, FileText, Search, ArrowRight, Zap, Shield, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("Landing");

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
              {t("nav_inspector")}
            </Link>
            <Link href="/setup" className="font-mono text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              {t("nav_library")}
            </Link>
            <div className="flex items-center gap-4 border-l border-border pl-4">
              <ThemeToggle />
              <LanguageSwitcher />
              <Link href="/dashboard">
                <Button size="sm" className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase px-6 h-9">
                  {t("open_workspace")} →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex flex-col items-start justify-center max-w-5xl mx-auto px-8 pt-32 pb-24 border-b border-border w-full">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-6">
          {t("hero_tag")}
        </p>

        <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-[1.1] max-w-4xl">
          {t("hero_title_1")}<span className="text-primary font-normal">{t("hero_title_highlight")}</span><br />
          {t("hero_title_2")}<br />
          {t("hero_title_3")}
        </h1>

        <p className="mt-8 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed font-light">
          {t("hero_desc")}
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase px-8 h-12">
              {t("open_workspace")}
            </Button>
          </Link>
          <Link href="/inspect">
            <Button size="lg" variant="ghost" className="rounded-none font-mono text-xs tracking-widest uppercase px-8 h-12 text-muted-foreground hover:text-foreground">
              {t("inspect_ai")}
            </Button>
          </Link>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="py-24 border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-8">
          <div className="mb-16">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-4">{t("problem_tag")}</p>
            <h2 className="text-3xl font-light tracking-tight">
              {t("problem_title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {[
              {
                stat: "40+",
                unit: t("stat_1_unit"),
                label: t("stat_1_label"),
              },
              {
                stat: "60%",
                unit: "",
                label: t("stat_2_label"),
              },
              {
                stat: "$200K+",
                unit: "",
                label: t("stat_3_label"),
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
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-4">{t("arch_tag")}</p>
            <h2 className="text-3xl font-light tracking-tight mb-4">
              {t("arch_title")}
            </h2>
            <p className="text-muted-foreground text-sm font-light max-w-2xl">
              {t("arch_desc")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                icon: <Database className="h-5 w-5 text-primary shrink-0" />,
                title: t("arch_1_title"),
                why: t("arch_1_why"),
                body: t("arch_1_body"),
              },
              {
                icon: <Zap className="h-5 w-5 text-primary shrink-0" />,
                title: t("arch_2_title"),
                why: t("arch_2_why"),
                body: t("arch_2_body"),
              },
              {
                icon: <Shield className="h-5 w-5 text-primary shrink-0" />,
                title: t("arch_3_title"),
                why: t("arch_3_why"),
                body: t("arch_3_body"),
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-primary shrink-0" />,
                title: t("arch_4_title"),
                why: t("arch_4_why"),
                body: t("arch_4_body"),
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
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-4">{t("how_tag")}</p>
            <h2 className="text-3xl font-light tracking-tight">{t("how_title")}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {[
              {
                step: "01",
                icon: <Database className="h-5 w-5 text-primary shrink-0" />,
                title: t("how_1_title"),
                body: t("how_1_body"),
                href: "/setup",
                cta: t("how_1_cta"),
              },
              {
                step: "02",
                icon: <FileText className="h-5 w-5 text-primary shrink-0" />,
                title: t("how_2_title"),
                body: t("how_2_body"),
                href: "/respond",
                cta: t("how_2_cta"),
              },
              {
                step: "03",
                icon: <Search className="h-5 w-5 text-primary shrink-0" />,
                title: t("how_3_title"),
                body: t("how_3_body"),
                href: "/inspect",
                cta: t("how_3_cta"),
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
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t("stack_tag")}</span>
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
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary mb-4">{t("cta_tag")}</p>
            <h2 className="text-3xl font-light tracking-tight">
              {t("cta_title_1")}<br /> {t("cta_title_2")}
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <Link href="/dashboard">
              <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase px-8 h-12">
                {t("open_workspace")}
              </Button>
            </Link>
            <Link href="/inspect">
              <Button size="lg" variant="ghost" className="rounded-none font-mono text-xs tracking-widest uppercase px-8 h-12 text-muted-foreground hover:text-foreground">
                {t("inspect_ai")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
