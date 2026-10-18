"use client";

import { useApp } from "@/lib/store";

// A small dictionary for the bottom menu and page headers: English or 日本語.
// Only these words switch; the rest of the app stays in English.

export type Lang = "en" | "ja";
export const LANGS: [Lang, string][] = [["en", "English"], ["ja", "日本語"]];

const JA: Record<string, string> = {
  // Bottom menu
  Learn: "学習", Food: "食事", Doctor: "診察", Train: "訓練", Today: "今日", Dojo: "道場", Tools: "道具", Days: "日記",
  Shop: "買物", Hero: "勇者", "My stuff": "持ち物", Base: "拠点", "Quick log": "クイック",
  // Page headers
  "Base Camp": "ベースキャンプ", "Day record": "一日の記録", "Tools & Journal": "道具と日記",
  "Hero hub": "勇者ハブ", "Control Centre": "コントロールセンター", "Daily missions": "デイリーミッション",
  "Food today": "今日の食事", "Learning today": "今日の学習", "Habit quests": "習慣クエスト", "Inbox": "受信箱",
  "Morning routine": "朝のルーティン", "Seasonal event": "季節イベント", "Rival duel": "ライバル対決", "Pinned": "ピン留め",
  "Sleep planner": "睡眠プランナー", "Day planner": "一日の計画", "Brain dump": "頭の整理", "World map": "ワールドマップ",
  "Skill tree": "スキルツリー", "Ask Sensei": "先生に聞く", "Share card": "シェアカード", "Night mode": "ナイトモード",
};

export function tr(text: string, lang: Lang | undefined) {
  if (lang !== "ja") return text;
  return JA[text] ?? JA[text.trim()] ?? text;
}
export function useT() {
  const { profile } = useApp();
  const lang = profile.settings.hub?.lang;
  return (text: string) => tr(text, lang);
}
