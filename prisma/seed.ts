import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const stepsByDay = [
  6840, 9210, 7420, 11025, 8350, 12480, 5630, 7810, 10340, 8920, 11760, 6950,
  9580, 10840,
];
const sleepByDay = [
  7.2, 7.8, 6.4, 8.1, 7.5, 8.4, 6.9, 7.6, 8.0, 6.7, 7.9, 8.2, 7.1, 7.7,
];
const waterByDay = [
  [450, 600, 500],
  [500, 750, 600],
  [400, 600, 550],
  [500, 700, 650],
  [450, 650, 550],
  [600, 750, 700],
  [350, 550, 500],
  [450, 650, 600],
  [500, 700, 650],
  [450, 600, 500],
  [550, 750, 700],
  [400, 600, 550],
  [500, 700, 600],
  [550, 750, 650],
];

async function main() {
  const passwordHash = await hash("Demo1234!", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@fitness.app" },
    update: {
      name: "Taylor Morgan",
      passwordHash,
      stepGoal: 8000,
      waterGoalMl: 2000,
      sleepGoalHrs: 8,
    },
    create: {
      name: "Taylor Morgan",
      email: "demo@fitness.app",
      passwordHash,
      stepGoal: 8000,
      waterGoalMl: 2000,
      sleepGoalHrs: 8,
    },
  });

  await prisma.activityLog.deleteMany({ where: { userId: user.id } });
  const activities: Prisma.ActivityLogCreateManyInput[] = [];
  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = new Date(todayUtc);
    day.setUTCDate(todayUtc.getUTCDate() - offset);
    const index = 13 - offset;
    const dayAtNoon = new Date(
      Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 12),
    );
    const steps = stepsByDay[index] ?? 8000;
    const sleep = sleepByDay[index] ?? 7.5;

    activities.push({
      userId: user.id,
      type: "WALK",
      value: steps,
      secondaryValue: Number((steps * 0.0007).toFixed(2)),
      date: dayAtNoon,
      note: index % 4 === 0 ? "Lunch break loop" : null,
    });
    activities.push({
      userId: user.id,
      type: "SLEEP",
      value: sleep,
      secondaryValue: [2, 3, 4, 5, 4, 3, 4, 5, 3, 4, 5, 4, 3, 4][index] ?? 4,
      date: dayAtNoon,
      note: index % 5 === 1 ? "Woke up once" : null,
    });

    const waterAmounts = waterByDay[index] ?? [500, 650, 600];
    for (const [waterIndex, amount] of waterAmounts.entries()) {
      const hour = [8, 13, 18][waterIndex] ?? 12;
      activities.push({
        userId: user.id,
        type: "WATER",
        value: amount,
        date: new Date(
          Date.UTC(
            day.getUTCFullYear(),
            day.getUTCMonth(),
            day.getUTCDate(),
            hour,
          ),
        ),
      });
    }
  }

  await prisma.activityLog.createMany({ data: activities });
  console.log(
    `Seeded demo account ${user.email} with ${activities.length} activity entries.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
