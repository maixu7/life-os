import { DetailsHost } from "@/components/Details";
import { SummaryHost } from "@/components/Summary";
import { AlarmLayer } from "@/components/AlarmLayer";
import { BodyCareWatcher } from "@/components/tools/BodyCare";
import { PageExtras, SlotHost } from "@/components/Blocks";
import { CelebrationLayer } from "@/components/Celebration";
import { DoingTray } from "@/components/Doing";
import { Popper } from "@/components/Coach";
import { BattleWatcher } from "@/components/RealMe";
import { ReminderWatcher } from "@/components/tools/Insights";
import { PushSync } from "@/components/Push";
import { StudyWall } from "@/components/StrictStudy";
import { BottleWatcher } from "@/components/FoodPlus";
import { PaydayWatcher } from "@/components/Money";
import { GameWatcher } from "@/components/GameWatcher";
import { Gate } from "@/components/Gate";
import { Nav } from "@/components/Nav";
import { SafetyLayer } from "@/components/Safety";
import { ResumeRoute } from "@/components/ResumeRoute";
import { StageIntro } from "@/components/StageIntro";
import { VoiceButton } from "@/components/VoiceButton";
import { Auto, EditLayer } from "@/components/EditLayer";
import { Fab, HubHost } from "@/components/hub/Hub";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Gate>
      <main className="mx-auto max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">{children}<PageExtras /></main>
      <VoiceButton />
      <Auto id="fab"><Fab /></Auto>
      <Nav />
      <Auto id="game"><GameWatcher /></Auto>
      <Auto id="resume"><ResumeRoute /></Auto>
      <Auto id="stage"><StageIntro /></Auto>
      <Auto id="popper"><Popper /></Auto>
      <Auto id="battle"><BattleWatcher /></Auto>
      <Auto id="reminders"><ReminderWatcher /></Auto>
      <Auto id="bodycare"><BodyCareWatcher /></Auto>
      <Auto id="push"><PushSync /></Auto>
      <Auto id="studywall"><StudyWall /></Auto>
      <Auto id="bottle"><BottleWatcher /></Auto>
      <Auto id="payday"><PaydayWatcher /></Auto>
      <Auto id="doing"><DoingTray /></Auto>
      <Auto id="celebrate"><CelebrationLayer /></Auto>
      <Auto id="alarm"><AlarmLayer /></Auto>
      <SlotHost />
      <DetailsHost />
      <SummaryHost />
      <SafetyLayer />
      <HubHost />
      <EditLayer />
    </Gate>
  );
}
