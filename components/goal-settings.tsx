"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { goalsSchema } from "@/lib/schemas";
import type { DailyGoals } from "@/lib/weekly";

function readError(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("error" in payload))
    return undefined;
  const error = payload.error;
  return typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
    ? error.message
    : undefined;
}

export function GoalSettings() {
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/user/goals", { signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok)
          throw new Error(readError(payload) ?? "Unable to load your goals.");
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("data" in payload)
        ) {
          throw new Error("Goal response was invalid.");
        }
        setGoals(payload.data as DailyGoals);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name !== "AbortError")
          setError(cause.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentGoals = goals;
    if (!currentGoals) return;
    const formData = new FormData(event.currentTarget);
    const input = {
      stepGoal: Number(formData.get("stepGoal")),
      waterGoalMl: Number(formData.get("waterGoalMl")),
      sleepGoalHrs: Number(formData.get("sleepGoalHrs")),
    };
    const validation = goalsSchema.safeParse(input);
    if (!validation.success) {
      toast.error(
        validation.error.issues[0]?.message ?? "Check the goal values.",
      );
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const payload: unknown = await response.json();
      if (!response.ok)
        throw new Error(readError(payload) ?? "Unable to save your goals.");
      setGoals({
        stepGoal: validation.data.stepGoal ?? currentGoals.stepGoal,
        waterGoalMl: validation.data.waterGoalMl ?? currentGoals.waterGoalMl,
        sleepGoalHrs: validation.data.sleepGoalHrs ?? currentGoals.sleepGoalHrs,
      });
      toast.success("Daily goals updated.");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to save your goals.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        aria-label="Loading goals"
        className="bg-ink/5 h-72 animate-pulse rounded-lg"
      />
    );
  }
  if (error) {
    return (
      <p
        role="alert"
        className="border-coral/30 bg-coral/10 text-danger rounded-lg border p-4 text-sm"
      >
        {error}
      </p>
    );
  }
  if (!goals) return null;

  return (
    <form
      onSubmit={save}
      className="border-ink/10 shadow-soft bg-surface max-w-2xl rounded-lg border p-5 sm:p-8"
    >
      <div className="mb-7">
        <p className="text-forest text-sm font-bold">PERSONAL TARGETS</p>
        <h2 className="font-display mt-2 text-2xl font-semibold">
          Daily goals
        </h2>
      </div>
      <div className="space-y-5">
        <div>
          <label
            htmlFor="stepGoal"
            className="mb-2 block text-sm font-semibold"
          >
            Steps per day
          </label>
          <div className="relative">
            <input
              id="stepGoal"
              name="stepGoal"
              type="number"
              min="500"
              max="100000"
              step="500"
              defaultValue={goals.stepGoal}
              required
              className="border-ink/15 bg-paper/60 focus:border-forest focus:ring-forest/15 w-full rounded-lg border px-4 py-3 pr-20 outline-none focus:ring-2"
            />
            <span className="text-ink/45 pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm">
              steps
            </span>
          </div>
        </div>
        <div>
          <label
            htmlFor="waterGoalMl"
            className="mb-2 block text-sm font-semibold"
          >
            Water per day
          </label>
          <div className="relative">
            <input
              id="waterGoalMl"
              name="waterGoalMl"
              type="number"
              min="250"
              max="10000"
              step="250"
              defaultValue={goals.waterGoalMl}
              required
              className="border-ink/15 bg-paper/60 focus:border-forest focus:ring-forest/15 w-full rounded-lg border px-4 py-3 pr-20 outline-none focus:ring-2"
            />
            <span className="text-ink/45 pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm">
              ml
            </span>
          </div>
        </div>
        <div>
          <label
            htmlFor="sleepGoalHrs"
            className="mb-2 block text-sm font-semibold"
          >
            Sleep per night
          </label>
          <div className="relative">
            <input
              id="sleepGoalHrs"
              name="sleepGoalHrs"
              type="number"
              min="1"
              max="16"
              step="0.5"
              defaultValue={goals.sleepGoalHrs}
              required
              className="border-ink/15 bg-paper/60 focus:border-forest focus:ring-forest/15 w-full rounded-lg border px-4 py-3 pr-20 outline-none focus:ring-2"
            />
            <span className="text-ink/45 pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm">
              hours
            </span>
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-forest hover:bg-ink focus-visible:outline-forest mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg px-5 text-sm font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
      >
        {saving ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
        ) : (
          <Save aria-hidden="true" size={17} />
        )}
        Save goals
      </button>
    </form>
  );
}
