"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Activity,
  Droplets,
  Footprints,
  LayoutDashboard,
  LogOut,
  LoaderCircle,
  Moon,
  Settings,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/walk", label: "Walk", icon: Footprints },
  { href: "/water", label: "Water", icon: Droplets },
  { href: "/sleep", label: "Sleep", icon: Moon },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut({ redirect: false });
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-ink/10 bg-paper/95 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link
            href="/dashboard"
            className="font-display flex items-center gap-2 text-lg font-bold"
          >
            <Activity aria-hidden="true" className="text-forest" size={20} />
            fittrack<span className="text-coral">.</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="border-ink/15 text-ink/70 hover:border-coral hover:text-ink focus-visible:outline-forest inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {signingOut ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={16}
                />
              ) : (
                <LogOut aria-hidden="true" size={16} />
              )}
              <span className="hidden sm:inline">
                {signingOut ? "Signing out" : "Sign out"}
              </span>
            </button>
          </div>
        </div>
      </header>
      <nav
        aria-label="Main navigation"
        className="border-ink/10 bg-surface-muted border-b"
      >
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2 sm:px-7">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                prefetch
                aria-current={active ? "page" : undefined}
                className={`focus-visible:outline-forest inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? "bg-forest text-white" : "text-ink/65 hover:bg-ink/5 hover:text-ink"}`}
              >
                <Icon aria-hidden="true" size={17} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
