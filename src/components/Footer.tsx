import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border py-4 text-center font-heading text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-0">
        <span>Listen to your body.</span>
        <span className="hidden sm:inline mx-3 opacity-30">·</span>
        <div className="flex items-center gap-3 sm:gap-0">
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Glossary
          </Link>
          <span className="mx-2 sm:mx-3 opacity-30">·</span>
          <Link to="/leaderboard" className="hover:text-foreground transition-colors">
            Leaderboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
