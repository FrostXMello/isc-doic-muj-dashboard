import { buildDashboardInput, type DashboardInput } from "@/lib/internal/analytics";
import { openDataContext } from "@/lib/internal/data/context";

/** Every record view the dashboard aggregates, from the request's cached data load. */
export async function getDashboardInput(): Promise<DashboardInput> {
  const { today, views } = await openDataContext();
  return buildDashboardInput(views, today);
}
