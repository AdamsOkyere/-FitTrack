import { GoalSettings } from "@/components/goal-settings";

export default function SettingsPage() {
  return (
    <>
      <div className="mb-8 max-w-2xl">
        <p className="text-forest text-sm font-bold">YOUR BASELINE</p>
        <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
          Settings
        </h1>
      </div>
      <GoalSettings />
    </>
  );
}
