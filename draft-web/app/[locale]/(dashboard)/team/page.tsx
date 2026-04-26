import { OrganizationProfile } from "@clerk/nextjs";
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

        {/* Clerk Profile */}
        <div className="flex justify-start">
          <OrganizationProfile 
            appearance={{
              elements: {
                cardBox: "shadow-none border border-border rounded-none bg-card w-full max-w-4xl",
                card: "bg-transparent rounded-none shadow-none w-full",
                headerTitle: "font-light text-foreground text-2xl tracking-tight",
                headerSubtitle: "font-mono text-[10px] tracking-widest uppercase text-muted-foreground",
                formFieldLabel: "font-mono text-[10px] tracking-widest uppercase text-muted-foreground",
                formFieldInput: "bg-background border-border text-foreground rounded-none font-mono text-sm focus:border-primary focus:ring-primary",
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase rounded-none h-10 shadow-none",
                profileSectionTitleText: "font-mono text-sm uppercase tracking-widest text-foreground",
                badge: "rounded-none font-mono text-[10px] uppercase",
                userPreviewTextContainer: "font-mono text-sm",
                userPreviewSecondaryIdentifier: "text-muted-foreground",
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}
