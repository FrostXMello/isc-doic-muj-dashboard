import { notFound } from "next/navigation";

/** Renders unknown /internal/* URLs with the portal's own not-found page inside the shell. */
export default function UnknownInternalRoute() {
  notFound();
}
