"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      toastOptions={{
        classNames: {
          toast:
            "font-mono text-xs tracking-wide rounded-none border border-border bg-card text-card-foreground shadow-none px-4 py-3",
          title: "font-mono text-xs font-medium tracking-wide",
          description: "font-mono text-[10px] text-muted-foreground",
          actionButton:
            "font-mono text-[10px] tracking-widest uppercase bg-primary text-primary-foreground rounded-none px-3 py-1",
          cancelButton:
            "font-mono text-[10px] tracking-widest uppercase bg-muted text-muted-foreground rounded-none px-3 py-1",
          error:
            "border-destructive/50 bg-card text-card-foreground",
          success:
            "border-primary/30 bg-card text-card-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
