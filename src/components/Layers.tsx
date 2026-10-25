"use client";

import dynamic from "next/dynamic";

// Everything that floats over the pages (watchers, pop-ups, sheets) loads just
// after the page has drawn, in its own pieces, instead of with every page.
// The first screen comes up much sooner on slow phones and tablets.

const lazy = <P,>(load: () => Promise<React.ComponentType<P>>) => dynamic(load, { ssr: false, loading: () => null });

export const DetailsHost = lazy(() => import("@/components/Details").then((m) => m.DetailsHost));
export const SummaryHost = lazy(() => import("@/components/Summary").then((m) => m.SummaryHost));
export const AlarmLayer = lazy(() => import("@/components/AlarmLayer").then((m) => m.AlarmLayer));
export const BodyCareWatcher = lazy(() => import("@/components/tools/BodyCare").then((m) => m.BodyCareWatcher));
export const CelebrationLayer = lazy(() => import("@/components/Celebration").then((m) => m.CelebrationLayer));
export const DoingTray = lazy(() => import("@/components/Doing").then((m) => m.DoingTray));
export const Popper = lazy(() => import("@/components/Coach").then((m) => m.Popper));
export const BattleWatcher = lazy(() => import("@/components/RealMe").then((m) => m.BattleWatcher));
export const ReminderWatcher = lazy(() => import("@/components/tools/Insights").then((m) => m.ReminderWatcher));
export const PushSync = lazy(() => import("@/components/Push").then((m) => m.PushSync));
export const StudyWall = lazy(() => import("@/components/StrictStudy").then((m) => m.StudyWall));
export const BottleWatcher = lazy(() => import("@/components/FoodPlus").then((m) => m.BottleWatcher));
export const PaydayWatcher = lazy(() => import("@/components/Money").then((m) => m.PaydayWatcher));
export const GameWatcher = lazy(() => import("@/components/GameWatcher").then((m) => m.GameWatcher));
export const SafetyLayer = lazy(() => import("@/components/Safety").then((m) => m.SafetyLayer));
export const StageIntro = lazy(() => import("@/components/StageIntro").then((m) => m.StageIntro));
export const VoiceButton = lazy(() => import("@/components/VoiceButton").then((m) => m.VoiceButton));
export const UploadHost = lazy(() => import("@/components/UploadSheet").then((m) => m.UploadHost));
export const Fab = lazy(() => import("@/components/hub/Hub").then((m) => m.Fab));
export const HubHost = lazy(() => import("@/components/hub/Hub").then((m) => m.HubHost));
export const AssistantLayer = lazy(() => import("@/components/Assistant").then((m) => m.AssistantLayer));
export const SpeechStop = lazy(() => import("@/components/Assistant").then((m) => m.SpeechStop));
export const CameraChoice = lazy(() => import("@/components/CameraChoice").then((m) => m.CameraChoice));
export const SlotHost = lazy(() => import("@/components/Blocks").then((m) => m.SlotHost));
export const PageExtras = lazy(() => import("@/components/Blocks").then((m) => m.PageExtras));
export const DayCards = lazy(() => import("@/components/DayCards").then((m) => m.DayCards));
