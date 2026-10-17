"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp, useCustomItems } from "@/lib/store";
import { parseCommand } from "@/lib/voice";

type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

export function VoiceButton() {
  const { logActivity, celebrate } = useApp();
  const { items } = useCustomItems("exercise");
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState("");
  const rec = useRef<Recognition | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const start = () => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return setToast("Voice isn't supported in this browser. Try Chrome or Safari.");
    const r = new Ctor();
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = async (e) => {
      const said = e.results[0][0].transcript;
      const p = parseCommand(said, items.map((i) => i.name));
      if (!p) return setToast(`Didn't catch a command in "${said}"`);
      if (p.kind === "focus-start") return router.push("/focus?start=1");
      if ("data" in p) {
        logActivity(p.kind, p.data);
        celebrate({ title: "LOGGED!", subtitle: p.label });
        setToast(`✓ ${p.label}`);
      }
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  return (
    <>
      <button
        aria-label="Voice command"
        onClick={() => (listening ? rec.current?.stop() : start())}
        className={`fixed right-4 bottom-24 z-40 h-14 w-14 rounded-full text-2xl grid place-items-center btn-primary !p-0 ${listening ? "animate-pulse scale-110" : ""}`}
      >
        🎙️
      </button>
      {toast && (
        <div className="fixed bottom-40 inset-x-4 z-40 card px-4 py-3 text-sm text-center animate-pop">{toast}</div>
      )}
    </>
  );
}
