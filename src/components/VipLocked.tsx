import { Lock } from "lucide-react";

/** Upsell screen shown to non-VIP users where a VIP-only feature would be. */
export function VipLocked({ feature = "Programs" }: { feature?: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-foreground">
          {feature} is a VIP feature
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Upgrade to VIP to design and follow training programs. Ask an admin to enable VIP on your
          account.
        </p>
        <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Lock className="h-3.5 w-3.5" />
          VIP only
        </span>
      </div>
    </div>
  );
}
