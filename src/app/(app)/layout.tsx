import { CelebrationLayer } from "@/components/Celebration";
import { Gate } from "@/components/Gate";
import { Nav } from "@/components/Nav";
import { VoiceButton } from "@/components/VoiceButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Gate>
      <main className="mx-auto max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">{children}</main>
      <VoiceButton />
      <Nav />
      <CelebrationLayer />
    </Gate>
  );
}
