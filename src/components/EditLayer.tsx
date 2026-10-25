"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { allPages } from "@/lib/ui";
import { AUTOS, countLook, isOff, keyOf, readPicture, scopePart, sigOf, sigPart, SKIP, textMem, origOf, wordsOf, type Added, type Look, type LookStyle } from "@/lib/look";
import { useApp } from "@/lib/store";

// ✏️ Edit mode: tap anything in the app (tiles, names, icons, pictures,
// reports, pop-ups, the menu…) and change its words, picture, colour or size,
// move it, remove it, change what it opens, or add a new button or note next
// to it. Changes live in settings.look and are laid over the screen, so the
// app keeps working as before and everything can be undone.

export const startEdit = () => window.dispatchEvent(new CustomEvent("lifeos-edit", { detail: "on" }));
export const openAutos = () => window.dispatchEvent(new CustomEvent("lifeos-edit", { detail: "auto" }));

export function useLook() {
  const { profile, saveSettings } = useApp();
  const raw = profile.settings.look;
  const look: Look = useMemo(() => raw ?? {}, [raw]);
  const save = useCallback((fn: (l: Look) => Look) => saveSettings({ look: fn(look) }), [look, saveSettings]);
  return { look, save };
}

// Switches an automatic feature off when the hero said so (App controls).
export function Auto({ id, children }: { id: string; children: React.ReactNode }) {
  const { look } = useLook();
  return isOff(look, id) ? null : <>{children}</>;
}

// ---------- Laying the changes over the screen ----------
function clearMarks() {
  document.querySelectorAll<HTMLElement>("[data-lo-mark]").forEach((el) => {
    for (const p of (el.dataset.loProps ?? "").split(",").filter(Boolean)) el.style.removeProperty(p);
    if (el instanceof HTMLImageElement && el.dataset.loSrc != null) el.src = el.dataset.loSrc;
    for (const a of ["data-lo-mark", "data-lo-props", "data-lo-hide", "data-lo-go", "data-lo-src"]) el.removeAttribute(a);
  });
  document.querySelectorAll("[data-lo-add]").forEach((el) => el.remove());
}
function setProp(el: HTMLElement, p: string, v: string) {
  el.style.setProperty(p, v, "important");
  el.dataset.loMark = "1";
  const ps = new Set((el.dataset.loProps ?? "").split(",").filter(Boolean)); ps.add(p);
  el.dataset.loProps = [...ps].join(",");
}

function applyLook(look: Look, path: string) {
  const tmap = { ...look.text?.["*"], ...look.text?.[path] };
  // Words: every piece of text on screen, pop-ups included.
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode() as Text | null; n; n = w.nextNode() as Text | null) {
    const p = n.parentElement;
    if (!p || p.closest(SKIP) || p.closest("script,style")) continue;
    const r = textMem.get(n);
    const o = origOf(n);
    const k = o.trim();
    const rep = k ? tmap[k] : undefined;
    if (rep === undefined) { if (r && n.data === r.out) n.data = r.orig; textMem.delete(n); continue; }
    const out = o.replace(k, rep);
    if (n.data !== out) n.data = out;
    textMem.set(n, { orig: o, out });
  }
  document.querySelectorAll<HTMLInputElement>("input[placeholder],textarea[placeholder]").forEach((el) => {
    if (el.closest(SKIP)) return;
    const o = el.dataset.loPh ?? el.placeholder;
    const rep = tmap[o.trim()];
    el.dataset.loPh = o;
    el.placeholder = rep ?? o;
  });

  clearMarks();
  const mine = (k: string) => { const s = scopePart(k); return s === "*" || s === path; };
  const keys = [
    ...Object.keys(look.hide ?? {}), ...Object.keys(look.img ?? {}), ...Object.keys(look.style ?? {}), ...Object.keys(look.go ?? {}),
    ...Object.keys(look.order ?? {}), ...Object.keys(look.etext ?? {}), ...(look.add ?? []).map((a) => keyOf(a.at, a.after)),
  ].filter(mine);
  const kids = Object.entries(look.order ?? {}).filter(([k]) => mine(k)).flatMap(([, v]) => v);
  if (look.pens !== "off") addPens(); else document.querySelectorAll("[data-lo-pen]").forEach((p) => p.remove());
  if (!keys.length && !(look.add ?? []).length) return;
  // One pass per tag to name every item on screen.
  const tags = new Set([...keys.map(sigPart), ...kids].map((s) => s.slice(0, s.indexOf("|"))).filter(Boolean));
  const bySig = new Map<string, HTMLElement>();
  const index = () => {
    bySig.clear();
    for (const tag of tags) {
      const seen = new Map<string, number>();
      for (const el of Array.from(document.getElementsByTagName(tag))) {
        if (el.closest(SKIP)) continue;
        const words = wordsOf(el);
        const n = seen.get(words) ?? 0; seen.set(words, n + 1);
        bySig.set(`${tag}|${words}|${n}`, el as HTMLElement);
      }
    }
  };
  index();
  const find = (k: string) => (mine(k) ? bySig.get(sigPart(k)) : undefined);

  // New buttons and notes.
  for (const a of look.add ?? []) {
    if (a.at !== "*" && a.at !== path) continue;
    const at = bySig.get(a.after);
    if (!at?.parentElement) continue;
    const el = document.createElement(a.kind === "button" ? "button" : "div");
    el.dataset.loAdd = a.id;
    el.className = a.cls || (a.kind === "button" ? "card p-3 w-full text-left font-semibold" : "card p-3 text-sm");
    el.textContent = `${a.icon ? a.icon + " " : ""}${a.name}`;
    if (a.href) el.dataset.loHref = a.href;
    at.parentElement.insertBefore(el, at.nextSibling);
    tags.add(el.tagName.toLowerCase());
  }
  if ((look.add ?? []).length) index();

  // Words changed in one exact box only.
  for (const [k, m] of Object.entries(look.etext ?? {})) {
    const el = find(k); if (!el) continue;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode() as Text | null; n; n = tw.nextNode() as Text | null) {
      if (n.parentElement?.closest(SKIP)) continue;
      const o = origOf(n), t = o.trim(), rep = t ? m[t] : undefined;
      if (rep === undefined) continue;
      const out = o.replace(t, rep);
      if (n.data !== out) n.data = out;
      textMem.set(n, { orig: o, out });
    }
  }
  for (const k of Object.keys(look.hide ?? {})) { const el = find(k); if (el) { el.dataset.loHide = "1"; el.dataset.loMark = "1"; } }
  for (const [k, s] of Object.entries(look.style ?? {})) {
    const el = find(k); if (!el) continue;
    if (s.color) setProp(el, "color", s.color);
    if (s.bg) setProp(el, "background", s.bg);
    if (s.zoom && s.zoom !== 1) setProp(el, "zoom", String(s.zoom));
  }
  for (const [k, src] of Object.entries(look.img ?? {})) {
    const el = find(k); if (!el) continue;
    const img = el instanceof HTMLImageElement ? el : el.querySelector("img");
    if (img) {
      if (img.dataset.loSrc == null) img.dataset.loSrc = img.getAttribute("src") ?? "";
      img.dataset.loMark = "1";
      img.src = src;
    } else {
      // An emoji icon becomes your picture.
      setProp(el, "background-image", `url("${src}")`);
      for (const [p, v] of [["background-size", "cover"], ["background-position", "center"], ["background-repeat", "no-repeat"], ["color", "transparent"], ["text-shadow", "none"], ["border-radius", "0.4em"], ["min-width", "1.2em"], ["min-height", "1.2em"]]) setProp(el, p, v);
    }
  }
  for (const [k, href] of Object.entries(look.go ?? {})) { const el = find(k); if (el) { el.dataset.loGo = href; el.dataset.loMark = "1"; } }
  for (const [k, list] of Object.entries(look.order ?? {})) {
    const box = find(k); if (!box) continue;
    const d = getComputedStyle(box).display;
    if (!/flex|grid/.test(d)) { setProp(box, "display", "flex"); setProp(box, "flex-direction", "column"); }
    const pos = new Map(list.map((s, i) => [s, i]));
    const rev = new Map([...bySig].map(([s, el]) => [el, s]));
    Array.from(box.children).forEach((c, i) => {
      const s = rev.get(c as HTMLElement);
      setProp(c as HTMLElement, "order", String(s != null && pos.has(s) ? pos.get(s)! : 1000 + i));
    });
  }
}

// A small ✎ on every box (cards, tiles and list rows), so each one has its own edit.
const PEN_HOSTS = ".card, main a.rounded-2xl, main button.rounded-2xl, .card li, [role=dialog] li";
function addPens() {
  document.querySelectorAll<HTMLElement>(PEN_HOSTS).forEach((el) => {
    if (el.closest(SKIP) || el.closest("nav")) return;
    const has = !!el.querySelector(":scope > [data-lo-pen]");
    if (!has) { const r = el.getBoundingClientRect(); if (r.width < 60 || r.height < 28) return; }
    if (getComputedStyle(el).position === "static") setProp(el, "position", "relative");
    if (has) return;
    const pen = document.createElement("span");
    pen.dataset.loPen = "1"; pen.dataset.noedit = "";
    pen.setAttribute("role", "button"); pen.setAttribute("aria-label", "Edit this box");
    pen.textContent = "✎";
    const cs = getComputedStyle(el);
    if (el.tagName === "LI") pen.dataset.loPenRow = "1";
    else if (cs.overflow !== "visible" || cs.overflowX !== "visible") pen.dataset.loPenIn = "1";
    el.appendChild(pen);
  });
}

// What a tap picks: the button, tile, line or picture under the finger.
const PICK = "a,button,label,li,h1,h2,h3,h4,p,img,input,textarea,select,summary,[role=button],[data-lo-add]";

export function EditLayer() {
  const { look, save } = useLook();
  const { profile } = useApp();
  const path = usePathname() || "/";
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pick, setPick] = useState<HTMLElement | null>(null);
  const [panel, setPanel] = useState<"changes" | "auto" | null>(null);
  const stack = useRef<HTMLElement[]>([]);
  const pressed = useRef<HTMLElement | null>(null);
  const lookRef = useRef(look); lookRef.current = look;
  const pathRef = useRef(path); pathRef.current = path;

  // Keep the changes on screen while React redraws things.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const obs = new MutationObserver(() => { if (!t) t = setTimeout(run, 60); });
    const opts = { childList: true, subtree: true, characterData: true };
    function run() {
      t = null;
      obs.disconnect();
      try { applyLook(lookRef.current, pathRef.current); } finally { obs.takeRecords(); obs.observe(document.body, opts); }
    }
    run();
    return () => { obs.disconnect(); if (t) clearTimeout(t); };
  }, [look, path]);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (d === "on") setEditing(true);
      if (d === "auto") setPanel("auto");
    };
    addEventListener("lifeos-edit", on);
    return () => removeEventListener("lifeos-edit", on);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("lo-editing", editing); if (!editing) setPick(null); }, [editing]);
  useEffect(() => {
    document.querySelectorAll("[data-lo-sel]").forEach((e) => e.removeAttribute("data-lo-sel"));
    if (pick) pick.dataset.loSel = "1";
  }, [pick]);

  const go = useCallback((href: string) => {
    if (/^https?:/.test(href)) window.open(href, "_blank", "noopener"); else router.push(href);
  }, [router]);

  // In edit mode a tap edits instead of acting; otherwise your links take over.
  useEffect(() => {
    const block = (e: Event) => {
      const t = e.target as Element | null;
      if (!editing || !t?.closest || t.closest(SKIP)) return;
      e.stopPropagation();
    };
    const click = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest) return;
      // This box's own ✎ (or a long press): edit just this one.
      const pen = t.closest<HTMLElement>("[data-lo-pen]");
      if (pen || pressed.current) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        const el = pen ? pen.parentElement : pressed.current;
        pressed.current = null;
        if (el) { stack.current = []; setPick(el); }
        return;
      }
      if (t.closest(SKIP)) return;
      if (editing) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        const el = (t.closest(PICK) ?? t) as HTMLElement;
        stack.current = [];
        setPick(el);
        return;
      }
      const g = t.closest<HTMLElement>("[data-lo-go],[data-lo-href]");
      if (g) { e.preventDefault(); e.stopPropagation(); go(g.dataset.loGo ?? g.dataset.loHref!); }
    };
    // Hold anything for a moment to edit only that thing (the menu keeps its own long press).
    let timer: ReturnType<typeof setTimeout> | null = null, sx = 0, sy = 0;
    const down = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (editing || !t?.closest || t.closest(SKIP) || t.closest("nav,input,textarea,select,[contenteditable]")) return;
      sx = e.clientX; sy = e.clientY;
      timer = setTimeout(() => { timer = null; pressed.current = (t.closest(PICK) ?? t) as HTMLElement; navigator.vibrate?.(30); }, 650);
    };
    const move = (e: PointerEvent) => { if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { clearTimeout(timer); timer = null; } };
    const up = () => {
      if (timer) { clearTimeout(timer); timer = null; }
      // A long press with no click after it (touch) still opens the editor.
      if (pressed.current) { const el = pressed.current; setTimeout(() => { if (pressed.current === el) { pressed.current = null; stack.current = []; setPick(el); } }, 350); }
    };
    const menu = (e: Event) => { if (pressed.current) e.preventDefault(); };
    const evs = ["pointerdown", "mousedown", "touchstart", "pointerup", "mouseup", "touchend", "contextmenu"];
    for (const ev of evs) addEventListener(ev, block, true);
    addEventListener("click", click, true);
    addEventListener("pointerdown", down, true); addEventListener("pointermove", move, true); addEventListener("pointerup", up, true); addEventListener("pointercancel", up, true);
    addEventListener("contextmenu", menu, true);
    return () => {
      for (const ev of evs) removeEventListener(ev, block, true); removeEventListener("click", click, true);
      removeEventListener("pointerdown", down, true); removeEventListener("pointermove", move, true); removeEventListener("pointerup", up, true); removeEventListener("pointercancel", up, true);
      removeEventListener("contextmenu", menu, true);
    };
  }, [editing, go]);

  const pages = allPages(profile.settings.ui);
  const host = typeof document === "undefined" ? null : document.body;
  if (!host) return null;
  return createPortal(
    <div data-noedit>
      {editing ? (
        <div className="fixed top-0 inset-x-0 z-[9999] flex items-center gap-2 bg-amber-400 text-black px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-xs font-bold shadow-lg">
          <span className="flex-1">✏️ Edit mode: tap anything to change, move, remove or add next to it</span>
          <button onClick={() => setPanel("changes")} className="rounded-full bg-black/15 px-2 py-1">📋 {countLook(look)}</button>
          <button onClick={() => setPanel("auto")} className="rounded-full bg-black/15 px-2 py-1">⚙️ Auto</button>
          <button onClick={() => setEditing(false)} className="rounded-full bg-black text-amber-300 px-3 py-1">Done</button>
        </div>
      ) : null}
      {pick && (
        <ItemSheet
          el={pick} path={path} look={look} save={save} pages={pages}
          onBigger={() => { const p = pick.parentElement; if (p && p !== document.body && !p.closest(SKIP)) { stack.current.push(pick); setPick(p); } }}
          onSmaller={stack.current.length ? () => setPick(stack.current.pop()!) : undefined}
          onClose={() => setPick(null)}
        />
      )}
      {panel === "changes" && <ChangesSheet look={look} save={save} onClose={() => setPanel(null)} />}
      {panel === "auto" && <AutoSheet look={look} save={save} onClose={() => setPanel(null)} />}
    </div>,
    host,
  );
}

function Box({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div data-noedit className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md max-h-[75dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-amber-300/40 bg-[#140c24] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold truncate">{title}</h3>
          <button aria-label="Close" onClick={onClose} className="h-8 w-8 shrink-0 rounded-full bg-white/10 text-muted">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Btn = ({ on, children, tone }: { on: () => void; children: React.ReactNode; tone?: "red" | "gold" }) => (
  <button onClick={on} className={`chip !py-1.5 text-xs ${tone === "red" ? "!border-rose-400/50 text-rose-300" : tone === "gold" ? "chip-on" : ""}`}>{children}</button>
);

type Save = (fn: (l: Look) => Look) => void;
const without = <T,>(m: Record<string, T> | undefined, k: string) => { const c = { ...m }; delete c[k]; return c; };

function ItemSheet({ el, path, look, save, pages, onBigger, onSmaller, onClose }: {
  el: HTMLElement; path: string; look: Look; save: Save; pages: { href: string; icon: string; label: string }[];
  onBigger: () => void; onSmaller?: () => void; onClose: () => void;
}) {
  const inPopup = !!el.closest("[data-overlay],[role=dialog],nav,.fixed");
  const [scope, setScope] = useState(inPopup ? "*" : path);
  const [textAll, setTextAll] = useState(false);
  const [adding, setAdding] = useState<"button" | "note" | null>(null);
  const sig = sigOf(el);
  const key = keyOf(scope, sig);
  const anyKey = (m?: Record<string, unknown>) => [keyOf(path, sig), keyOf("*", sig)].find((k) => m?.[k] !== undefined);
  const addId = el.dataset.loAdd;
  const added = addId ? look.add?.find((a) => a.id === addId) : undefined;

  // The pieces of text inside, as they were before your changes.
  const texts: string[] = [];
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode() as Text | null; n && texts.length < 24; n = w.nextNode() as Text | null) {
    if (n.parentElement?.closest(SKIP)) continue;
    const o = origOf(n).trim();
    if (o && !texts.includes(o)) texts.push(o);
  }
  if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && (el.dataset.loPh ?? el.placeholder)) texts.push((el.dataset.loPh ?? el.placeholder).trim());
  const tScope = textAll ? "*" : path;
  const eKey = [keyOf(path, sig), keyOf("*", sig)].find((k) => look.etext?.[k]) ?? key;
  const cur = (o: string) => look.etext?.[eKey]?.[o] ?? look.text?.[path]?.[o] ?? look.text?.["*"]?.[o] ?? o;
  const numeric = texts.some((t) => /\d/.test(t));
  // Only this box, unless "change everywhere" is ticked.
  const setText = (o: string, v: string) => save((l) => {
    const e = { ...l.etext };
    if (e[eKey]) { e[eKey] = without(e[eKey], o); if (!Object.keys(e[eKey]).length) delete e[eKey]; }
    if (!textAll) {
      if (v !== o) e[key] = { ...e[key], [o]: v };
      return { ...l, etext: e };
    }
    const t = { ...l.text };
    for (const s of ["*", path]) t[s] = without(t[s], o);
    if (v !== o) t[tScope] = { ...t[tScope], [o]: v };
    return { ...l, text: t, etext: e };
  });

  const hiddenKey = anyKey(look.hide);
  const styleKey = anyKey(look.style);
  const st: LookStyle = (styleKey && look.style?.[styleKey]) || {};
  const setStyle = (p: Partial<LookStyle>) => save((l) => {
    const next = { ...st, ...p };
    const s = without(l.style, styleKey ?? key);
    return { ...l, style: Object.values(next).some((v) => v !== undefined && v !== 1) ? { ...s, [key]: next } : s };
  });
  const imgKey = anyKey(look.img);
  const goKey = anyKey(look.go);
  const hasPic = el instanceof HTMLImageElement || !!el.querySelector("img") || (texts.length === 1 && [...texts[0]].length <= 3);

  const move = (dir: -1 | 1) => {
    const box = el.parentElement;
    if (!box) return;
    const items = Array.from(box.children).filter((c) => !c.closest(SKIP)) as HTMLElement[];
    const ordered = items.map((c, i) => ({ c, o: Number(c.style.order || 0) || i })).sort((a, b) => a.o - b.o).map((x) => x.c);
    const i = ordered.indexOf(el), j = i + dir;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    const boxKey = keyOf(scope, sigOf(box));
    const list = ordered.map((c) => sigOf(c));
    save((l) => ({ ...l, order: { ...without(without(l.order, keyOf(path, sigOf(box))), keyOf("*", sigOf(box))), [boxKey]: list } }));
  };
  const resetAll = () => save((l) => {
    const ks = [keyOf(path, sig), keyOf("*", sig)];
    const strip = <T,>(m?: Record<string, T>) => { const c = { ...m }; ks.forEach((k) => delete c[k]); return c; };
    const t = { ...l.text };
    for (const s of ["*", path]) { t[s] = { ...t[s] }; texts.forEach((o) => delete t[s][o]); }
    return { ...l, text: t, hide: strip(l.hide), img: strip(l.img), style: strip(l.style), go: strip(l.go) };
  });
  const pickPic = async (f?: File) => { if (f) { const src = await readPicture(f); save((l) => ({ ...l, img: { ...without(l.img, imgKey ?? key), [key]: src } })); } };

  const words = wordsOf(el).replace(/^add:.*/, added?.name ?? "").slice(0, 40);
  return (
    <Box title={`✏️ ${words || el.tagName.toLowerCase()}`} onClose={onClose}>
      <div className="flex flex-wrap gap-1.5">
        <Btn on={onBigger}>⬆ Pick the bigger part</Btn>
        {onSmaller && <Btn on={onSmaller}>⬇ Back to smaller</Btn>}
      </div>
      <div className="flex gap-1.5 text-xs">
        <span className="text-muted self-center">Apply on:</span>
        <Btn on={() => setScope(path)} tone={scope === path ? "gold" : undefined}>📄 This page</Btn>
        <Btn on={() => setScope("*")} tone={scope === "*" ? "gold" : undefined}>🌍 Every page</Btn>
      </div>

      {added ? <AddedEdit a={added} save={save} pages={pages} /> : texts.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between"><h4 className="text-xs font-bold text-muted">✍️ Words and icons</h4>
            <label className="text-[11px] text-muted flex items-center gap-1"><input type="checkbox" checked={textAll} onChange={(e) => setTextAll(e.target.checked)} /> also change it everywhere else</label></div>
          <p className="text-[11px] text-muted">Changes only this box{textAll ? ", and the same words everywhere else" : ""}.{numeric ? " This changes how it looks here. To change a real price, amount or time, tap the item itself and use its own edit." : ""}</p>
          {texts.map((o) => <TextRow key={o} orig={o} value={cur(o)} onSave={(v) => setText(o, v)} />)}
        </section>
      )}

      {hasPic && !added && (
        <section className="flex flex-wrap items-center gap-1.5">
          <h4 className="text-xs font-bold text-muted w-full">🖼 Picture or icon</h4>
          <label className="chip !py-1.5 text-xs cursor-pointer">📷 Use my photo<input type="file" accept="image/*" className="hidden" onChange={(e) => pickPic(e.target.files?.[0])} /></label>
          {imgKey && <Btn on={() => save((l) => ({ ...l, img: without(l.img, imgKey) }))}>↩ Old picture</Btn>}
        </section>
      )}

      <section className="flex flex-wrap items-center gap-1.5">
        <h4 className="text-xs font-bold text-muted w-full">🎨 Colour and size</h4>
        <label className="chip !py-1 text-xs">Text <input type="color" value={st.color ?? "#ffffff"} onChange={(e) => setStyle({ color: e.target.value })} className="h-5 w-6 bg-transparent" /></label>
        <label className="chip !py-1 text-xs">Back <input type="color" value={st.bg ?? "#140c24"} onChange={(e) => setStyle({ bg: e.target.value })} className="h-5 w-6 bg-transparent" /></label>
        <Btn on={() => setStyle({ zoom: Math.max(0.5, +((st.zoom ?? 1) - 0.1).toFixed(2)) })}>A−</Btn>
        <Btn on={() => setStyle({ zoom: Math.min(3, +((st.zoom ?? 1) + 0.1).toFixed(2)) })}>A＋</Btn>
        {styleKey && <Btn on={() => save((l) => ({ ...l, style: without(l.style, styleKey) }))}>↩</Btn>}
      </section>

      <section className="flex flex-wrap items-center gap-1.5">
        <h4 className="text-xs font-bold text-muted w-full">↕️ Position</h4>
        <Btn on={() => move(-1)}>⬆ Move up / left</Btn>
        <Btn on={() => move(1)}>⬇ Move down / right</Btn>
      </section>

      {!added && (
        <section className="space-y-1.5">
          <h4 className="text-xs font-bold text-muted">🔗 What a tap opens</h4>
          <GoPick value={goKey ? look.go![goKey] : ""} pages={pages} onPick={(v) => save((l) => { const g = without(l.go, goKey ?? key); return { ...l, go: v ? { ...g, [key]: v } : g }; })} />
        </section>
      )}

      <section className="flex flex-wrap gap-1.5">
        <h4 className="text-xs font-bold text-muted w-full">＋ Add next to it</h4>
        <Btn on={() => setAdding("button")}>＋ New button</Btn>
        <Btn on={() => setAdding("note")}>＋ New note</Btn>
      </section>
      {adding && <NewThing kind={adding} pages={pages} onAdd={(a) => {
        save((l) => ({ ...l, add: [...(l.add ?? []), { ...a, id: Math.random().toString(36).slice(2, 9), at: scope, after: sig, cls: a.kind === "button" && /^(A|BUTTON)$/.test(el.tagName) ? el.className : undefined }] }));
        setAdding(null);
      }} />}

      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/10">
        {added
          ? <Btn tone="red" on={() => { save((l) => ({ ...l, add: (l.add ?? []).filter((a) => a.id !== added.id) })); onClose(); }}>🗑 Delete this</Btn>
          : hiddenKey
            ? <Btn tone="gold" on={() => save((l) => ({ ...l, hide: without(l.hide, hiddenKey) }))}>👁 Bring it back</Btn>
            : <Btn tone="red" on={() => { save((l) => ({ ...l, hide: { ...l.hide, [key]: true } })); onClose(); }}>🗑 Remove {scope === "*" ? "everywhere" : "from this page"}</Btn>}
        {!added && <Btn on={resetAll}>↩ Undo all my changes here</Btn>}
      </div>
      <p className="text-[11px] text-muted">Removed things stay faint in edit mode so you can bring them back. Your records are never deleted from here.</p>
    </Box>
  );
}

function TextRow({ orig, value, onSave }: { orig: string; value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div className="flex items-center gap-1.5">
      <input value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onSave(v)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className="input !py-1.5 text-sm flex-1 min-w-0" />
      {value !== orig && <button onClick={() => onSave(orig)} title={`Back to “${orig}”`} className="chip !py-1 text-xs">↩</button>}
    </div>
  );
}

function GoPick({ value, pages, onPick }: { value: string; pages: { href: string; icon: string; label: string }[]; onPick: (v: string) => void }) {
  const [url, setUrl] = useState(/^https?:/.test(value) ? value : "");
  return (
    <div className="flex flex-wrap gap-1.5">
      <select value={/^https?:/.test(value) ? "url" : value} onChange={(e) => e.target.value !== "url" && onPick(e.target.value)} className="input !py-1.5 text-sm flex-1 min-w-0">
        <option value="">As the app does now</option>
        {pages.map((p) => <option key={p.href} value={p.href}>{p.icon} {p.label}</option>)}
        <option value="url">🌐 A web link…</option>
      </select>
      <input value={url} onChange={(e) => setUrl(e.target.value)} onBlur={() => url && onPick(/^https?:/.test(url) ? url : `https://${url}`)} placeholder="or paste a web link" className="input !py-1.5 text-sm flex-1 min-w-0" />
    </div>
  );
}

function NewThing({ kind, pages, onAdd }: { kind: "button" | "note"; pages: { href: string; icon: string; label: string }[]; onAdd: (a: Pick<Added, "kind" | "icon" | "name" | "href">) => void }) {
  const [icon, setIcon] = useState(kind === "button" ? "⭐" : "📝");
  const [name, setName] = useState("");
  const [href, setHref] = useState("");
  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-1.5">
        <input value={icon} onChange={(e) => setIcon(e.target.value)} className="input !py-1.5 w-14 text-center" aria-label="Icon" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "button" ? "Button name" : "Your note"} className="input !py-1.5 flex-1 min-w-0" />
      </div>
      {kind === "button" && <GoPick value={href} pages={pages} onPick={setHref} />}
      <button disabled={!name.trim()} onClick={() => onAdd({ kind, icon, name: name.trim(), href: href || undefined })} className="btn-primary w-full !py-2 text-sm disabled:opacity-40">Add</button>
    </div>
  );
}

function AddedEdit({ a, save, pages }: { a: Added; save: Save; pages: { href: string; icon: string; label: string }[] }) {
  const put = (p: Partial<Added>) => save((l) => ({ ...l, add: (l.add ?? []).map((x) => (x.id === a.id ? { ...x, ...p } : x)) }));
  return (
    <section className="space-y-1.5">
      <div className="flex gap-1.5">
        <TextRow orig={a.icon} value={a.icon} onSave={(icon) => put({ icon })} />
        <TextRow orig={a.name} value={a.name} onSave={(name) => put({ name })} />
      </div>
      {a.kind === "button" && <GoPick value={a.href ?? ""} pages={pages} onPick={(href) => put({ href })} />}
    </section>
  );
}

function ChangesSheet({ look, save, onClose }: { look: Look; save: Save; onClose: () => void }) {
  const label = (k: string) => { const s = sigPart(k).split("|"); return `${s[1] || s[0]}${scopePart(k) === "*" ? " · every page" : ` · ${scopePart(k)}`}`; };
  const rows: [string, string, () => void][] = [
    ...Object.entries(look.text ?? {}).flatMap(([s, m]) => Object.entries(m).map(([o, v]) => [`✍️ “${o}” → “${v}”${s === "*" ? "" : ` · ${s}`}`, "Undo", () => save((l) => ({ ...l, text: { ...l.text, [s]: without(l.text?.[s], o) } }))] as [string, string, () => void])),
    ...Object.entries(look.etext ?? {}).flatMap(([k, m]) => Object.entries(m).map(([o, v]) => [`✍️ “${o}” → “${v}” · only ${label(k)}`, "Undo", () => save((l) => { const e = { ...l.etext, [k]: without(l.etext?.[k], o) }; if (!Object.keys(e[k]).length) delete e[k]; return { ...l, etext: e }; })] as [string, string, () => void])),
    ...Object.keys(look.hide ?? {}).map((k) => [`🗑 ${label(k)}`, "Bring back", () => save((l) => ({ ...l, hide: without(l.hide, k) }))] as [string, string, () => void]),
    ...Object.keys(look.img ?? {}).map((k) => [`🖼 ${label(k)}`, "Undo", () => save((l) => ({ ...l, img: without(l.img, k) }))] as [string, string, () => void]),
    ...Object.keys(look.style ?? {}).map((k) => [`🎨 ${label(k)}`, "Undo", () => save((l) => ({ ...l, style: without(l.style, k) }))] as [string, string, () => void]),
    ...Object.keys(look.go ?? {}).map((k) => [`🔗 ${label(k)} → ${look.go![k]}`, "Undo", () => save((l) => ({ ...l, go: without(l.go, k) }))] as [string, string, () => void]),
    ...Object.keys(look.order ?? {}).map((k) => [`↕️ Order of ${label(k)}`, "Undo", () => save((l) => ({ ...l, order: without(l.order, k) }))] as [string, string, () => void]),
    ...(look.add ?? []).map((a) => [`＋ ${a.icon} ${a.name}${a.at === "*" ? " · every page" : ` · ${a.at}`}`, "Delete", () => save((l) => ({ ...l, add: (l.add ?? []).filter((x) => x.id !== a.id) }))] as [string, string, () => void]),
    ...Object.keys(look.auto ?? {}).map((id) => [`⚙️ Off: ${AUTOS.find((x) => x[0] === id)?.[1] ?? id}`, "Turn on", () => save((l) => ({ ...l, auto: without(l.auto, id) }))] as [string, string, () => void]),
  ];
  return (
    <Box title={`📋 All my changes (${rows.length})`} onClose={onClose}>
      {rows.length === 0 && <p className="text-sm text-muted">Nothing changed yet. Tap anything in edit mode to change it.</p>}
      {rows.map(([t, b, fn], i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="flex-1 min-w-0 break-words">{t}</span>
          <button onClick={fn} className="chip !py-1 text-xs shrink-0">{b}</button>
        </div>
      ))}
      {rows.length > 0 && <button onClick={() => confirm("Undo every change and show the app as it came?") && save((l) => ({ pens: l.pens }))} className="chip !py-1.5 text-xs !border-rose-400/50 text-rose-300">↩ Undo everything</button>}
    </Box>
  );
}

function AutoSheet({ look, save, onClose }: { look: Look; save: Save; onClose: () => void }) {
  return (
    <Box title="⚙️ Automatic or manual" onClose={onClose}>
      <p className="text-xs text-muted">Turn off anything the app does by itself. Turned off means it only happens when you do it.</p>
      {AUTOS.map(([id, name, what]) => {
        const on = !isOff(look, id);
        return (
          <button key={id} onClick={() => save((l) => ({ ...l, auto: on ? { ...l.auto, [id]: "off" } : without(l.auto, id) }))} className="w-full flex items-center gap-2 text-left">
            <span className="flex-1 min-w-0"><span className="block text-sm font-semibold">{name}</span><span className="block text-[11px] text-muted">{what}</span></span>
            <span className={`chip !py-1 text-xs shrink-0 ${on ? "chip-on" : ""}`}>{on ? "Auto" : "Off"}</span>
          </button>
        );
      })}
      <button onClick={() => save((l) => ({ ...l, pens: l.pens === "off" ? undefined : "off" }))} className="w-full flex items-center gap-2 text-left border-t border-white/10 pt-2">
        <span className="flex-1 text-sm font-semibold">✎ Small edit pen on every box</span>
        <span className={`chip !py-1 text-xs ${look.pens !== "off" ? "chip-on" : ""}`}>{look.pens !== "off" ? "Shown" : "Hidden"}</span>
      </button>
      <p className="text-[11px] text-muted">Daily mission steps, their times and names are edited by tapping them in the Daily mission. Hold any word, icon or button for a moment to edit just that one.</p>
    </Box>
  );
}
