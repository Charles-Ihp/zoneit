import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  /** Optional title shown in the top bar */
  title?: string;
  /** Whether to show the mobile trigger */
  showMobileTrigger?: boolean;
  /** Additional header content (actions, etc.) */
  headerContent?: ReactNode;
  /** Whether this is a full-bleed page (no padding) */
  fullBleed?: boolean;
  /** Custom className for the main content area */
  className?: string;
}

export function AppLayout({
  children,
  title,
  showMobileTrigger = true,
  headerContent,
  fullBleed = false,
  className,
}: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        {/* Top bar - minimal, clean */}
        {(showMobileTrigger || title || headerContent) && (
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
            {showMobileTrigger && <SidebarTrigger className="md:hidden" />}
            {title && (
              <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {headerContent && (
              <div className="ml-auto flex items-center gap-2">{headerContent}</div>
            )}
          </header>
        )}

        {/* Main content */}
        <main className={cn("flex-1", !fullBleed && "px-4 py-6 sm:px-6 lg:px-8", className)}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
