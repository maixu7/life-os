"use client";

import { XpHeader } from "@/components/XpHeader";
import { FitPage } from "@/components/Focus";

export default function Fit() {
  return (
    <div>
      <XpHeader title="Focus Area" icon="🎯" subtitle="Your workout, planned in your free time for the areas you choose" />
      <FitPage />
    </div>
  );
}
