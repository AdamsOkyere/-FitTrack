"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, registerSchema } from "@/lib/schemas";

type AuthFormProps = { mode: "login" | "register" };

function getApiError(payload: unknown): string | undefined {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("error" in payload)
  ) {
    return undefined;
  }
  const error = payload.error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return typeof error.message === "string" ? error.message : undefined;
  }
  return undefined;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (isRegister) {
      const name = String(formData.get("name") ?? "");
      const confirmPassword = String(formData.get("confirmPassword") ?? "");
      const validation = registerSchema.safeParse({
        name,
        email,
        password,
        confirmPassword,
      });
      if (!validation.success) {
        setError(
          validation.error.issues[0]?.message ?? "Check the form fields.",
        );
        return;
      }
    } else {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        setError(
          validation.error.issues[0]?.message ?? "Check the form fields.",
        );
        return;
      }
    }

    setBusy(true);
    try {
      if (isRegister) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(formData.get("name") ?? ""),
            email,
            password,
            confirmPassword: String(formData.get("confirmPassword") ?? ""),
          }),
        });
        if (!response.ok) {
          const payload: unknown = await response.json();
          throw new Error(
            getApiError(payload) ?? "Unable to create your account.",
          );
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        throw new Error(
          isRegister
            ? "Account created, but sign-in failed. Please log in."
            : "Email or password is incorrect.",
        );
      }

      toast.success(isRegister ? "Your account is ready." : "Welcome back.");
      const requested = new URLSearchParams(window.location.search).get(
        "callbackUrl",
      );
      let destination = "/dashboard";
      if (requested) {
        try {
          const target = new URL(requested, window.location.origin);
          if (target.origin === window.location.origin) {
            destination = `${target.pathname}${target.search}${target.hash}`;
          }
        } catch {
          destination = "/dashboard";
        }
      }
      router.push(destination);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {isRegister && (
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold">
            Name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            className="border-ink/15 text-ink placeholder:text-ink/35 focus:border-forest focus:ring-forest/15 bg-surface w-full rounded-lg border px-4 py-3 transition outline-none focus:ring-2"
            placeholder="Your name"
          />
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className="border-ink/15 text-ink placeholder:text-ink/35 focus:border-forest focus:ring-forest/15 bg-surface w-full rounded-lg border px-4 py-3 transition outline-none focus:ring-2"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? 8 : 1}
          maxLength={72}
          className="border-ink/15 text-ink placeholder:text-ink/35 focus:border-forest focus:ring-forest/15 bg-surface w-full rounded-lg border px-4 py-3 transition outline-none focus:ring-2"
          placeholder={isRegister ? "At least 8 characters" : "Your password"}
        />
      </div>
      {isRegister && (
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-semibold"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            className="border-ink/15 text-ink placeholder:text-ink/35 focus:border-forest focus:ring-forest/15 bg-surface w-full rounded-lg border px-4 py-3 transition outline-none focus:ring-2"
            placeholder="Enter it again"
          />
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="border-coral/30 bg-coral/10 text-danger rounded-lg border px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="bg-forest hover:bg-ink focus-visible:outline-forest inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? (
          <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
        ) : null}
        {isRegister ? "Create account" : "Sign in"}
        {!busy && <ArrowRight aria-hidden="true" size={17} />}
      </button>
      <p className="text-ink/60 text-center text-sm">
        {isRegister ? "Already tracking with us?" : "New to FitTrack?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="text-forest decoration-forest/30 hover:decoration-forest focus-visible:outline-forest font-bold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
