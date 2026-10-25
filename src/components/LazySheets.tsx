"use client";

import dynamic from "next/dynamic";

// Big pop-ups with big built-in lists (drinks, equipment) load only when opened, so pages start faster.
export const DrinkSheet = dynamic(() => import("@/components/Drinks").then((m) => m.DrinkSheet), { ssr: false });
export const EquipmentSheet = dynamic(() => import("@/components/Equipment").then((m) => m.EquipmentSheet), { ssr: false });
