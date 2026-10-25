"use client";

import { useEffect } from "react";
import { assistantOf } from "@/lib/assistant";
import { useApp } from "@/lib/store";

// Plain assistant look: game words off the screen, game-only layers hidden.
// Kept small and separate so it loads with the first screen (no flash of game words).

// Plain assistant look: game words on screen become the assistant's name, and
// XP / coin rewards are left out (they're still counted in the background,
// so switching back to the game look loses nothing).
const SENSEI = /SENSEI KAITO|Sensei Kaito|SENSEI|Sensei/g;
const REWARD = /\s*(Reward\s*)?\+\d+\s*XP(\s*·\s*\+\d+\s*🪙)?/g;
function plainText(t: string, name: string) {
  return t.replace(SENSEI, (m) => (m === m.toUpperCase() ? name.toUpperCase() : name)).replace(REWARD, "").replace(/🥷\s?/g, "");
}
export function PlainWords() {
  const { data } = useApp();
  const a = assistantOf(data.profile.settings);
  useEffect(() => {
    if (a.mode === "game") return;
    const fix = (n: Node) => {
      if (n.nodeType === 3) {
        const v = n.nodeValue ?? "";
        if (/Sensei|SENSEI|XP|🥷/.test(v)) { const w = plainText(v, a.name); if (w !== v) n.nodeValue = w; }
        return;
      }
      if (n.nodeType !== 1 || (n as Element).closest?.("input,textarea,[contenteditable]")) return;
      const walk = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
      for (let x = walk.nextNode(); x; x = walk.nextNode()) fix(x);
    };
    fix(document.body);
    const ob = new MutationObserver((ms) => { for (const m of ms) { if (m.type === "characterData") fix(m.target); else m.addedNodes.forEach(fix); } });
    ob.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => ob.disconnect();
  }, [a.mode, a.name]);
  return null;
}

/** Shows its children only with the game look on. */
export function GameOnly({ children }: { children: React.ReactNode }) {
  const { data } = useApp();
  return assistantOf(data.profile.settings).mode === "game" ? <>{children}</> : null;
}

