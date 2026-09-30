import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/internal/module-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <ModulePlaceholder moduleHref="/internal/settings" />;
}
