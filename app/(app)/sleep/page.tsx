import { ActivityTracker } from "@/components/activity-tracker";

export default function SleepPage() {
  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="text-forest text-sm font-bold">RECOVERY</p>
        <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
          Sleep
        </h1>
        <p className="text-ink/60 mt-3 leading-7">
          Notice the amount and quality of rest you get each night.
        </p>
      </div>
      <ActivityTracker type="SLEEP" />
    </>
  );
}
