import { getTranslations } from "next-intl/server";

export default async function TeamPage() {
  const t = await getTranslations("Team");

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

        <div className="bg-card p-8 max-w-4xl">
          <p className="text-sm text-muted-foreground font-light max-w-2xl">
            Recruiters no longer need to sign in to use Draft. Team and organization management was removed with the authentication flow.
          </p>
        </div>
      </main>
    </div>
  );
}
