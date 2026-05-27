import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  /** Whether this is a full-bleed page (no padding) */
  fullBleed?: boolean;
  /** Custom className for the main content area */
  className?: string;
}

export function AppLayout({ children, fullBleed = false, className }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        {/* Top bar - only show on mobile for hamburger menu */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border/40 bg-background px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:hidden">
          <SidebarTrigger />
          <span className="font-heading font-bold tracking-tight text-foreground">GRAVITACIO</span>
        </header>

        {/* Main content */}
        <main
          className={cn(
            "flex-1",
            !fullBleed && "px-4 pt-3 pb-6 sm:px-6 sm:py-6 lg:px-8",
            className,
          )}
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
