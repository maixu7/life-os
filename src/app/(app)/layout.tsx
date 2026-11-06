import { Gate } from "@/components/Gate";
import { PageExtras, SlotHost, DetailsHost, SummaryHost, AlarmLayer, DoingTray, ReminderWatcher, PushSync, PaydayWatcher, SafetyLayer, UploadHost, HubHost, AssistantLayer, SpeechStop, CameraChoice } from "@/components/Layers";
import { Nav } from "@/components/Nav";
import { ResumeRoute } from "@/components/ResumeRoute";
import { Auto, EditLayer } from "@/components/EditLayer";
import { PlainWords } from "@/components/Plain";
import { TripBar } from "@/components/Trip";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Gate>
      <main className="mx-auto max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">{children}<PageExtras /></main>
      <Nav />
      <Auto id="resume"><ResumeRoute /></Auto>
      <Auto id="reminders"><ReminderWatcher /></Auto>
      <Auto id="push"><PushSync /></Auto>
      <Auto id="payday"><PaydayWatcher /></Auto>
      <Auto id="doing"><DoingTray /></Auto>
      <Auto id="alarm"><AlarmLayer /></Auto>
      <Auto id="assistant"><AssistantLayer /></Auto>
      <TripBar />
      <PlainWords />
      <SpeechStop />
      <CameraChoice />
      <SlotHost />
      <DetailsHost />
      <SummaryHost />
      <SafetyLayer />
      <HubHost />
      <UploadHost />
      <EditLayer />
    </Gate>
  );
}
