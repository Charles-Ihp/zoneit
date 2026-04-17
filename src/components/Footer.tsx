import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border py-4 text-center font-heading text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
      <span>Listen to your body.</span>
      <span className="mx-3 opacity-30">·</span>
      <Link to="/terms" className="hover:text-foreground transition-colors">
        Glossary
      </Link>
    </footer>
  );
}
