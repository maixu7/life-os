"use client";

import { WhenPicker } from "@/components/When";
import { useEffect, useMemo, useRef, useState } from "react";
import { dtLocal, Sheet } from "@/components/Sheet";
import { XpHeader } from "@/components/XpHeader";
import { gold } from "@/lib/economy";
import { emojiFor } from "@/lib/emoji";
import { Pic } from "@/components/Pic";
import { line } from "@/lib/lore";
import { useCustomItems } from "@/lib/store";
import { UNITS, useApp, type PantryItem, type ShopItem } from "@/lib/store";
import { deletePhoto, getPhoto, putPhoto } from "@/lib/vault";
import { AutoGrocery, CategoryBudgets, MoneyTools, ReceiptSheet } from "@/components/Money";
import { BIG_TILE } from "@/components/MainActions";
import { aiPhotos, readProduct } from "@/lib/foodai";
import { loadImage, smallPhoto } from "@/lib/foodphoto";
import { SnapChoice, useRememberSnap, type Pick } from "@/components/SnapChoice";
import { goods } from "@/lib/goods";

type Tab = "list" | "storage" | "history" | "rewards" | "photos";
const monthOf = (iso: string) => iso.slice(0, 7);
const shiftMonth = (m: string, n: number) => {
  const d = new Date(`${m}-01T12:00`);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 7);
};
const sameThing = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function ShopPage() {
  const { session, data, update, profile, logActivity, celebrate } = useApp();
  const cur = profile.settings.currency;
  const money = (n: number | null | undefined) => (n == null ? "-" : `${cur} ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  const [tab, setTab] = useState<Tab>("list");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [editItem, setEditItem] = useState<ShopItem | "new" | null>(null);
  const [buying, setBuying] = useState<ShopItem | null>(null);
  const [editPantry, setEditPantry] = useState<PantryItem | "new" | null>(null);
  const [priceOf, setPriceOf] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [compare, setCompare] = useState<string[]>([]);
  const [quick, setQuick] = useState("");
  const [receipt, setReceipt] = useState(false);
  const [snapMsg, setSnapMsg] = useState("");
  const snapRef = useRef<HTMLInputElement>(null);
  const quickRef = useRef<HTMLInputElement>(null);

  const toBuy = useMemo(() => data.shopping.filter((i) => i.status === "to_buy").sort((a, b) => a.created_at.localeCompare(b.created_at)), [data.shopping]);
  const bought = useMemo(
    () => data.shopping.filter((i) => i.status === "purchased" && i.purchased_at).sort((a, b) => b.purchased_at!.localeCompare(a.purchased_at!)),
    [data.shopping],
  );

  useEffect(() => {
    let alive = true;
    const made: string[] = [];
    (async () => {
      const out: Record<string, string> = {};
      for (const i of data.shopping) {
        if (!i.photo_id) continue;
        const blob = await getPhoto(session, i.photo_id).catch(() => null);
        if (blob) made.push((out[i.photo_id] = URL.createObjectURL(blob)));
      }
      if (alive) setUrls(out);
    })();
    return () => {
      alive = false;
      made.forEach(URL.revokeObjectURL);
    };
  }, [data.shopping, session]);

  const lastBuy = (name: string) => bought.find((b) => sameThing(b.name, name));
  const listTotal = toBuy.reduce((s, i) => s + Number(i.price ?? 0), 0);

  const quickAdd = () => {
    const name = quick.trim();
    if (!name) return;
    const last = lastBuy(name);
    const item: ShopItem = {
      id: crypto.randomUUID(), name, emoji: emojiFor(name, "🛍️"), qty: last?.qty ?? 1, unit: last?.unit ?? "pcs",
      price: last?.price ?? null, category: last?.category ?? "", note: "", photo_id: null, status: "to_buy", purchased_at: null,
      created_at: new Date().toISOString(),
    };
    update((d) => ({ ...d, shopping: [...d.shopping, item] }));
    setQuick("");
  };

  // Snap a product (or its empty packet): the app reads what it is and adds it
  // to the list with the photo, so next time it's easy to find in the shop.
  // First the app's own list (on the phone, no AI); AI only from its button.
  const [shot, setShot] = useState<{ file: File; imgs: HTMLImageElement[]; small: string } | null>(null);
  const rememberAI = useRememberSnap();
  const picks = useMemo<Pick[]>(() => [
    ...[...new Set(data.shopping.map((s) => s.name))].map((n) => ({ name: n, emoji: emojiFor(n, "🛍️"), sub: "bought before", mine: true })),
    ...data.pantry.map((p) => ({ name: p.name, emoji: p.emoji, ja: p.ja, sub: "in What I have", mine: true })),
    ...goods().map((g) => ({ name: g.name, emoji: g.emoji, ja: g.ja || undefined, sub: g.cat })),
  ], [data.shopping, data.pantry]);
  // One photo or several (front and back) of the same thing.
  const snapAdd = async (files: File[]) => {
    const imgs = await Promise.all(files.map(loadImage));
    setShot({ file: files[0], imgs, small: smallPhoto(imgs[0], 160) });
  };
  const addSnapped = async (file: File, name: string, p?: Awaited<ReturnType<typeof readProduct>>["product"] | null, error?: string) => {
    const photo_id = crypto.randomUUID();
    await putPhoto(session, photo_id, file).catch(() => {});
    name = name || "Photo item";
    const last = lastBuy(name);
    const item: ShopItem = {
      id: crypto.randomUUID(), name, emoji: p?.emoji || emojiFor(name, "🛍️"), qty: last?.qty ?? 1, unit: last?.unit ?? (p?.unit || "pcs"),
      price: last?.price ?? null, category: p?.kind ?? last?.category ?? "", note: [p?.brand, p?.name_ja].filter(Boolean).join(" · "), photo_id, status: "to_buy", purchased_at: null,
      created_at: new Date().toISOString(),
    };
    update((d) => ({ ...d, shopping: [...d.shopping, item] }));
    if (name !== "Photo item") setSnapMsg(`📷 Added ${item.emoji} ${name}${item.note ? ` (${item.note})` : ""}. Tap it to change anything.`);
    else { setSnapMsg(`Couldn't tell what it is${error ? ` (${error})` : ""}. I added it with the photo; type its name.`); setEditItem(item); }
  };
  const askAI = async (file: File, imgs: HTMLImageElement[]) => {
    setTab("list"); setSnapMsg("🤖 AI is reading what this is…");
    const r = await readProduct(session, aiPhotos(imgs), "something I want to buy");
    const p = r.product?.found ? r.product : null;
    if (p?.name) rememberAI(p.name, p.emoji);
    await addSnapped(file, p?.name ?? "", p, r.error);
  };

  // Month allowance
  const allowance = profile.settings.allowances[month] ?? profile.settings.budget_monthly;
  const monthBuys = bought.filter((b) => monthOf(b.purchased_at!) === month);
  const spent = monthBuys.reduce((s, b) => s + Number(b.price ?? 0), 0);
  const left = allowance - spent;
  const byDay = monthBuys.reduce<Record<string, ShopItem[]>>((m, b) => {
    (m[b.purchased_at!.slice(0, 10)] ??= []).push(b);
    return m;
  }, {});
  const withPhotos = data.shopping.filter((i) => i.photo_id && urls[i.photo_id]);

  return (
    <>
      <XpHeader title="Shopping" icon="🛒" subtitle="Your shopping list, what you bought, and your money" />
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button onClick={() => { setTab("list"); setTimeout(() => quickRef.current?.focus(), 50); }} className={BIG_TILE}><span className="text-4xl leading-none">🛒</span><span className="font-black text-sm leading-tight">Shopping list</span><span className="text-[10px] text-muted leading-tight">{toBuy.length} to buy</span></button>
        <button onClick={() => snapRef.current?.click()} className={BIG_TILE}><span className="text-4xl leading-none">📷</span><span className="font-black text-sm leading-tight">Snap to add</span><span className="text-[10px] text-muted leading-tight">Photo of what you need</span></button>
        <button onClick={() => setReceipt(true)} className={BIG_TILE}><span className="text-4xl leading-none">🧾</span><span className="font-black text-sm leading-tight">Scan receipt</span><span className="text-[10px] text-muted leading-tight">Ticks what you bought</span></button>
      </div>
      <input ref={snapRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) snapAdd(f); }} />
      {shot && <SnapChoice photo={shot.small} img={shot.imgs} list={picks} what="item" kind="item" laterType="shop" onClose={() => setShot(null)}
        onAI={() => askAI(shot.file, shot.imgs)} onPick={(p) => { setTab("list"); addSnapped(shot.file, p.name); }} />}
      {receipt && <ReceiptSheet onClose={() => setReceipt(false)} />}
      {snapMsg && <p className="card p-3 mb-3 text-xs">{snapMsg}</p>}


      <div className="grid grid-cols-5 gap-1 p-1 mb-4 rounded-2xl bg-white/5">
        {([["list", "🛒 Supplies"], ["storage", "🎒 Bag"], ["history", "🧾 Ledger"], ["rewards", "🎁 Rewards"], ["photos", "📸 Photos"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-xl py-2 text-[11px] font-semibold transition ${tab === k ? "bg-[var(--accent2)] text-[#0b0420]" : "text-muted"}`}>{l}</button>
        ))}
      </div>

      {tab === "list" && (
        <>
          <AutoGrocery />
          <form onSubmit={(e) => { e.preventDefault(); quickAdd(); }} className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2"><Pic name={quick} emoji={quick ? emojiFor(quick, "🛍️") : "🛍️"} size={34} /></span>
              <input ref={quickRef} className="input !pl-14" placeholder="Add item, e.g. Apple" value={quick} onChange={(e) => setQuick(e.target.value)} />
            </div>
            <button className="btn-primary">Add</button>
          </form>
          <button onClick={() => setEditItem("new")} className="mb-4 text-xs text-muted">+ Add with quantity, price, photo…</button>

          {toBuy.length === 0 ? (
            <p className="card p-6 text-center text-sm text-muted">Your list is empty.</p>
          ) : (
            <section className="card divide-y divide-white/5">
              {toBuy.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-3">
                  <Pic name={i.name} emoji={i.emoji} src={i.photo_id ? urls[i.photo_id] : undefined} />
                  <button onClick={() => setEditItem(i)} className="flex-1 min-w-0 text-left">
                    <div className="font-semibold truncate">{i.name}</div>
                    <div className="text-xs text-muted truncate">
                      {i.qty} {i.unit}{i.price != null ? ` · ${money(i.price)}` : " · tap to add price"}{i.note ? ` · ${i.note}` : ""}
                    </div>
                  </button>
                  <button onClick={() => setBuying(i)} className="btn-primary !px-3 !py-1.5 text-sm">✓ Bought</button>
                </div>
              ))}
              <div className="flex justify-between p-3 text-sm">
                <span className="text-muted">{toBuy.length} items</span>
                <span className="font-bold">Estimated {money(listTotal)}</span>
              </div>
            </section>
          )}
        </>
      )}

      {tab === "storage" && (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted">What you have at home. Bought items land here.</p>
            <button onClick={() => setEditPantry("new")} className="chip chip-on shrink-0">+ Add</button>
          </div>
          {data.pantry.length === 0 ? (
            <p className="card p-6 text-center text-sm text-muted">Nothing in storage yet.</p>
          ) : (
            <section className="grid grid-cols-2 gap-2">
              {[...data.pantry].sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name)).map((p) => (
                <div key={p.id} className={`card p-3 ${p.qty <= 0 ? "opacity-50" : ""}`}>
                  <button onClick={() => setEditPantry(p)} className="flex w-full items-center gap-2 text-left">
                    <Pic name={p.name} emoji={p.emoji} size={52} />
                    <span className="min-w-0">
                      <span className="block font-semibold truncate">{p.name}</span>
                      <span className="block text-xs text-muted">{p.last_price != null ? `last ${money(p.last_price)}` : ""}</span>
                    </span>
                  </button>
                  <div className="mt-2 flex items-center justify-between">
                    <button aria-label="One less" onClick={() => update((d) => ({ ...d, pantry: d.pantry.map((x) => (x.id === p.id ? { ...x, qty: Math.max(0, +(x.qty - 1).toFixed(2)) } : x)) }))}
                      className="h-8 w-8 rounded-full bg-white/10">−</button>
                    <span className="font-bold tabular-nums">{p.qty} <span className="text-xs font-normal text-muted">{p.unit}</span></span>
                    <button aria-label="One more" onClick={() => update((d) => ({ ...d, pantry: d.pantry.map((x) => (x.id === p.id ? { ...x, qty: +(x.qty + 1).toFixed(2) } : x)) }))}
                      className="h-8 w-8 rounded-full bg-white/10">+</button>
                  </div>
                  {p.qty <= 0 && (
                    <button onClick={() => {
                      const last = lastBuy(p.name);
                      update((d) => ({ ...d, shopping: [...d.shopping, {
                        id: crypto.randomUUID(), name: p.name, emoji: p.emoji, qty: last?.qty ?? 1, unit: p.unit, price: last?.price ?? null,
                        category: last?.category ?? "", note: "", photo_id: null, status: "to_buy", purchased_at: null, created_at: new Date().toISOString(),
                      }] }));
                      setTab("list");
                    }} className="mt-2 w-full text-xs text-[var(--accent2)]">Ran out · add to list</button>
                  )}
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {tab === "history" && (
        <>
          <CategoryBudgets month={month} />
          {Object.keys(byDay).length === 0 && <p className="card p-6 text-center text-sm text-muted">No purchases this month.</p>}
          {Object.entries(byDay).map(([d, list]) => (
            <section key={d} className="mb-3">
              <h3 className="text-xs font-semibold text-muted mb-1 px-1">
                {new Date(`${d}T12:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                <span className="float-right">{money(list.reduce((s, b) => s + Number(b.price ?? 0), 0))}</span>
              </h3>
              <div className="card divide-y divide-white/5">
                {list.map((b) => (
                  <button key={b.id} onClick={() => setPriceOf(b.name)} className="flex w-full items-center gap-3 p-3 text-left">
                    <Pic name={b.name} emoji={b.emoji} size={40} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{b.name}</span>
                      <span className="block text-xs text-muted">
                        {b.qty} {b.unit} · {new Date(b.purchased_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {b.price != null && b.qty > 0 ? ` · ${money(b.price / b.qty)}/${b.unit}` : ""}
                      </span>
                    </span>
                    <span className="font-bold tabular-nums">{money(b.price)}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {tab === "rewards" && <RewardShop />}

      {tab === "photos" && (
        <>
          <p className="text-sm text-muted mb-2">Tap two photos to compare them side by side in the store.</p>
          {compare.length === 2 && (
            <div className="fixed inset-0 z-40 bg-black/90 grid grid-cols-2 gap-1 p-1" onClick={() => setCompare([])}>
              {compare.map((cid) => {
                const i = data.shopping.find((x) => x.id === cid)!;
                return (
                  <div key={cid} className="flex flex-col">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urls[i.photo_id!]} alt={i.name} className="flex-1 object-contain min-h-0" />
                    <div className="p-2 text-center text-sm">{i.name}{i.price != null && <div className="text-muted text-xs">{money(i.price)}</div>}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {withPhotos.map((i) => (
              <button key={i.id} onClick={() => setCompare(compare.includes(i.id) ? compare.filter((c) => c !== i.id) : [...compare, i.id].slice(-2))}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 ${compare.includes(i.id) ? "border-[var(--accent)]" : "border-transparent"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urls[i.photo_id!]} alt={i.name} className="h-full w-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] p-1 truncate">{i.name}</span>
              </button>
            ))}
          </div>
          {withPhotos.length === 0 && <p className="card p-6 text-center text-sm text-muted">Add a photo to an item to see it here.</p>}
        </>
      )}

      <div className="mt-4">
      <AllowanceCard month={month} setMonth={setMonth} allowance={allowance} spent={spent} left={left} money={money} />
      <MoneyTools />
      </div>

      {editItem && (
        <ItemSheet item={editItem === "new" ? null : editItem} lastBuy={lastBuy} money={money} onClose={() => setEditItem(null)}
          onSave={async (item, photo) => {
            let photo_id = item.photo_id;
            if (photo) {
              if (photo_id) await deletePhoto(session, photo_id);
              photo_id = crypto.randomUUID();
              await putPhoto(session, photo_id, photo);
            }
            const next = { ...item, photo_id };
            update((d) => ({ ...d, shopping: d.shopping.some((x) => x.id === next.id) ? d.shopping.map((x) => (x.id === next.id ? next : x)) : [...d.shopping, next] }));
            setEditItem(null);
          }}
          onDelete={async (item) => {
            if (item.photo_id) await deletePhoto(session, item.photo_id);
            update((d) => ({ ...d, shopping: d.shopping.filter((x) => x.id !== item.id), deleted: [...d.deleted, item.id] }));
            setEditItem(null);
          }} />
      )}

      {buying && (
        <BuySheet item={buying} cur={cur} onClose={() => setBuying(null)} onBuy={(qty, unit, price, at, toStorage) => {
          const nowIso = at.toISOString();
          update((d) => {
            const shopping = d.shopping.map((x) => (x.id === buying.id ? { ...x, qty, unit, price, status: "purchased" as const, purchased_at: nowIso } : x));
            if (!toStorage) return { ...d, shopping };
            const existing = d.pantry.find((p) => sameThing(p.name, buying.name) && p.unit === unit);
            const unitPrice = price != null && qty ? +(price / qty).toFixed(2) : null;
            const pantry = existing
              ? d.pantry.map((p) => (p.id === existing.id ? { ...p, qty: +(p.qty + qty).toFixed(2), last_price: unitPrice ?? p.last_price, updated_at: nowIso } : p))
              : [...d.pantry, { id: crypto.randomUUID(), name: buying.name, emoji: buying.emoji, qty, unit, last_price: unitPrice, updated_at: nowIso }];
            return { ...d, shopping, pantry };
          });
          const row = logActivity("shopping", { item: buying.name, emoji: buying.emoji, qty, unit, price }, at);
          celebrate({ title: "ITEM ACQUIRED!", subtitle: `${buying.emoji} ${qty} ${unit} ${buying.name}`, xp: row.xp });
          setBuying(null);
        }} />
      )}

      {editPantry && (
        <PantrySheet item={editPantry === "new" ? null : editPantry} onClose={() => setEditPantry(null)}
          onSave={(p) => {
            update((d) => ({ ...d, pantry: d.pantry.some((x) => x.id === p.id) ? d.pantry.map((x) => (x.id === p.id ? p : x)) : [...d.pantry, p] }));
            setEditPantry(null);
          }}
          onDelete={(p) => {
            update((d) => ({ ...d, pantry: d.pantry.filter((x) => x.id !== p.id), deleted: [...d.deleted, p.id] }));
            setEditPantry(null);
          }} />
      )}

      {priceOf && (
        <Sheet title={`${emojiFor(priceOf, "🛍️")} ${priceOf} price history`} onClose={() => setPriceOf(null)}>
          <div className="flex justify-center"><Pic name={priceOf} emoji={emojiFor(priceOf, "🛍️")} size={96} /></div>
          <div className="divide-y divide-white/5">
            {bought.filter((b) => sameThing(b.name, priceOf)).map((b) => (
              <div key={b.id} className="flex justify-between py-2 text-sm">
                <span className="text-muted">{new Date(b.purchased_at!).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                <span>{b.qty} {b.unit}</span>
                <span className="font-semibold">{money(b.price)}</span>
                <span className="text-muted w-24 text-right">{b.price != null && b.qty ? `${money(b.price / b.qty)}/${b.unit}` : ""}</span>
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </>
  );
}

function AllowanceCard({ month, setMonth, allowance, spent, left, money }: {
  month: string; setMonth: (m: string) => void; allowance: number; spent: number; left: number; money: (n: number) => string;
}) {
  const { profile, saveSettings } = useApp();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(allowance));
  const pct = allowance > 0 ? Math.min(100, (spent / allowance) * 100) : 0;
  const label = new Date(`${month}-01T12:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return (
    <section className="card p-4 mb-4 bg-gradient-to-br from-[color-mix(in_srgb,var(--accent)_18%,transparent)] to-transparent">
      <div className="flex items-center justify-between">
        <button aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))} className="btn-ghost h-8 w-8 !p-0">‹</button>
        <div className="text-center">
          <div className="text-xs text-muted">Allowance · {label}</div>
          <button onClick={() => { setVal(String(allowance)); setEditing(true); }} className="text-2xl font-black">{money(allowance)} <span className="text-sm text-muted">✎</span></button>
        </div>
        <button aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))} className="btn-ghost h-8 w-8 !p-0">›</button>
      </div>
      <div className="bar mt-3"><div style={{ width: `${pct}%`, background: left < 0 ? "#ff3b5c" : undefined }} /></div>
      <div className="mt-2 grid grid-cols-2 text-sm">
        <div><div className="text-xs text-muted">Spent</div><div className="font-bold">{money(spent)}</div></div>
        <div className="text-right"><div className="text-xs text-muted">{left >= 0 ? "Left" : "Over"}</div>
          <div className={`font-bold ${left >= 0 ? "text-[var(--accent2)]" : "text-rose-400"}`}>{money(Math.abs(left))}</div></div>
      </div>
      {allowance > 0 && pct >= 80 && (
        <p className={`mt-2 text-xs ${left < 0 ? "text-rose-400" : "text-amber-300"}`}>
          {left < 0 ? "⚠️ Over budget. Sensei: pause non-essential buys until next month." : `⚠️ ${Math.round(pct)}% used. Only buy what you need this month.`}
          {(() => { const now = new Date(); const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1; return left > 0 ? ` About ${money(left / daysLeft)} per day left.` : ""; })()}
        </p>
      )}
      {editing && (
        <Sheet title={`Allowance for ${label}`} onClose={() => setEditing(false)}>
          <input autoFocus className="input text-2xl font-bold" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => {
              saveSettings({ allowances: { ...profile.settings.allowances, [month]: Number(val) || 0 } });
              setEditing(false);
            }}>Only this month</button>
            <button className="btn-primary flex-1" onClick={() => {
              const { [month]: _drop, ...rest } = profile.settings.allowances;
              void _drop;
              saveSettings({ budget_monthly: Number(val) || 0, allowances: rest });
              setEditing(false);
            }}>Every month</button>
          </div>
        </Sheet>
      )}
    </section>
  );
}

function ItemSheet({ item, lastBuy, money, onClose, onSave, onDelete }: {
  item: ShopItem | null; lastBuy: (n: string) => ShopItem | undefined; money: (n: number | null) => string;
  onClose: () => void; onSave: (i: ShopItem, photo: File | null) => void; onDelete: (i: ShopItem) => void;
}) {
  const [f, setF] = useState({
    name: item?.name ?? "", emoji: item?.emoji ?? "", qty: String(item?.qty ?? 1), unit: item?.unit ?? "pcs",
    price: item?.price != null ? String(item.price) : "", category: item?.category ?? "", note: item?.note ?? "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const last = f.name ? lastBuy(f.name) : undefined;
  const emoji = f.emoji || emojiFor(f.name, "🛍️");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Sheet title={item ? "Edit item" : "New item"} onClose={onClose}>
      <div className="flex items-center gap-3">
        <input aria-label="Picture" className="input !w-16 text-center text-2xl" value={emoji} onChange={set("emoji")} />
        <input autoFocus={!item} className="input" placeholder="Item name" value={f.name} onChange={set("name")} />
      </div>
      {last && <p className="text-xs text-[var(--accent2)]">Last time: {last.qty} {last.unit} for {money(last.price)} on {new Date(last.purchased_at!).toLocaleDateString()}</p>}
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-muted">Quantity<input className="input mt-1" inputMode="decimal" value={f.qty} onChange={set("qty")} /></label>
        <label className="text-xs text-muted">Unit
          <select className="input mt-1" value={f.unit} onChange={set("unit")}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
        </label>
        <label className="text-xs text-muted">Price<input className="input mt-1" inputMode="decimal" placeholder="0" value={f.price} onChange={set("price")} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">Category<input className="input mt-1" placeholder="Fruit, Snacks…" value={f.category} onChange={set("category")} /></label>
        <label className="text-xs text-muted">Brand / note<input className="input mt-1" value={f.note} onChange={set("note")} /></label>
      </div>
      <label className="btn-ghost block text-center cursor-pointer">
        📷 {photo ? photo.name.slice(0, 24) : item?.photo_id ? "Replace photo" : "Add photo"}
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
      </label>
      <div className="flex gap-2">
        {item && <button onClick={() => onDelete(item)} className="btn-ghost text-rose-400">Delete</button>}
        <button disabled={!f.name.trim()} className="btn-primary flex-1" onClick={() => onSave({
          id: item?.id ?? crypto.randomUUID(), name: f.name.trim(), emoji, qty: Number(f.qty) || 1, unit: f.unit,
          price: f.price === "" ? null : Number(f.price), category: f.category.trim(), note: f.note.trim(),
          photo_id: item?.photo_id ?? null, status: item?.status ?? "to_buy", purchased_at: item?.purchased_at ?? null,
          created_at: item?.created_at ?? new Date().toISOString(),
        }, photo)}>Save</button>
      </div>
    </Sheet>
  );
}

function BuySheet({ item, cur, onClose, onBuy }: {
  item: ShopItem; cur: string; onClose: () => void;
  onBuy: (qty: number, unit: string, price: number | null, at: Date, toStorage: boolean) => void;
}) {
  const [qty, setQty] = useState(String(item.qty));
  const [unit, setUnit] = useState(item.unit);
  const [price, setPrice] = useState(item.price != null ? String(item.price) : "");
  const [when, setWhen] = useState(dtLocal(new Date()));
  const [toStorage, setToStorage] = useState(true);
  return (
    <Sheet title={`${item.emoji} Bought ${item.name}`} onClose={onClose}>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-muted">Quantity<input className="input mt-1" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} /></label>
        <label className="text-xs text-muted">Unit
          <select className="input mt-1" value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
        </label>
        <label className="text-xs text-muted">Paid ({cur})<input autoFocus className="input mt-1" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
      </div>
      <WhenPicker label="When" value={when} onChange={setWhen} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={toStorage} onChange={(e) => setToStorage(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" /> Add to my storage</label>
      <button className="btn-primary w-full" onClick={() => onBuy(Number(qty) || 1, unit, price === "" ? null : Number(price), new Date(when), toStorage)}>Save purchase</button>
    </Sheet>
  );
}

function PantrySheet({ item, onClose, onSave, onDelete }: {
  item: PantryItem | null; onClose: () => void; onSave: (p: PantryItem) => void; onDelete: (p: PantryItem) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [emoji, setEmoji] = useState(item?.emoji ?? "");
  const [qty, setQty] = useState(String(item?.qty ?? 1));
  const [unit, setUnit] = useState(item?.unit ?? "pcs");
  const pic = emoji || emojiFor(name, "📦");
  return (
    <Sheet title={item ? "Edit storage item" : "Add to storage"} onClose={onClose}>
      <div className="flex items-center gap-3">
        <input aria-label="Picture" className="input !w-16 text-center text-2xl" value={pic} onChange={(e) => setEmoji(e.target.value)} />
        <input autoFocus={!item} className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">Quantity<input className="input mt-1" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} /></label>
        <label className="text-xs text-muted">Unit
          <select className="input mt-1" value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
        </label>
      </div>
      <div className="flex gap-2">
        {item && <button onClick={() => onDelete(item)} className="btn-ghost text-rose-400">Delete</button>}
        <button disabled={!name.trim()} className="btn-primary flex-1" onClick={() => onSave({
          ...item, id: item?.id ?? crypto.randomUUID(), name: name.trim(), emoji: pic, qty: Number(qty) || 0, unit,
          last_price: item?.last_price ?? null, updated_at: new Date().toISOString(),
        })}>Save</button>
      </div>
    </Sheet>
  );
}

// Spend gold earned from missions on real-life treats, guilt-free.
function RewardShop() {
  const { data, logActivity, celebrate } = useApp();
  const { items, add, update, remove } = useCustomItems("reward");
  const g = gold(data);
  const [form, setForm] = useState<{ id?: string; name: string; cost: string; emoji: string } | null>(null);
  const claimed = data.logs.filter((l) => l.kind === "redeem").slice(-5).reverse();

  return (
    <>
      <section className="card frame p-4 mb-3 flex items-center justify-between">
        <div><div className="text-xs text-muted">Your gold</div><div className="font-game text-3xl gold-text">🪙 {g.toLocaleString()}</div></div>
        <p className="text-xs text-muted max-w-[55%] text-right">Earn gold by clearing missions. Spend it here on treats you&apos;ve truly earned.</p>
      </section>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {items.map((r) => {
          const cost = Number(r.config.cost ?? 50);
          const can = g >= cost;
          return (
            <div key={r.id} className="card p-3 text-center">
              <button onClick={() => setForm({ id: r.id, name: r.name, cost: String(cost), emoji: String(r.config.emoji ?? emojiFor(r.name, "🎁")) })} className="w-full">
                <div className="text-4xl">{String(r.config.emoji ?? emojiFor(r.name, "🎁"))}</div>
                <div className="mt-1 text-sm font-semibold leading-tight">{r.name}</div>
              </button>
              <button disabled={!can} onClick={() => {
                logActivity("redeem", { name: r.name, cost, emoji: r.config.emoji }, new Date(), 0);
                celebrate({ kind: "achievement", big: true, icon: String(r.config.emoji ?? "🎁"), title: "REWARD CLAIMED", subtitle: r.name, quote: "You earned this, hero. Enjoy it completely, without guilt. Then return stronger." });
              }} className="btn-primary btn-gold mt-2 w-full !py-1.5 text-xs">🪙 {cost}</button>
            </div>
          );
        })}
        <button onClick={() => setForm({ name: "", cost: "50", emoji: "" })} className="rounded-2xl border border-dashed border-white/20 p-3 text-muted">＋ New reward</button>
      </div>
      {claimed.length > 0 && (
        <section className="card p-3">
          <div className="section-title mb-2">Recently claimed</div>
          {claimed.map((l) => (
            <div key={l.id} className="flex justify-between text-sm py-1">
              <span>{String(l.data.emoji ?? "🎁")} {String(l.data.name)}</span>
              <span className="text-muted">{new Date(l.created_at).toLocaleDateString()} · 🪙 {String(l.data.cost)}</span>
            </div>
          ))}
        </section>
      )}
      {form && (
        <Sheet title={form.id ? "Edit reward" : "New reward"} onClose={() => setForm(null)}>
          <div className="flex items-center gap-3">
            <input aria-label="Picture" className="input !w-16 text-center text-2xl" value={form.emoji || emojiFor(form.name, "🎁")} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            <input autoFocus className="input" placeholder="e.g. 2 anime episodes" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <label className="text-xs text-muted">Price in gold<input className="input mt-1" inputMode="numeric" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></label>
          <p className="text-xs text-muted">{line("exam")}</p>
          <div className="flex gap-2">
            {form.id && <button className="btn-ghost text-rose-400" onClick={() => { remove(form.id!); setForm(null); }}>Delete</button>}
            <button className="btn-primary flex-1" disabled={!form.name.trim()} onClick={() => {
              const config = { cost: Number(form.cost) || 50, emoji: form.emoji || emojiFor(form.name, "🎁") };
              if (form.id) update(form.id, { name: form.name.trim(), config });
              else add(form.name.trim(), config);
              setForm(null);
            }}>Save</button>
          </div>
        </Sheet>
      )}
    </>
  );
}
