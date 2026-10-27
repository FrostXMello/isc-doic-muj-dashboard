import { Hero } from "@/components/hero/hero";

/** The globe drops MoUs that ended before the current year, so rebuild daily. */
export const revalidate = 86400;

export default function HomePage() {
  return <Hero />;
}
