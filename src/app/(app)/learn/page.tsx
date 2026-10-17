"use client";

import { LearnToday } from "@/components/Learn";
import { Library } from "@/components/Library";
import { SkillsList } from "@/components/RealMe";
import { XpHeader } from "@/components/XpHeader";

export default function LearnPage() {
  return (
    <>
      <XpHeader title="Learning Path" icon="📖" subtitle="Knowledge is the main quest. Every day, Day 1 smarter." />
      <LearnToday />
      <Library at={() => new Date()} onLogged={() => {}} />
      <section className="card p-4 mb-4">
        <h2 className="section-title mb-2">🧠 Skills: noob to expert</h2>
        <SkillsList />
      </section>
    </>
  );
}
