export type WeeklyActivity = {
  type: "WALK" | "WATER" | "SLEEP";
  value: number;
  secondaryValue: number | null;
  date: Date | string;
};

export type DailyGoals = {
  stepGoal: number;
  waterGoalMl: number;
  sleepGoalHrs: number;
};

export type DailySummary = {
  date: string;
  steps: number;
  distanceKm: number;
  waterMl: number;
  sleepHours: number;
  sleepQuality: number | null;
};

export type WeeklySummary = {
  totalSteps: number;
  averageWaterMlPerDay: number;
  averageSleepHours: number;
  streakDays: number;
};

function toDayKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function aggregateWeeklyData(
  startDate: Date,
  entries: WeeklyActivity[],
  activeDates: Array<Date | string>,
  goals: DailyGoals,
  today = new Date(),
) {
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const days: DailySummary[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      steps: 0,
      distanceKm: 0,
      waterMl: 0,
      sleepHours: 0,
      sleepQuality: null,
    };
  });
  const byDate = new Map(days.map((day) => [day.date, day]));
  const qualityByDate = new Map<string, { total: number; count: number }>();

  for (const entry of entries) {
    const day = byDate.get(toDayKey(entry.date));
    if (!day) continue;
    if (entry.type === "WALK") {
      day.steps += entry.value;
      day.distanceKm += entry.secondaryValue ?? 0;
    } else if (entry.type === "WATER") {
      day.waterMl += entry.value;
    } else {
      day.sleepHours += entry.value;
      if (entry.secondaryValue !== null) {
        const quality = qualityByDate.get(day.date) ?? { total: 0, count: 0 };
        quality.total += entry.secondaryValue;
        quality.count += 1;
        qualityByDate.set(day.date, quality);
      }
    }
  }

  for (const day of days) {
    const quality = qualityByDate.get(day.date);
    if (quality) day.sleepQuality = quality.total / quality.count;
  }

  const totalSteps = days.reduce((total, day) => total + day.steps, 0);
  const totalWater = days.reduce((total, day) => total + day.waterMl, 0);
  const sleepDays = days.filter((day) => day.sleepHours > 0);
  const totalSleep = sleepDays.reduce(
    (total, day) => total + day.sleepHours,
    0,
  );
  const active = new Set(activeDates.map(toDayKey));
  const todayKey = toDayKey(today);
  const todayDate = new Date(`${todayKey}T00:00:00.000Z`);
  const yesterday = new Date(todayDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const streakDate = active.has(todayKey)
    ? todayDate
    : active.has(toDayKey(yesterday))
      ? yesterday
      : null;
  let streakDays = 0;
  if (streakDate) {
    const cursor = new Date(streakDate);
    while (active.has(toDayKey(cursor))) {
      streakDays += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  const summary: WeeklySummary = {
    totalSteps,
    averageWaterMlPerDay: totalWater / 7,
    averageSleepHours: sleepDays.length ? totalSleep / sleepDays.length : 0,
    streakDays,
  };

  return { days, goals, summary };
}
