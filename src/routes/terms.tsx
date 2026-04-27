import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { api, type TermResponse } from "@/lib/api";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Glossary — GRAVITACIO" },
      {
        name: "description",
        content: "Bouldering terminology glossary. Search and browse common climbing terms.",
      },
    ],
  }),
});

function TermsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [terms, setTerms] = useState<TermResponse[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    setLoading(true);
    api.terms.list().then((data) => {
      setTerms(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return terms;
    const q = query.toLowerCase();
    return terms.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q),
    );
  }, [terms, query]);

  const grouped = useMemo(() => {
    const map: Record<string, TermResponse[]> = {};
    for (const t of filtered) {
      const l = t.letter.toUpperCase();
      if (!map[l]) map[l] = [];
      map[l].push(t);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const letters = useMemo(() => grouped.map(([l]) => l), [grouped]);

  function scrollToLetter(letter: string) {
    const el = sectionRefs.current[letter];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="mb-1 font-heading text-3xl font-bold tracking-tight text-foreground">
            Bouldering Glossary
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Common terminology used in bouldering and climbing.
          </p>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search terms…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Alphabet jump nav (only shown when not searching) */}
          {!query.trim() && letters.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-1">
              {letters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => scrollToLetter(letter)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {letter}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          )}

          {!loading && grouped.length === 0 && (
            <p className="mt-16 text-center text-sm text-muted-foreground">
              No terms found for "{query}".
            </p>
          )}

          {!loading && (
            <div className="space-y-10">
              {grouped.map(([letter, termList]) => (
                <section
                  key={letter}
                  ref={(el) => {
                    sectionRefs.current[letter] = el;
                  }}
                >
                  <h2 className="mb-3 font-heading text-2xl font-bold text-foreground/40">
                    {letter}
                  </h2>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {termList.map((t) => (
                      <div key={t.id} className="px-4 py-3">
                        <span className="font-semibold text-foreground">{t.term}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{t.definition}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
