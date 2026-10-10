import { ActivityTracker } from "@/components/activity-tracker";

export default function WaterPage() {
  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="text-forest text-sm font-bold">HYDRATION</p>
        <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
          Water
        </h1>
        <p className="text-ink/60 mt-3 leading-7">
          Add a glass as you go and see how your daily intake adds up.
        </p>
      </div>
      <ActivityTracker type="WATER" />
    </>
  );
}
