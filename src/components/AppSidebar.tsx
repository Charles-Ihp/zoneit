import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Home,
  Dumbbell,
  Trophy,
  BarChart3,
  BookOpen,
  User,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
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
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/workouts", icon: Dumbbell, label: "Workouts" },
  { to: "/stats", icon: BarChart3, label: "Stats" },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/terms", icon: BookOpen, label: "Glossary" },
];

export function AppSidebar() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center justify-between px-2 py-1">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 font-heading font-bold tracking-tight transition-all duration-200",
              isCollapsed ? "justify-center" : "",
            )}
          >
            {!isCollapsed && <span className="text-foreground">GRAVITACIO</span>}
            {isCollapsed && <span className="text-sm font-black text-foreground">G</span>}
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
                      <Link to={item.to}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
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
                      <Link to="/profile">
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
                    onClick={login}
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

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="mt-2 flex w-full items-center justify-center rounded-md p-2 text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
