"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { OwnBlock } from "@/components/Blocks";
import { XpHeader } from "@/components/XpHeader";
import { arrange, customHref } from "@/lib/layout";
import { useApp } from "@/lib/store";

// A page the hero made in Control Centre, built from their own blocks.
export default function CustomPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useApp();
  const ui = profile.settings.ui;
  const href = customHref(id);
  const page = ui?.custom?.find((c) => c.id === id);
  if (!page) return <><XpHeader title="Page not found" icon="❓" /><Link href="/control?tab=new" className="card p-4 block text-sm">This page was deleted. Make a new one in 🎛️ Control Centre →</Link></>;
  const blocks = arrange(ui, href).filter((x) => x.own);
  return (
    <>
      <XpHeader title={page.label} icon={page.icon} subtitle="Your own page" />
      {blocks.map(({ own }) => <OwnBlock key={own!.id} b={own!} />)}
      <Link href={`/control?page=${encodeURIComponent(href)}`} className="btn-ghost w-full border border-dashed border-white/25 text-sm block text-center">{blocks.length ? "🎛️ Edit this page" : "＋ Add your first block (buttons, checklist, counter, note)"}</Link>
    </>
  );
}
