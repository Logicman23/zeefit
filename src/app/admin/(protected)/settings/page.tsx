import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/guard";
import { getSettings, SETTINGS, SETTING_GROUPS } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const metadata: Metadata = {
  title: "Settings — Zee Fit Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // ADMIN only — an Editor holds neither settings:read nor settings:write.
  await requirePermission("settings:read");
  const values = await getSettings();

  return (
    <SettingsForm
      groups={SETTING_GROUPS.map((g) => ({ ...g }))}
      defs={SETTINGS.map((d) => ({ ...d }))}
      values={values}
    />
  );
}
