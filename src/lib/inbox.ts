// The bell inbox: every Sensei message, reminder and reward that popped up,
// kept in a list on this device so nothing is lost when a popup closes.

export type InboxKind = "sensei" | "reminder" | "reward" | "wisdom";
export type InboxMsg = { id: string; at: string; kind: InboxKind; icon: string; title: string; body?: string; href?: string; read?: boolean };

const KEY = "lifeos-inbox";
const MAX = 120;
export const INBOX_EVENT = "lifeos-inbox";

export function inboxList(): InboxMsg[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as InboxMsg[]; } catch { return []; }
}
function save(list: InboxMsg[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch {}
  window.dispatchEvent(new Event(INBOX_EVENT));
}
export function pushInbox(m: Omit<InboxMsg, "id" | "at">) {
  if (typeof window === "undefined" || !m.title) return;
  const list = inboxList();
  // The same message twice within 2 minutes is one message.
  const dup = list[0] && list[0].title === m.title && list[0].body === m.body && Date.now() - new Date(list[0].at).getTime() < 120_000;
  if (dup) return;
  save([{ ...m, id: Math.random().toString(36).slice(2, 10), at: new Date().toISOString() }, ...list]);
}
export const markAllRead = () => save(inboxList().map((m) => ({ ...m, read: true })));
export const removeInbox = (id: string) => save(inboxList().filter((m) => m.id !== id));
export const clearInbox = () => save([]);
export const unreadCount = () => inboxList().filter((m) => !m.read).length;
