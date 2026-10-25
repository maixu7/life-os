"use client";

import { XpHeader } from "@/components/XpHeader";
import { AppSettings } from "@/components/AppSettings";

export default function SettingsPage() {
  return (
    <div>
      <XpHeader title="Settings" icon="⚙️" subtitle="Permissions, your assistant, alerts, look, security and data" />
      <AppSettings />
    </div>
  );
}
