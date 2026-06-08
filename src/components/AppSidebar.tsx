import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Home,
  Dumbbell,
  Trophy,
  BarChart3,
  BookOpen,
  CalendarRange,
  User,
  LogOut,
  LogIn,
  Lock,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navItems: { to: string; icon: LucideIcon; label: string; vip?: boolean }[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/workouts", icon: Dumbbell, label: "Workouts" },
  { to: "/programs", icon: CalendarRange, label: "Programs", vip: true },
  { to: "/stats", icon: BarChart3, label: "Stats" },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/terms", icon: BookOpen, label: "Glossary" },
];

export function AppSidebar() {
  const { user, loading: authLoading, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const { setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center px-2 py-1">
          <Link
            to="/"
            className="flex items-center gap-2 font-heading font-bold tracking-tight transition-all duration-200"
          >
            <span className="text-foreground">GRAVITACIO</span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.to === "/" ? currentPath === "/" : currentPath.startsWith(item.to);

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "relative transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <Link to={item.to} onClick={handleNavClick}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {item.vip && !user?.isVip && (
                          <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active-indicator"
                            className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary"
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-2">
        <SidebarMenu>
          {!authLoading && (
            <>
              {user ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath === "/profile"}
                      tooltip="Profile"
                      className={cn(
                        "transition-all duration-200",
                        currentPath === "/profile"
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <Link to="/profile" onClick={handleNavClick}>
                        {user.picture ? (
                          <img
                            src={user.picture}
                            alt={user.name}
                            className="h-5 w-5 rounded-full"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className="truncate">{user.name || "Profile"}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={logout}
                      tooltip="Sign out"
                      className="text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setAuthModalOpen(true)}
                    tooltip="Sign in"
                    className="border border-border bg-background text-foreground transition-all duration-200 hover:bg-muted"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign in</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </Sidebar>
  );
}
