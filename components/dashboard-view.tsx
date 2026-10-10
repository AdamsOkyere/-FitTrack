"use client";

import { useEffect, useState } from "react";
import { addWeeks, format, parseISO, startOfWeek } from "date-fns";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  Footprints,
  Droplets,
  Moon,
  Flame,
} from "lucide-react";
import type { DailyGoals, DailySummary, WeeklySummary } from "@/lib/weekly";

type WeeklyData = {
  days: DailySummary[];
  goals: DailyGoals;
  summary: WeeklySummary;
};

type WeeklyResult =
  | { key: string; status: "success"; data: WeeklyData }
  | { key: string; status: "error"; message: string };

function errorMessage(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("error" in payload))
    return undefined;
  const error = payload.error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return typeof error.message === "string" ? error.message : undefined;
  }
  return undefined;
}

function dayName(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
  });
}

function weekLabel(start: string) {
  const end = addWeeks(parseISO(start), 1);
  end.setDate(end.getDate() - 1);
  return `${format(parseISO(start), "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

function ProgressBar({
  value,
  goal,
  color,
}: {
  value: number;
  goal: number;
  color: string;
}) {
  const percent = goal > 0 ? Math.round((value / goal) * 100) : 0;
  return (
    <div className="mt-4">
      <div className="text-ink/55 mb-2 flex justify-between text-xs">
        <span>{percent}% of goal</span>
        <span>{goal.toLocaleString()} target</span>
      </div>
      <div
        role="progressbar"
        aria-label="Progress toward goal"
        aria-valuenow={Math.min(percent, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-ink/8 h-2 overflow-hidden rounded-full"
      >
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  icon: Icon,
  tone,
  progress,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: typeof Footprints;
  tone: string;
  progress?: { value: number; goal: number; color: string };
}) {
  return (
    <article className="border-ink/10 bg-surface rounded-lg border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-ink/60 text-sm font-semibold">{label}</p>
        <span className={`grid size-9 place-items-center rounded-lg ${tone}`}>
          <Icon aria-hidden="true" size={18} />
        </span>
      </div>
      <p className="font-display mt-4 text-3xl font-semibold">
        {value}
        <span className="text-ink/50 ml-1 text-sm font-medium">{suffix}</span>
      </p>
      {progress && <ProgressBar {...progress} />}
    </article>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="text-ink/45 grid h-[250px] place-items-center text-center text-sm">
      No {label} logged this week.
    </div>
  );
}

export function DashboardView({
  initialWeek,
  userName,
}: {
  initialWeek: string;
  userName: string;
}) {
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [weeklyResult, setWeeklyResult] = useState<WeeklyResult | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${weekStart}:${reloadCount}`;
  const loading = weeklyResult?.key !== requestKey;
  const error =
    weeklyResult?.key === requestKey && weeklyResult.status === "error"
      ? weeklyResult.message
      : "";
  const weekly =
    weeklyResult?.key === requestKey && weeklyResult.status === "success"
      ? weeklyResult.data
      : null;
  const thisWeek = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );
  const isCurrentOrFutureWeek = weekStart >= thisWeek;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/stats/weekly?start=${weekStart}`, { signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok)
          throw new Error(
            errorMessage(payload) ?? "Unable to load weekly progress.",
          );
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("data" in payload)
        ) {
          throw new Error("Weekly progress response was invalid.");
        }
        setWeeklyResult({
          key: requestKey,
          status: "success",
          data: payload.data as WeeklyData,
        });
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name !== "AbortError") {
          setWeeklyResult({
            key: requestKey,
            status: "error",
            message: cause.message,
          });
        }
      });
    return () => controller.abort();
  }, [weekStart, reloadCount, requestKey]);

  const stepTotal = weekly?.summary.totalSteps ?? 0;
  const waterAverage = weekly?.summary.averageWaterMlPerDay ?? 0;
  const sleepAverage = weekly?.summary.averageSleepHours ?? 0;
  const goals = weekly?.goals;
  const days = weekly?.days ?? [];

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-forest text-sm font-bold">YOUR WEEK, IN VIEW</p>
          <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
            Welcome back, {userName}.
          </h1>
          <p className="text-ink/60 mt-2">A little consistency adds up.</p>
        </div>
        <div className="border-ink/10 bg-surface flex items-center gap-2 rounded-lg border p-1.5">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() =>
              setWeekStart(
                format(addWeeks(parseISO(weekStart), -1), "yyyy-MM-dd"),
              )
            }
            className="text-ink/65 hover:bg-ink/5 focus-visible:outline-forest grid size-9 place-items-center rounded-lg focus-visible:outline focus-visible:outline-2"
          >
            <ArrowLeft aria-hidden="true" size={17} />
          </button>
          <span className="min-w-32 px-1 text-center text-sm font-semibold">
            {weekLabel(weekStart)}
          </span>
          <button
            type="button"
            aria-label="Next week"
            disabled={isCurrentOrFutureWeek}
            onClick={() =>
              setWeekStart(
                format(addWeeks(parseISO(weekStart), 1), "yyyy-MM-dd"),
              )
            }
            className="text-ink/65 hover:bg-ink/5 focus-visible:outline-forest grid size-9 place-items-center rounded-lg focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="border-coral/30 bg-coral/10 text-danger mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadCount((count) => count + 1)}
            className="font-bold underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}

      <section
        aria-label="Weekly summaries"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {loading ? (
          [0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-ink/5 h-36 animate-pulse rounded-lg"
            />
          ))
        ) : (
          <>
            <MetricCard
              label="Total steps"
              value={stepTotal.toLocaleString()}
              suffix="steps"
              icon={Footprints}
              tone="bg-lime/45 text-forest"
              progress={
                goals
                  ? {
                      value: stepTotal,
                      goal: goals.stepGoal * 7,
                      color: "bg-forest",
                    }
                  : undefined
              }
            />
            <MetricCard
              label="Average water / day"
              value={Math.round(waterAverage).toLocaleString()}
              suffix="ml"
              icon={Droplets}
              tone="bg-sky-100 text-sky-800"
              progress={
                goals
                  ? {
                      value: waterAverage,
                      goal: goals.waterGoalMl,
                      color: "bg-sky-600",
                    }
                  : undefined
              }
            />
            <MetricCard
              label="Average sleep"
              value={sleepAverage.toFixed(1)}
              suffix="hrs / night"
              icon={Moon}
              tone="bg-coral/15 text-coral-strong"
              progress={
                goals
                  ? {
                      value: sleepAverage,
                      goal: goals.sleepGoalHrs,
                      color: "bg-coral",
                    }
                  : undefined
              }
            />
            <MetricCard
              label="Activity streak"
              value={String(weekly?.summary.streakDays ?? 0)}
              suffix="days"
              icon={Flame}
              tone="bg-amber-100 text-amber-800"
            />
          </>
        )}
      </section>

      <section
        aria-label="Weekly charts"
        className="mt-7 grid gap-4 xl:grid-cols-2"
      >
        <article className="border-ink/10 bg-surface min-w-0 rounded-lg border p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Daily steps
              </h2>
              <p className="text-ink/50 mt-1 text-sm">
                Steps recorded each day
              </p>
            </div>
            <Footprints aria-hidden="true" className="text-forest" size={19} />
          </div>
          {loading ? (
            <div className="bg-ink/5 h-[250px] animate-pulse rounded-lg" />
          ) : days.every((day) => day.steps === 0) ? (
            <ChartEmpty label="steps" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={days}
                margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--color-chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={dayName}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-chart-muted)", fontSize: 12 }}
                />
                <YAxis
                  width={48}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-chart-muted)", fontSize: 11 }}
                />
                <Tooltip
                  labelFormatter={(label) => dayName(String(label))}
                  formatter={(value) => [
                    Number(value).toLocaleString(),
                    "Steps",
                  ]}
                />
                {goals && (
                  <ReferenceLine
                    y={goals.stepGoal}
                    stroke="var(--color-coral)"
                    strokeDasharray="4 4"
                  />
                )}
                <Bar
                  dataKey="steps"
                  fill="var(--color-chart-steps)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="border-ink/10 bg-surface min-w-0 rounded-lg border p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Water intake
              </h2>
              <p className="text-ink/50 mt-1 text-sm">
                Daily total against your goal
              </p>
            </div>
            <Droplets aria-hidden="true" className="text-sky-700" size={19} />
          </div>
          {loading ? (
            <div className="bg-ink/5 h-[250px] animate-pulse rounded-lg" />
          ) : days.every((day) => day.waterMl === 0) ? (
            <ChartEmpty label="water" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={days}
                margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--color-chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={dayName}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-chart-muted)", fontSize: 12 }}
                />
                <YAxis
                  width={48}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-chart-muted)", fontSize: 11 }}
                />
                <Tooltip
                  labelFormatter={(label) => dayName(String(label))}
                  formatter={(value) => [
                    `${Number(value).toLocaleString()} ml`,
                    "Water",
                  ]}
                />
                {goals && (
                  <ReferenceLine
                    y={goals.waterGoalMl}
                    stroke="var(--color-coral)"
                    strokeDasharray="4 4"
                  />
                )}
                <Bar
                  dataKey="waterMl"
                  fill="var(--color-chart-water)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="border-ink/10 bg-surface min-w-0 rounded-lg border p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Sleep duration
              </h2>
              <p className="text-ink/50 mt-1 text-sm">
                Hours of rest recorded each night
              </p>
            </div>
            <Moon aria-hidden="true" className="text-coral-strong" size={19} />
          </div>
          {loading ? (
            <div className="bg-ink/5 h-[250px] animate-pulse rounded-lg" />
          ) : days.every((day) => day.sleepHours === 0) ? (
            <ChartEmpty label="sleep" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={days}
                margin={{ top: 8, right: 10, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--color-chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={dayName}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-chart-muted)", fontSize: 12 }}
                />
                <YAxis
                  width={48}
                  domain={[0, 12]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-chart-muted)", fontSize: 11 }}
                />
                <Tooltip
                  labelFormatter={(label) => dayName(String(label))}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)} hrs`,
                    "Sleep",
                  ]}
                />
                {goals && (
                  <ReferenceLine
                    y={goals.sleepGoalHrs}
                    stroke="var(--color-coral)"
                    strokeDasharray="4 4"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="sleepHours"
                  stroke="var(--color-coral)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--color-coral)" }}
                  activeDot={{ r: 6 }}
                />
                <Area
                  dataKey="sleepHours"
                  fill="var(--color-coral)"
                  fillOpacity={0.08}
                  stroke="none"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </article>
      </section>
    </div>
  );
}
