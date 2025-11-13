'use client';

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-h-screen w-full", className)}>
      {children}
    </div>
  );
}

export function AppShellHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <header className={cn("sticky top-0 z-10 flex h-16 items-center border-b bg-background/95 backdrop-blur px-4 md:px-6", className)}>
      {children}
    </header>
  );
}

export function AppShellContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("flex-1", className)}>
      {children}
    </main>
  );
}
