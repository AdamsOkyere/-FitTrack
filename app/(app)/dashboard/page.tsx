import { format, startOfWeek } from "date-fns";
import { getServerSession } from "next-auth";
import { DashboardView } from "@/components/dashboard-view";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const initialWeek = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );
  return (
    <DashboardView
      initialWeek={initialWeek}
      userName={session?.user?.name?.split(" ")[0] ?? "there"}
    />
  );
}
