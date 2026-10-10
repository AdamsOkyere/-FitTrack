import { ActivityTracker } from "@/components/activity-tracker";

export default function WalkPage() {
  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="text-forest text-sm font-bold">MOVEMENT</p>
        <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
          Walk & steps
        </h1>
        <p className="text-ink/60 mt-3 leading-7">
          Keep a record of the steps you take and the distance you cover.
        </p>
      </div>
      <ActivityTracker type="WALK" />
    </>
  );
}
