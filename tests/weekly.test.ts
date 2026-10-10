import { describe, expect, it } from "vitest";
import { aggregateWeeklyData } from "@/lib/weekly";

const goals = { stepGoal: 8000, waterGoalMl: 2000, sleepGoalHrs: 8 };

describe("aggregateWeeklyData", () => {
  it("aggregates activity totals by UTC day and averages tracked sleep nights", () => {
    const result = aggregateWeeklyData(
      new Date("2026-10-05T00:00:00.000Z"),
      [
        {
          type: "WALK",
          value: 4000,
          secondaryValue: 3,
          date: "2026-10-05T12:00:00.000Z",
        },
        {
          type: "WALK",
          value: 2000,
          secondaryValue: 1.5,
          date: "2026-10-05T17:00:00.000Z",
        },
        {
          type: "WATER",
          value: 1500,
          secondaryValue: null,
          date: "2026-10-05T13:00:00.000Z",
        },
        {
          type: "SLEEP",
          value: 7.5,
          secondaryValue: 4,
          date: "2026-10-05T12:00:00.000Z",
        },
        {
          type: "SLEEP",
          value: 6.5,
          secondaryValue: 3,
          date: "2026-10-06T12:00:00.000Z",
        },
      ],
      [],
      goals,
      new Date("2026-10-08T12:00:00.000Z"),
    );

    expect(result.days).toHaveLength(7);
    expect(result.days[0]).toMatchObject({
      steps: 6000,
      distanceKm: 4.5,
      waterMl: 1500,
      sleepHours: 7.5,
      sleepQuality: 4,
    });
    expect(result.summary.totalSteps).toBe(6000);
    expect(result.summary.averageWaterMlPerDay).toBeCloseTo(1500 / 7);
    expect(result.summary.averageSleepHours).toBe(7);
    expect(result.goals).toEqual(goals);
  });

  it("continues a streak through yesterday but not across an inactive day", () => {
    const week = new Date("2026-10-05T00:00:00.000Z");
    const continuous = aggregateWeeklyData(
      week,
      [],
      ["2026-10-06T08:00:00.000Z", "2026-10-07T08:00:00.000Z"],
      goals,
      new Date("2026-10-08T12:00:00.000Z"),
    );
    const broken = aggregateWeeklyData(
      week,
      [],
      ["2026-10-05T08:00:00.000Z", "2026-10-06T08:00:00.000Z"],
      goals,
      new Date("2026-10-08T12:00:00.000Z"),
    );

    expect(continuous.summary.streakDays).toBe(2);
    expect(broken.summary.streakDays).toBe(0);
  });
});
