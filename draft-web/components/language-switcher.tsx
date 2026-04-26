"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: "en" | "pt") => {
    // router.replace will swap the locale automatically
    // because next-intl navigation hooks understand the current pathname
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-none h-8 w-8 hover:bg-accent/50">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none border-border shadow-none w-32">
        <DropdownMenuItem 
          onClick={() => switchLocale("en")}
          className={`font-mono text-xs rounded-none cursor-pointer ${locale === 'en' ? 'bg-primary/10 text-primary font-semibold' : ''}`}
        >
          English (EN)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => switchLocale("pt")}
          className={`font-mono text-xs rounded-none cursor-pointer ${locale === 'pt' ? 'bg-primary/10 text-primary font-semibold' : ''}`}
        >
          Português (PT)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
