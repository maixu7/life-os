"use client";

// Trip tracking while the app is open: Start → your route, distance, time and
// speed → Stop saves it (walk, bicycle, bus…) to the day's records.
// It keeps running on every page of the app; a phone can't track a web app
// once it's locked or closed, so the screen is kept on while a trip runs.

import { useSyncExternalStore } from "react";
import { metres } from "@/lib/places";

export type Mode = "walk" | "run" | "bike" | "bus" | "train" | "car";
export const MODES: Record<Mode, { icon: string; label: string; met: number }> = {
  walk: { icon: "🚶", label: "Walk", met: 3.5 },
  run: { icon: "🏃", label: "Run", met: 8.3 },
  bike: { icon: "🚲", label: "Bicycle", met: 6.8 },
  bus: { icon: "🚌", label: "Bus", met: 1.3 },
  train: { icon: "🚆", label: "Train", met: 1.3 },
  car: { icon: "🚗", label: "Car / taxi", met: 1.3 },
};
export type Pt = [number, number, number]; // lat, lon, time ms
export type Trip = { start: number; pts: Pt[]; mode?: Mode; paused?: boolean; error?: string; acc?: number };

const KEY = "lifeos-trip";
let trip: Trip | null = load();
let watch: number | null = null;
let lock: { release: () => Promise<void> } | null = null;
const subs = new Set<() => void>();
const emit = () => { save(); subs.forEach((f) => f()); };

function load(): Trip | null {
  if (typeof window === "undefined") return null;
  try { const t = JSON.parse(localStorage.getItem(KEY) ?? "null"); return t && Array.isArray(t.pts) ? t : null; } catch { return null; }
}
function save() {
  try { if (trip) localStorage.setItem(KEY, JSON.stringify(trip)); else localStorage.removeItem(KEY); } catch { /* private mode */ }
}

export function useTrip(): Trip | null {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => trip, () => null);
}

async function keepAwake() {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
    if (wl && !lock) lock = await wl.request("screen");
  } catch { /* not allowed: fine */ }
}
function onFix(p: GeolocationPosition) {
  if (!trip || trip.paused) return;
  const { latitude: lat, longitude: lon, accuracy } = p.coords;
  const now = p.timestamp || Date.now();
  trip.acc = accuracy;
  if (accuracy > 80) { trip = { ...trip }; return emit(); } // too rough to draw
  const last = trip.pts[trip.pts.length - 1];
  if (last) {
    const d = metres({ lat: last[0], lon: last[1] }, { lat, lon });
    const dt = (now - last[2]) / 1000;
    if (d < Math.max(5, accuracy / 3)) { trip = { ...trip, error: undefined }; return emit(); } // standing still / GPS jitter
    if (dt > 0 && d / dt > 70) return; // a jump faster than 250 km/h is a bad fix
  }
  trip = { ...trip, error: undefined, pts: [...trip.pts, [lat, lon, now]] };
  emit();
}
function onErr(e: GeolocationPositionError) {
  if (!trip) return;
  trip = { ...trip, error: e.code === 1 ? "Location is blocked. Allow location for this app in your phone settings." : "Waiting for GPS…" };
  emit();
}
function listen() {
  if (watch != null || typeof navigator === "undefined" || !navigator.geolocation) return;
  watch = navigator.geolocation.watchPosition(onFix, onErr, { enableHighAccuracy: true, maximumAge: 2000, timeout: 30_000 });
  keepAwake();
}
function unlisten() {
  if (watch != null) navigator.geolocation.clearWatch(watch);
  watch = null;
  lock?.release().catch(() => {});
  lock = null;
}
if (typeof window !== "undefined") {
  // A trip that was running when the app reloaded carries on.
  if (trip && !trip.paused) listen();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && trip && !trip.paused) { lock = null; keepAwake(); } });
}

export function startTrip() {
  if (!navigator.geolocation) { trip = { start: Date.now(), pts: [], error: "This device has no location." }; emit(); return; }
  trip = { start: Date.now(), pts: [] };
  emit();
  listen();
}
export function pauseTrip(p: boolean) {
  if (!trip) return;
  trip = { ...trip, paused: p };
  if (p) unlisten(); else listen();
  emit();
}
export function setTripMode(m: Mode) { if (trip) { trip = { ...trip, mode: m }; emit(); } }
export function stopTrip(): Trip | null {
  const t = trip;
  unlisten();
  trip = null;
  emit();
  return t;
}

// ---------- numbers ----------
export const lengthOf = (pts: Pt[]) => pts.reduce((s, p, i) => (i ? s + metres({ lat: pts[i - 1][0], lon: pts[i - 1][1] }, { lat: p[0], lon: p[1] }) : 0), 0);
/** Speed while moving (km/h): stops at lights or bus stops don't drag it down. */
export function movingSpeed(pts: Pt[]) {
  let m = 0, s = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = metres({ lat: pts[i - 1][0], lon: pts[i - 1][1] }, { lat: pts[i][0], lon: pts[i][1] });
    const dt = (pts[i][2] - pts[i - 1][2]) / 1000;
    if (dt <= 0 || dt > 120) continue;
    if (d / dt < 0.4) continue; // standing
    m += d; s += dt;
  }
  return s ? (m / s) * 3.6 : 0;
}
export function topSpeed(pts: Pt[]) {
  let top = 0;
  // Over ~20 s windows, so one jumpy fix doesn't count.
  for (let i = 0, j = 0; i < pts.length; i++) {
    while (j < i && pts[i][2] - pts[j][2] > 20_000) j++;
    const dt = (pts[i][2] - pts[j][2]) / 1000;
    if (dt >= 8) top = Math.max(top, (lengthOf(pts.slice(j, i + 1)) / dt) * 3.6);
  }
  return top;
}
/** Walk, run, bicycle or bus from how fast you moved. You can change it. */
export function guessMode(pts: Pt[]): Mode {
  const v = movingSpeed(pts), top = topSpeed(pts);
  if (v === 0) return "walk";
  if (top > 75 || v > 45) return "train";
  if (v < 6.5 && top < 12) return "walk";
  if (v < 10 && top < 16) return "run";
  if (v < 22 && top < 32) return "bike";
  return "bus";
}
/** Fewer points for saving (keeps the shape). */
export function simplify(pts: Pt[], max = 300): Pt[] {
  if (pts.length <= max) return pts;
  const step = pts.length / max;
  const out: Pt[] = [];
  for (let i = 0; i < max; i++) out.push(pts[Math.floor(i * step)]);
  out.push(pts[pts.length - 1]);
  return out.map(([a, b, t]) => [Math.round(a * 1e5) / 1e5, Math.round(b * 1e5) / 1e5, t]);
}
export const kcalOf = (mode: Mode, minutes: number, kg = 65) => Math.round((MODES[mode].met * 3.5 * kg / 200) * minutes);
