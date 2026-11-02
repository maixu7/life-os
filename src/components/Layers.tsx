"use client";

import dynamic from "next/dynamic";

// Everything that floats over the pages (watchers, pop-ups, sheets) loads just
// after the page has drawn, in its own pieces, instead of with every page.
// The first screen comes up much sooner on slow phones and tablets.

const lazy = <P,>(load: () => Promise<React.ComponentType<P>>) => dynamic(load, { ssr: false, loading: () => null });

export const DetailsHost = lazy(() => import("@/components/Details").then((m) => m.DetailsHost));
export const SummaryHost = lazy(() => import("@/components/Summary").then((m) => m.SummaryHost));
export const AlarmLayer = lazy(() => import("@/components/AlarmLayer").then((m) => m.AlarmLayer));
export const DoingTray = lazy(() => import("@/components/Doing").then((m) => m.DoingTray));
export const ReminderWatcher = lazy(() => import("@/components/tools/Insights").then((m) => m.ReminderWatcher));
export const PushSync = lazy(() => import("@/components/Push").then((m) => m.PushSync));
export const PaydayWatcher = lazy(() => import("@/components/Money").then((m) => m.PaydayWatcher));
export const SafetyLayer = lazy(() => import("@/components/Safety").then((m) => m.SafetyLayer));
export const UploadHost = lazy(() => import("@/components/UploadSheet").then((m) => m.UploadHost));
export const HubHost = lazy(() => import("@/components/hub/Hub").then((m) => m.HubHost));
export const AssistantLayer = lazy(() => import("@/components/Assistant").then((m) => m.AssistantLayer));
export const SpeechStop = lazy(() => import("@/components/Assistant").then((m) => m.SpeechStop));
export const CameraChoice = lazy(() => import("@/components/CameraChoice").then((m) => m.CameraChoice));
export const SlotHost = lazy(() => import("@/components/Blocks").then((m) => m.SlotHost));
export const PageExtras = lazy(() => import("@/components/Blocks").then((m) => m.PageExtras));
