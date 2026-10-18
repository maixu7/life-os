"use client";

import { LearnToday } from "@/components/Learn";
import { StudyPlan } from "@/components/StudyPlan";
import { Library } from "@/components/Library";
import { SkillsList } from "@/components/RealMe";
import Link from "next/link";
import { XpHeader } from "@/components/XpHeader";
import { itemKind } from "@/lib/have";
import { useApp } from "@/lib/store";

export default function LearnPage() {
  const { data } = useApp();
  const books = data.pantry.filter((p) => p.qty > 0 && itemKind(p) === "book");
  return (
    <>
      <XpHeader title="Learning Path" icon="📖" subtitle="Knowledge is the main quest. Every day, Day 1 smarter." />
      <StudyPlan />
      <LearnToday />
      <Link href="/have" className="card p-3 mb-4 block text-xs">
        📚 {books.length ? <>Books you have: <b>{books.map((b) => b.name).join(", ")}</b>. Read one today and log the pages below.</> : <>Add the books you own in What I have, and they show up here to read.</>}
      </Link>
      <Library at={() => new Date()} onLogged={() => {}} />
      <section className="card p-4 mb-4">
        <h2 className="section-title mb-2">🧠 Skills: noob to expert</h2>
        <SkillsList />
      </section>
    </>
  );
}
