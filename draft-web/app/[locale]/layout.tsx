import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Draft | Response Engine",
  description: "Automate security questionnaires with context.",
};

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const { locale } = params;
  const messages = await getMessages();

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "hsl(22 100% 50%)",
          borderRadius: "0rem",
        },
        elements: {
          cardBox: "shadow-none border border-border rounded-none bg-card",
          card: "bg-transparent rounded-none shadow-none",
          headerTitle: "font-light text-foreground text-2xl tracking-tight",
          headerSubtitle: "font-mono text-[10px] tracking-widest uppercase text-muted-foreground",
          socialButtonsBlockButton: "rounded-none border border-border bg-transparent hover:bg-accent hover:border-border font-mono text-xs text-foreground uppercase tracking-widest",
          socialButtonsBlockButtonText: "font-semibold",
          dividerLine: "bg-border",
          dividerText: "font-mono text-[10px] uppercase text-muted-foreground",
          formFieldLabel: "font-mono text-[10px] tracking-widest uppercase text-muted-foreground",
          formFieldInput: "bg-background border-border text-foreground rounded-none font-mono text-sm focus:border-primary focus:ring-primary",
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase rounded-none h-10 shadow-none",
          footerActionText: "font-mono text-[10px] tracking-widest uppercase text-muted-foreground",
          footerActionLink: "font-mono text-[10px] tracking-widest uppercase text-primary hover:text-primary/80",
          identityPreviewText: "font-mono text-xs text-foreground",
          identityPreviewEditButtonIcon: "text-primary",
        }
      }}
    >
      <html lang={locale} suppressHydrationWarning>
        <body
          className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} min-h-full flex flex-col antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider messages={messages}>
              {props.children}
            </NextIntlClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
