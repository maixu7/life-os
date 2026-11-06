"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { distText, minText } from "@/lib/places";
import { useApp } from "@/lib/store";
import { MODES, guessMode, kcalOf, lengthOf, movingSpeed, pauseTrip, setTripMode, simplify, startTrip, stopTrip, useTrip, type Mode, type Pt, type Trip } from "@/lib/trip";

// Start / Stop a trip, see it live, and save it to the day's records.

const useNow = (on: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!on) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [on]);
  return now;
};
const clock = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}` : `${m}:${String(s % 60).padStart(2, "0")}`; };

export function TripCard() {
  const trip = useTrip();
  const now = useNow(!!trip);
  const [done, setDone] = useState<Trip | null>(null);
  const km = trip ? lengthOf(trip.pts) / 1000 : 0;
  const mode = trip ? trip.mode ?? guessMode(trip.pts) : "walk";
  const v = trip ? movingSpeed(trip.pts) : 0;
  return (
    <section id="lo-trip" className="card p-3 space-y-2 min-w-0">
      <div className="flex items-center gap-2">
        <b className="flex-1">{trip ? `${MODES[mode].icon} Trip ${trip.paused ? "paused" : "running"}` : "🚶 Trip tracking"}</b>
        {trip && !trip.paused && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />}
      </div>
      {!trip ? (
        <>
          <p className="text-xs text-muted">Tap Start when you leave. The app draws your route and works out distance, time and whether you walked, cycled or took the bus. Keep the app open on screen: phones stop web apps from tracking when locked.</p>
          <button onClick={startTrip} className="btn-primary w-full text-base">▶️ Start trip</button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/5 p-2 min-w-0"><div className="text-lg font-black">{clock(now - trip.start)}</div><div className="text-[10px] text-muted">time</div></div>
            <div className="rounded-xl bg-white/5 p-2 min-w-0"><div className="text-lg font-black">{km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(2)} km`}</div><div className="text-[10px] text-muted">distance</div></div>
            <div className="rounded-xl bg-white/5 p-2 min-w-0"><div className="text-lg font-black">{v.toFixed(1)}</div><div className="text-[10px] text-muted">km/h moving</div></div>
          </div>
          {trip.error && <p className="text-xs text-amber-400">{trip.error}</p>}
          {!trip.error && trip.acc && trip.acc > 80 && <p className="text-xs text-amber-400">GPS is weak here (±{Math.round(trip.acc)} m). Go outside for a better signal.</p>}
          <ModePick value={mode} guessed={!trip.mode} onPick={setTripMode} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => pauseTrip(!trip.paused)} className="btn-ghost">{trip.paused ? "▶️ Resume" : "⏸ Pause"}</button>
            <button onClick={() => setDone(stopTrip())} className="btn-hot">⏹ Stop</button>
          </div>
        </>
      )}
      {done && <SaveTrip trip={done} onClose={() => setDone(null)} />}
    </section>
  );
}

function ModePick({ value, guessed, onPick }: { value: Mode; guessed: boolean; onPick: (m: Mode) => void }) {
  return (
    <div>
      <div className="text-xs text-muted mb-1">{guessed ? "Guessed from your speed. Tap to change:" : "How you travelled:"}</div>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(MODES) as Mode[]).map((m) => <button key={m} onClick={() => onPick(m)} className={`chip !py-1 text-xs ${value === m ? "chip-on" : ""}`}>{MODES[m].icon} {MODES[m].label}</button>)}
      </div>
    </div>
  );
}

function SaveTrip({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { data, logActivity } = useApp();
  const [end] = useState(() => Date.now());
  const [mode, setMode] = useState<Mode>(trip.mode ?? guessMode(trip.pts));
  const [to, setTo] = useState("");
  const [fromName, setFrom] = useState("");
  const minutes = Math.max(1, Math.round((end - trip.start) / 60_000));
  const km = Math.round(lengthOf(trip.pts) / 10) / 100;
  const kg = Number([...data.logs].reverse().find((l) => l.kind === "body" && l.data.weight)?.data.weight) || 65;
  const kcal = kcalOf(mode, minutes, kg);
  const save = () => {
    const m = MODES[mode];
    logActivity("trip", {
      name: `${m.label}${to ? ` to ${to}` : ""}`, emoji: m.icon, mode, km, minutes, kcal: mode === "walk" || mode === "run" || mode === "bike" ? kcal : 0,
      from: fromName || undefined, to: to || undefined, start: new Date(trip.start).toISOString(), end: new Date(end).toISOString(), route: simplify(trip.pts), speed: Math.round(movingSpeed(trip.pts) * 10) / 10,
    });
    onClose();
  };
  return (
    <Sheet title="Save this trip" onClose={() => { if (confirm("Throw this trip away?")) onClose(); }}>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="card p-2"><div className="font-black">{minText(minutes)}</div><div className="text-[10px] text-muted">time</div></div>
        <div className="card p-2"><div className="font-black">{distText(km * 1000)}</div><div className="text-[10px] text-muted">distance</div></div>
        <div className="card p-2"><div className="font-black">{mode === "walk" || mode === "run" || mode === "bike" ? `${kcal}` : "–"}</div><div className="text-[10px] text-muted">kcal burned</div></div>
      </div>
      {trip.pts.length < 2 && <p className="text-xs text-amber-400">No route was recorded (no GPS signal). You can still save the time.</p>}
      <ModePick value={mode} guessed={!trip.mode} onPick={setMode} />
      <div className="grid grid-cols-2 gap-2">
        <input className="input min-w-0" placeholder="From (optional)" value={fromName} onChange={(e) => setFrom(e.target.value)} />
        <input className="input min-w-0" placeholder="To (optional)" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <button onClick={save} className="btn-primary w-full">Save to today&apos;s records</button>
      <button onClick={onClose} className="btn-ghost w-full text-sm">Don&apos;t save</button>
    </Sheet>
  );
}

export function TripHistory({ onShow }: { onShow: (pts: Pt[]) => void }) {
  const { data, updateLog, deleteLog } = useApp();
  const trips = useMemo(() => data.logs.filter((l) => l.kind === "trip").sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 30), [data.logs]);
  const [all, setAll] = useState(false);
  if (!trips.length) return null;
  const week = trips.filter((l) => Date.now() - new Date(l.created_at).getTime() < 7 * 864e5);
  const sum = (m: string[]) => week.filter((l) => m.includes(String(l.data.mode))).reduce((s, l) => s + (Number(l.data.km) || 0), 0);
  return (
    <section className="card p-3 space-y-2 min-w-0">
      <b>🗺️ My trips</b>
      <p className="text-xs text-muted">Last 7 days: 🚶 {sum(["walk", "run"]).toFixed(1)} km · 🚲 {sum(["bike"]).toFixed(1)} km · 🚌🚆 {sum(["bus", "train", "car"]).toFixed(1)} km</p>
      <ul className="space-y-1.5">
        {(all ? trips : trips.slice(0, 5)).map((l) => {
          const m = MODES[(l.data.mode as Mode) in MODES ? (l.data.mode as Mode) : "walk"];
          const route = Array.isArray(l.data.route) ? (l.data.route as Pt[]) : [];
          return (
            <li key={l.id} className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-xl shrink-0">{m.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block truncate font-semibold">{String(l.data.name ?? m.label)}</span>
                <span className="block text-xs text-muted truncate">{new Date(l.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {Number(l.data.km || 0).toFixed(2)} km · {minText(Number(l.data.minutes) || 0)}</span>
              </span>
              <select aria-label="Mode" className="input !w-auto !py-1 !px-1 text-xs shrink-0" value={String(l.data.mode)} onChange={(e) => updateLog(l.id, { data: { mode: e.target.value, emoji: MODES[e.target.value as Mode].icon } })}>
                {(Object.keys(MODES) as Mode[]).map((k) => <option key={k} value={k}>{MODES[k].icon} {MODES[k].label}</option>)}
              </select>
              {route.length > 1 && <button onClick={() => onShow(route)} className="chip !px-2 text-xs shrink-0">Map</button>}
              <button onClick={() => confirm("Delete this trip?") && deleteLog(l.id)} className="text-muted shrink-0 px-1" aria-label="Delete trip">🗑</button>
            </li>
          );
        })}
      </ul>
      {trips.length > 5 && <button onClick={() => setAll(!all)} className="btn-ghost w-full text-sm">{all ? "Show less" : `Show all ${trips.length}`}</button>}
    </section>
  );
}

// A small "trip running" pill on every other page, so it's never forgotten.
export function TripBar() {
  const trip = useTrip();
  const path = usePathname();
  const now = useNow(!!trip);
  if (!trip || path.startsWith("/map")) return null;
  const km = lengthOf(trip.pts) / 1000;
  return (
    <Link href="/map" className="fixed z-[35] left-1/2 -translate-x-1/2 top-[max(0.5rem,env(safe-area-inset-top))] max-w-[calc(100vw-1.5rem)] rounded-full bg-red-600 text-white text-xs font-bold px-3 py-1.5 shadow-lg flex items-center gap-1.5 whitespace-nowrap">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
      <span className="truncate">{MODES[trip.mode ?? guessMode(trip.pts)].icon} Trip {clock(now - trip.start)} · {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(2)} km`}</span>
    </Link>
  );
}
