"use client";

import { MainActions } from "@/components/MainActions";
import { LearnToday } from "@/components/Learn";
import { StudyPlan } from "@/components/StudyPlan";
import { Library } from "@/components/Library";
import { Flashcards } from "@/components/Flashcards";
import { JlptCard } from "@/components/Jlpt";
import { MistakeNotebook } from "@/components/Mistakes";
import { PastPapers } from "@/components/PastPaper";
import { SkillsList } from "@/components/RealMe";
import Link from "next/link";
import { XpHeader } from "@/components/XpHeader";
import { Blocks } from "@/components/Blocks";
import { itemKind } from "@/lib/have";
import { useApp } from "@/lib/store";

export default function LearnPage() {
  const { data } = useApp();
  const books = data.pantry.filter((p) => p.qty > 0 && itemKind(p) === "book");
  return (
    <>
      <XpHeader title="Learning Path" icon="📖" subtitle="Knowledge is the main quest. Every day, Day 1 smarter." />
      <MainActions page="/learn" />
      <Blocks page="/learn" parts={{
        plan: <StudyPlan />,
        today: <LearnToday />,
        books: (
          <Link href="/have" className="card p-3 mb-4 block text-xs">
            📚 {books.length ? <>Books you have: <b>{books.map((b) => b.name).join(", ")}</b>. Read one today and log the pages below.</> : <>Add the books you own in What I have, and they show up here to read.</>}
          </Link>
        ),
        library: <Library at={() => new Date()} onLogged={() => {}} />,
        skills: (
          <section className="card p-4 mb-4">
            <h2 className="section-title mb-2">🧠 Skills: noob to expert</h2>
            <SkillsList />
          </section>
        ),
        cards: <Flashcards />,
        jlpt: <JlptCard />,
        mistakes: <MistakeNotebook />,
        papers: <PastPapers />,
      }} />
    </>
  );
}
