"use client";

import dynamic from "next/dynamic";
import { XpHeader } from "@/components/XpHeader";

// The map only runs in the browser (it needs the screen and your location).
const PlacesMap = dynamic(() => import("@/components/PlacesMap").then((m) => m.PlacesMap), {
  ssr: false,
  loading: () => <div className="h-[58dvh] rounded-2xl bg-white/5 animate-pulse" />,
});

export default function MapPage() {
  return (
    <div>
      <XpHeader title="Places" icon="🗺️" subtitle="Shrines, sights, fun and food near you, with your trips" />
      <PlacesMap />
    </div>
  );
}
