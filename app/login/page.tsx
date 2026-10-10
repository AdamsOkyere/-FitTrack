import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl content-center gap-12 px-5 py-10 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
      <div className="fixed top-5 right-5 z-10">
        <ThemeToggle />
      </div>
      <section className="order-2 lg:order-1">
        <Link
          href="/"
          className="text-ink/60 hover:text-forest mb-9 inline-flex items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft aria-hidden="true" size={16} /> Back to home
        </Link>
        <div className="font-display mb-7 flex items-center gap-2 text-xl font-bold">
          <Activity aria-hidden="true" className="text-forest" size={21} />
          fittrack<span className="text-coral">.</span>
        </div>
        <p className="text-forest mb-3 text-sm font-bold uppercase">
          Your rhythm continues
        </p>
        <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">
          Good to see you again.
        </h1>
        <p className="text-ink/60 mt-4 max-w-md leading-7">
          Sign in to pick up where your daily habits left off.
        </p>
      </section>
      <section className="border-ink/10 shadow-soft bg-surface/80 order-1 rounded-lg border p-6 sm:p-9 lg:order-2">
        <h2 className="font-display text-2xl font-semibold">Sign in</h2>
        <p className="text-ink/55 mt-2 mb-7 text-sm">
          Use your email and password to continue.
        </p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
