import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import type { UserResponse } from "@/lib/api";
import { useDarkMode } from "@/hooks/use-dark-mode";

interface UserMenuProps {
  user: UserResponse;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { dark, toggle } = useDarkMode();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 transition-colors hover:bg-secondary"
      >
        <span className="hidden max-w-32 truncate text-sm font-medium text-foreground sm:block">
          {user.name}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            <div className="border-b border-border px-4 py-2.5">
              <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
            </div>
            <Link
              to="/workouts/"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
            >
              My Sessions
            </Link>
            <Link
              to="/stats"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
            >
              Stats
            </Link>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
            >
              Profile
            </Link>
            <div className="border-t border-border">
              <button
                onClick={toggle}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <span>{dark ? "Light mode" : "Dark mode"}</span>
                <span className="text-muted-foreground">
                  {dark ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                  )}
                </span>
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

