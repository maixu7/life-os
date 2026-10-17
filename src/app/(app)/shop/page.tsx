"use client";

import { useEffect, useMemo, useState } from "react";
import { XpHeader } from "@/components/XpHeader";
import { useApp, type ShopItem } from "@/lib/store";
import { deletePhoto, getPhoto, putPhoto } from "@/lib/vault";

export default function ShopPage() {
  const { session, data, update, profile, logActivity, celebrate } = useApp();
  const [tab, setTab] = useState<"to_buy" | "purchased" | "gallery">("to_buy");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [compare, setCompare] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", quantity: "", category: "", note: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [buying, setBuying] = useState<ShopItem | null>(null);
  const [price, setPrice] = useState("");
  const items = useMemo(() => [...data.shopping].sort((a, b) => b.created_at.localeCompare(a.created_at)), [data.shopping]);

  // Decrypt photos into temporary in-memory URLs.
  useEffect(() => {
    let alive = true;
    const made: string[] = [];
    (async () => {
      const out: Record<string, string> = {};
      for (const i of items) {
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
  }, [items, session]);

  const addItem = async () => {
    if (!form.name.trim()) return;
    let photo_id: string | null = null;
    if (photo) {
      photo_id = crypto.randomUUID();
      await putPhoto(session, photo_id, photo);
    }
    const item: ShopItem = {
      id: crypto.randomUUID(), ...form, name: form.name.trim(), price: null, photo_id,
      status: "to_buy", purchased_at: null, created_at: new Date().toISOString(),
    };
    update((d) => ({ ...d, shopping: [...d.shopping, item] }));
    setForm({ name: "", quantity: "", category: "", note: "" });
    setPhoto(null);
  };

  const markBought = () => {
    if (!buying) return;
    const p = price ? Number(price) : null;
    update((d) => ({
      ...d,
      shopping: d.shopping.map((i) => (i.id === buying.id ? { ...i, status: "purchased", price: p, purchased_at: new Date().toISOString() } : i)),
    }));
    const row = logActivity("shopping", { item: buying.name, price: p });
    celebrate({ title: "GOT IT!", subtitle: buying.name, xp: row.xp });
    setBuying(null);
    setPrice("");
  };

  const remove = async (i: ShopItem) => {
    if (i.photo_id) await deletePhoto(session, i.photo_id);
    update((d) => ({ ...d, shopping: d.shopping.filter((x) => x.id !== i.id), deleted: [...d.deleted, i.id] }));
  };

  const toBuy = items.filter((i) => i.status === "to_buy");
  const purchased = items.filter((i) => i.status === "purchased");
  const month = new Date().toISOString().slice(0, 7);
  const spent = purchased.filter((i) => i.purchased_at?.startsWith(month)).reduce((s, i) => s + Number(i.price ?? 0), 0);
  const budget = profile.settings.budget_monthly;
  const byCat = Object.entries(
    purchased.filter((i) => i.purchased_at?.startsWith(month)).reduce<Record<string, number>>((m, i) => {
      const c = i.category || "Other";
      m[c] = (m[c] ?? 0) + Number(i.price ?? 0);
      return m;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...byCat.map((c) => c[1]));
  const withPhotos = items.filter((i) => i.photo_id && urls[i.photo_id]);

  return (
    <>
      <XpHeader title="Shopping" />
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([["to_buy", `To buy (${toBuy.length})`], ["purchased", "Purchased"], ["gallery", "📸 Gallery"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`chip py-2 ${tab === k ? "chip-on" : ""}`}>{l}</button>
        ))}
      </div>

      {tab === "to_buy" && (
        <>
          <section className="card p-4 mb-4 space-y-2">
            <input className="input" placeholder="Item to buy" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="input" placeholder="Qty" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <input className="input" placeholder="Brand / note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <div className="flex gap-2">
              <label className="btn-ghost flex-1 text-center cursor-pointer">
                📷 {photo ? photo.name.slice(0, 16) : "Photo"}
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
              </label>
              <button onClick={addItem} className="btn-primary flex-1">Add</button>
            </div>
          </section>
          <ul className="space-y-2">
            {toBuy.map((i) => (
              <li key={i.id} className="card p-3 flex items-center gap-3">
                {i.photo_id && urls[i.photo_id]
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={urls[i.photo_id]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  : <span className="h-12 w-12 rounded-lg bg-white/5 grid place-items-center text-xl">🛍️</span>}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{i.name} {i.quantity && <span className="text-muted text-sm">×{i.quantity}</span>}</div>
                  <div className="text-xs text-muted truncate">{[i.category, i.note].filter(Boolean).join(" · ")}</div>
                </div>
                <button onClick={() => setBuying(i)} className="btn-primary !px-3 !py-1.5 text-sm">Bought</button>
                <button aria-label="Delete" onClick={() => remove(i)} className="text-muted">✕</button>
              </li>
            ))}
          </ul>
          {toBuy.length === 0 && <p className="text-sm text-muted">Your list is empty.</p>}
        </>
      )}

      {tab === "purchased" && (
        <>
          <section className="card p-4 mb-4">
            <div className="flex justify-between text-sm mb-1"><span>This month</span><span>{spent.toFixed(2)} / {budget}</span></div>
            <div className="bar mb-1"><div style={{ width: `${Math.min(100, (spent / budget) * 100)}%`, background: spent > budget ? "#ff3b5c" : undefined }} /></div>
            <p className="text-xs text-muted mb-3">
              {spent <= budget ? `${(budget - spent).toFixed(2)} left. Great control!` : "Over budget this month. Next month is a fresh start!"}
            </p>
            <div className="space-y-1">
              {byCat.map(([c, v]) => (
                <div key={c} className="flex items-center gap-2 text-xs">
                  <span className="w-20 truncate text-muted">{c}</span>
                  <div className="flex-1 bar !h-3"><div style={{ width: `${(v / maxCat) * 100}%` }} /></div>
                  <span className="w-14 text-right tabular-nums">{v.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
          <ul className="space-y-2">
            {purchased.map((i) => (
              <li key={i.id} className="card p-3 flex items-center gap-3 text-sm">
                <span className="flex-1">{i.name}</span>
                <span className="text-muted">{i.purchased_at && new Date(i.purchased_at).toLocaleDateString()}</span>
                <span className="font-bold tabular-nums">{i.price != null ? Number(i.price).toFixed(2) : "-"}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "gallery" && (
        <>
          <p className="text-sm text-muted mb-2">Tap two photos to compare them side by side in the store.</p>
          {compare.length === 2 && (
            <div className="fixed inset-0 z-40 bg-black/90 grid grid-cols-2 gap-1 p-1" onClick={() => setCompare([])}>
              {compare.map((id) => {
                const i = items.find((x) => x.id === id)!;
                return (
                  <div key={id} className="flex flex-col">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urls[i.photo_id!]} alt={i.name} className="flex-1 object-contain min-h-0" />
                    <div className="p-2 text-center text-sm">{i.name}{i.note && <div className="text-muted text-xs">{i.note}</div>}</div>
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
          {withPhotos.length === 0 && <p className="text-sm text-muted">Add a photo when you add an item to see it here.</p>}
        </>
      )}

      {buying && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-end" onClick={() => setBuying(null)}>
          <div className="w-full max-w-2xl mx-auto card rounded-b-none p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">How much was {buying.name}?</h3>
            <input autoFocus className="input" inputMode="decimal" placeholder="Price (optional)" value={price} onChange={(e) => setPrice(e.target.value)} />
            <button onClick={markBought} className="btn-primary w-full">Mark as purchased</button>
          </div>
        </div>
      )}
    </>
  );
}
