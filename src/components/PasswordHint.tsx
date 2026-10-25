"use client";

import { useEffect, useState } from "react";
import { passwordHint } from "@/lib/safety";

// On the sign-in screen: the hint you saved for this login (kept on this device only).
export function PasswordHint({ user }: { user: string }) {
  const [show, setShow] = useState(false);
  const [hint, setHint] = useState("");
  useEffect(() => { setHint(user ? passwordHint(user) : ""); setShow(false); }, [user]);
  if (!hint) return null;
  return show ? <p className="text-xs text-[var(--accent2)]">💡 Hint: {hint}</p>
    : <button type="button" onClick={() => setShow(true)} className="text-xs text-muted">💡 Show my password hint</button>;
}
