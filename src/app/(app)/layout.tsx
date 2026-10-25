import { Gate } from "@/components/Gate";
import { PageExtras, SlotHost, DetailsHost, SummaryHost, AlarmLayer, BodyCareWatcher, CelebrationLayer, DoingTray, Popper, BattleWatcher, ReminderWatcher, PushSync, StudyWall, BottleWatcher, PaydayWatcher, GameWatcher, SafetyLayer, StageIntro, VoiceButton, UploadHost, Fab, HubHost, AssistantLayer, SpeechStop, CameraChoice, DayCards } from "@/components/Layers";
import { Nav } from "@/components/Nav";
import { ResumeRoute } from "@/components/ResumeRoute";
import { Auto, EditLayer } from "@/components/EditLayer";
import { GameOnly, PlainWords } from "@/components/Plain";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Gate>
      <main className="mx-auto max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">{children}<PageExtras /></main>
      <VoiceButton />
      <Auto id="fab"><Fab /></Auto>
      <Nav />
      <GameOnly><Auto id="game"><GameWatcher /></Auto></GameOnly>
      <Auto id="resume"><ResumeRoute /></Auto>
      <GameOnly><Auto id="stage"><StageIntro /></Auto></GameOnly>
      <Auto id="popper"><Popper /></Auto>
      <GameOnly><Auto id="battle"><BattleWatcher /></Auto></GameOnly>
      <Auto id="reminders"><ReminderWatcher /></Auto>
      <Auto id="bodycare"><BodyCareWatcher /></Auto>
      <Auto id="push"><PushSync /></Auto>
      <Auto id="studywall"><StudyWall /></Auto>
      <Auto id="bottle"><BottleWatcher /></Auto>
      <Auto id="payday"><PaydayWatcher /></Auto>
      <Auto id="doing"><DoingTray /></Auto>
      <Auto id="celebrate"><CelebrationLayer /></Auto>
      <Auto id="alarm"><AlarmLayer /></Auto>
      <Auto id="assistant"><AssistantLayer /></Auto>
      <Auto id="daycards"><DayCards /></Auto>
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
