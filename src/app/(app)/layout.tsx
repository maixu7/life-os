import { CelebrationLayer } from "@/components/Celebration";
import { DoingTray } from "@/components/Doing";
import { Popper } from "@/components/Coach";
import { BattleWatcher } from "@/components/RealMe";
import { ReminderWatcher } from "@/components/tools/Insights";
import { GameWatcher } from "@/components/GameWatcher";
import { Gate } from "@/components/Gate";
import { Nav } from "@/components/Nav";
import { ResumeRoute } from "@/components/ResumeRoute";
import { StageIntro } from "@/components/StageIntro";
import { VoiceButton } from "@/components/VoiceButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Gate>
      <main className="mx-auto max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">{children}</main>
      <VoiceButton />
      <Nav />
      <GameWatcher />
      <ResumeRoute />
      <StageIntro />
      <Popper />
      <BattleWatcher />
      <ReminderWatcher />
      <DoingTray />
      <CelebrationLayer />
    </Gate>
  );
}
