"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import {
  Activity,
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { ActivityInput } from "@/lib/schemas";

type ActivityType = ActivityInput["type"];
type LogEntry = {
  id: string;
  type: ActivityType;
  value: number;
  secondaryValue: number | null;
  date: string;
  note: string | null;
};

type TrackerConfig = {
  title: string;
  description: string;
  valueLabel: string;
  valueUnit: string;
  valueStep: string;
  secondaryLabel?: string;
};

const configs: Record<ActivityType, TrackerConfig> = {
  WALK: {
    title: "Walk & steps",
    description: "Record a walk and keep an eye on your daily movement.",
    valueLabel: "Steps",
    valueUnit: "steps",
    valueStep: "1",
    secondaryLabel: "Distance (km)",
  },
  WATER: {
    title: "Water",
    description: "Log each glass and build a steady hydration rhythm.",
    valueLabel: "Amount",
    valueUnit: "ml",
    valueStep: "50",
  },
  SLEEP: {
    title: "Sleep",
    description: "Track last night’s rest and how restorative it felt.",
    valueLabel: "Hours slept",
    valueUnit: "hours",
    valueStep: "0.1",
    secondaryLabel: "Sleep quality",
  },
};

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function getLocalInputValue(value: string, includeTime: boolean) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, includeTime ? 16 : 10);
}

function toApiDate(value: string, includeTime: boolean) {
  const date = includeTime
    ? new Date(value)
    : new Date(`${value}T12:00:00.000Z`);
  return date.toISOString();
}

function describeEntry(entry: LogEntry) {
  if (entry.type === "WALK") {
    return `${entry.value.toLocaleString()} steps · ${(entry.secondaryValue ?? 0).toFixed(2)} km`;
  }
  if (entry.type === "WATER") return `${entry.value.toLocaleString()} ml`;
  return `${entry.value.toFixed(1)} hours · Quality ${entry.secondaryValue ?? "-"}/5`;
}

function getErrorMessage(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("error" in payload))
    return undefined;
  const error = payload.error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return typeof error.message === "string" ? error.message : undefined;
  }
  return undefined;
}

async function fetchEntries(
  type: ActivityType,
  signal?: AbortSignal,
): Promise<LogEntry[]> {
  const response = await fetch(`/api/logs?type=${type}`, { signal });
  const payload: unknown = await response.json();
  if (!response.ok)
    throw new Error(
      getErrorMessage(payload) ?? "Unable to load activity history.",
    );
  if (typeof payload !== "object" || payload === null || !("data" in payload))
    return [];
  return Array.isArray(payload.data) ? (payload.data as LogEntry[]) : [];
}

export function ActivityTracker({ type }: { type: ActivityType }) {
  const config = configs[type];
  const includeTime = type === "WATER";
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loadedType, setLoadedType] = useState<ActivityType | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [secondaryValue, setSecondaryValue] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const defaultDate = hydrated
    ? getLocalInputValue(new Date().toISOString(), includeTime)
    : "";
  const dateValue = date || defaultDate;

  useEffect(() => {
    const controller = new AbortController();
    fetchEntries(type, controller.signal)
      .then(setEntries)
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError")
          toast.error(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedType(type);
      });
    return () => controller.abort();
  }, [type]);

  function resetForm() {
    setEditingId(null);
    setValue("");
    setSecondaryValue("");
    setNote("");
    setDate("");
  }

  async function refresh() {
    try {
      setEntries(await fetchEntries(type));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to refresh history.",
      );
    }
  }

  async function saveLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(value);
    const secondary = Number(secondaryValue);
    if (!Number.isFinite(amount) || amount <= 0 || !dateValue) {
      toast.error("Enter a valid amount and date.");
      return;
    }
    if (type !== "WATER" && !Number.isFinite(secondary)) {
      toast.error(
        `Enter ${type === "WALK" ? "a distance" : "a quality rating"}.`,
      );
      return;
    }

    const body: Record<string, string | number> = {
      type,
      value: amount,
      date: toApiDate(dateValue, includeTime),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    if (type !== "WATER") body.secondaryValue = secondary;

    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/logs/${editingId}` : "/api/logs",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          getErrorMessage(payload) ?? "Unable to save this entry.",
        );
      toast.success(editingId ? "Entry updated." : "Activity logged.");
      resetForm();
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save this entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function quickAdd(amount: number) {
    const quickDate =
      dateValue || getLocalInputValue(new Date().toISOString(), true);
    setSaving(true);
    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WATER",
          value: amount,
          date: toApiDate(quickDate, true),
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok)
        throw new Error(getErrorMessage(payload) ?? "Unable to log water.");
      toast.success(`Added ${amount} ml.`);
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to log water.",
      );
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(entry: LogEntry) {
    setEditingId(entry.id);
    setValue(String(entry.value));
    setSecondaryValue(String(entry.secondaryValue ?? ""));
    setDate(
      includeTime
        ? getLocalInputValue(entry.date, true)
        : entry.date.slice(0, 10),
    );
    setNote(entry.note ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteEntry(id: string) {
    if (!window.confirm("Delete this activity entry? This cannot be undone."))
      return;
    try {
      const response = await fetch(`/api/logs/${id}`, { method: "DELETE" });
      const payload: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          getErrorMessage(payload) ?? "Unable to delete this entry.",
        );
      setEntries((current) => current.filter((entry) => entry.id !== id));
      if (editingId === id) resetForm();
      toast.success("Entry deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete this entry.",
      );
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
      <section className="border-ink/10 shadow-soft bg-surface rounded-lg border p-5 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-forest text-sm font-semibold">DAILY PRACTICE</p>
            <h2 className="font-display mt-1 text-2xl font-semibold">
              {editingId ? "Edit entry" : "Log activity"}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              aria-label="Cancel editing"
              className="border-ink/15 text-ink/65 hover:bg-ink/5 focus-visible:outline-forest grid size-9 place-items-center rounded-lg border focus-visible:outline focus-visible:outline-2"
            >
              <X aria-hidden="true" size={17} />
            </button>
          )}
        </div>
        {type === "WATER" && (
          <div className="mb-6">
            <p className="text-ink/50 mb-2 text-xs font-bold uppercase">
              Quick add
            </p>
            <div className="flex gap-2">
              {[250, 500].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={saving}
                  onClick={() => void quickAdd(amount)}
                  className="border-forest/25 text-forest hover:bg-lime/40 focus-visible:outline-forest inline-flex min-h-10 items-center gap-1 rounded-lg border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
                >
                  <Plus aria-hidden="true" size={15} /> {amount} ml
                </button>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={saveLog} className="space-y-4">
          <div>
            <label
              htmlFor="activity-value"
              className="mb-2 block text-sm font-semibold"
            >
              {config.valueLabel}
            </label>
            <div className="relative">
              <input
                id="activity-value"
                type="number"
                inputMode="decimal"
                min={type === "SLEEP" ? "0.1" : "1"}
                max={
                  type === "WALK" ? "200000" : type === "WATER" ? "20000" : "24"
                }
                step={config.valueStep}
                required
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="border-ink/15 bg-paper/60 focus:border-forest focus:ring-forest/15 w-full rounded-lg border px-4 py-3 pr-20 transition outline-none focus:ring-2"
              />
              <span className="text-ink/45 pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm">
                {config.valueUnit}
              </span>
            </div>
          </div>
          {type === "WALK" && (
            <div>
              <label
                htmlFor="activity-secondary"
                className="mb-2 block text-sm font-semibold"
              >
                {config.secondaryLabel}
              </label>
              <input
                id="activity-secondary"
                type="number"
                inputMode="decimal"
                min="0"
                max="500"
                step="0.01"
                required
                value={secondaryValue}
                onChange={(event) => setSecondaryValue(event.target.value)}
                className="border-ink/15 bg-paper/60 focus:border-forest focus:ring-forest/15 w-full rounded-lg border px-4 py-3 transition outline-none focus:ring-2"
                placeholder="e.g. 3.2"
              />
            </div>
          )}
          {type === "SLEEP" && (
            <div>
              <label
                htmlFor="activity-secondary"
                className="mb-2 block text-sm font-semibold"
              >
                {config.secondaryLabel}
              </label>
              <select
                id="activity-secondary"
                required
                value={secondaryValue}
                onChange={(event) => setSecondaryValue(event.target.value)}
                className="border-ink/15 bg-paper/60 focus:border-forest focus:ring-forest/15 w-full rounded-lg border px-4 py-3 transition outline-none focus:ring-2"
              >
                <option value="">Choose a rating</option>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} / 5
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label
              htmlFor="activity-date"
              className="mb-2 block text-sm font-semibold"
            >
              {includeTime ? "Date and time" : "Date"}
            </label>
            <input
              id="activity-date"
              type={includeTime ? "datetime-local" : "date"}
              required
              value={dateValue}
              onChange={(event) => setDate(event.target.value)}
              className="border-ink/15 bg-paper/60 focus:border-forest focus:ring-forest/15 w-full rounded-lg border px-4 py-3 transition outline-none focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="activity-note"
              className="mb-2 block text-sm font-semibold"
            >
              Note <span className="text-ink/45 font-normal">(optional)</span>
            </label>
            <input
              id="activity-note"
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="border-ink/15 bg-paper/60 focus:border-forest focus:ring-forest/15 w-full rounded-lg border px-4 py-3 transition outline-none focus:ring-2"
              placeholder="Add a small detail"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-forest hover:bg-ink focus-visible:outline-forest inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={17}
              />
            ) : (
              <Check aria-hidden="true" size={17} />
            )}
            {editingId ? "Save changes" : "Save activity"}
          </button>
        </form>
      </section>

      <section className="min-w-0">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-forest text-sm font-semibold">YOUR RECORD</p>
            <h2 className="font-display mt-1 text-2xl font-semibold">
              History
            </h2>
          </div>
          <span className="text-ink/50 text-sm">Latest 100 entries</span>
        </div>
        {loadedType !== type ? (
          <div aria-label="Loading history" className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="bg-ink/5 h-20 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="border-ink/20 bg-surface/50 rounded-lg border border-dashed px-6 py-12 text-center">
            <Activity
              aria-hidden="true"
              className="text-forest/60 mx-auto"
              size={27}
            />
            <p className="mt-3 font-semibold">Nothing logged yet</p>
            <p className="text-ink/55 mt-1 text-sm">
              Your {config.title.toLowerCase()} entries will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="border-ink/10 bg-surface flex items-start gap-3 rounded-lg border p-4 shadow-sm sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold">
                    {describeEntry(entry)}
                  </p>
                  <p className="text-ink/55 mt-1 text-sm">
                    {new Date(entry.date).toLocaleString(
                      undefined,
                      includeTime
                        ? { dateStyle: "medium", timeStyle: "short" }
                        : { dateStyle: "medium" },
                    )}
                  </p>
                  {entry.note && (
                    <p className="text-ink/70 mt-2 text-sm break-words">
                      {entry.note}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => beginEdit(entry)}
                    aria-label={`Edit entry from ${new Date(entry.date).toLocaleDateString()}`}
                    className="text-ink/55 hover:bg-lime/50 hover:text-ink focus-visible:outline-forest grid size-9 place-items-center rounded-lg transition focus-visible:outline focus-visible:outline-2"
                  >
                    <Pencil aria-hidden="true" size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteEntry(entry.id)}
                    aria-label={`Delete entry from ${new Date(entry.date).toLocaleDateString()}`}
                    className="text-ink/55 hover:bg-coral/10 focus-visible:outline-coral hover:text-danger grid size-9 place-items-center rounded-lg transition focus-visible:outline focus-visible:outline-2"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
