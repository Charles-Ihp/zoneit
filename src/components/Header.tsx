import { Link } from "@tanstack/react-router";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  /** Whether header should be transparent (for hero pages) */
  transparent?: boolean;
}

export function Header({ transparent = false }: HeaderProps) {
  const { user, loading: authLoading, login, logout } = useAuth();

  return (
    <header
      className={`${
        transparent
          ? "absolute left-0 right-0 top-0"
          : "sticky top-0 border-b border-border/50 bg-background/95 backdrop-blur-xl"
      } z-40`}
    >
      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link
            to="/"
            className={`font-heading text-lg font-bold tracking-tight transition-colors sm:text-xl ${
              transparent ? "text-white/90 hover:text-white" : "gradient-text"
            }`}
          >
            GRAVITACIO
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {!authLoading &&
            (user ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <button
                onClick={login}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all sm:px-5 sm:py-2 ${
                  transparent
                    ? "border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:border-white/50 hover:bg-white/20"
                    : "border border-border bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                Sign in
              </button>
            ))}
        </div>
      </div>
    </header>
  );
}
