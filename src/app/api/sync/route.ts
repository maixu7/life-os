import { NextResponse } from "next/server";
import { authHash, ipOf, kv, limited, login, validAuth, validUser, type Account, type Cipher, type VaultDoc } from "@/lib/server/kv";

export const runtime = "nodejs";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const isCipher = (c: unknown): c is Cipher =>
  !!c && typeof (c as Cipher).iv === "string" && typeof (c as Cipher).data === "string" && (c as Cipher).data.length < 8_000_000;

// One endpoint, several actions, all authenticated by (user, auth).
export async function POST(req: Request) {
  if (!kv) return bad("Cloud sync isn't set up yet.", 503);
  const body = await req.json().catch(() => null);
  const { action, user, auth } = body ?? {};
  if (!validUser(user) || !validAuth(auth)) return bad("Invalid request.");

  // Any one address gets at most 30 tries a minute, whoever it tries to open.
  if (await limited(`ip:${ipOf(req)}`, 30, 60_000)) return bad("Too many requests. Wait a minute.", 429);
  if (action === "register") {
    if (await limited(`reg:${ipOf(req)}`, 3, 3_600_000)) return bad("Too many new accounts from here. Try later.", 429);
    const existing = await kv.get<Account>(`acct:${user}`);
    if (existing) return bad("That username is taken.", 409);
    if (!isCipher(body.vault)) return bad("Invalid request.");
    await kv.set(`vault:${user}:0`, { ...body.vault, rev: 1 } satisfies VaultDoc);
    await kv.set(`acct:${user}`, { slots: [{ h: authHash(auth), slot: 0 }] } satisfies Account);
    return NextResponse.json({ rev: 1 });
  }

  const res = await login(user, auth);
  if ("error" in res) return bad(res.error, res.status);
  const base = `${user}:${res.slot}`;

  switch (action) {
    case "get": {
      const doc = await kv.get<VaultDoc>(`vault:${base}`);
      return doc ? NextResponse.json(doc) : bad("Not found.", 404);
    }
    case "put": {
      if (!isCipher(body.vault) || typeof body.rev !== "number") return bad("Invalid request.");
      const cur = await kv.get<VaultDoc>(`vault:${base}`);
      // Someone else saved first: hand back their version to merge.
      if (cur && cur.rev !== body.rev) return NextResponse.json({ conflict: cur }, { status: 409 });
      const rev = (cur?.rev ?? 0) + 1;
      await kv.set(`vault:${base}`, { ...body.vault, rev } satisfies VaultDoc);
      return NextResponse.json({ rev });
    }
    case "add-decoy": {
      if (!validAuth(body.decoyAuth) || !isCipher(body.vault)) return bad("Invalid request.");
      const acct = (await kv.get<Account>(`acct:${user}`))!;
      const h = authHash(body.decoyAuth);
      if (acct.slots.some((s) => s.h === h)) return bad("That password is already in use.", 409);
      const slot = Math.max(...acct.slots.map((s) => s.slot)) + 1;
      await kv.set(`vault:${user}:${slot}`, { ...body.vault, rev: 1 } satisfies VaultDoc);
      await kv.set(`acct:${user}`, { slots: [...acct.slots, { h, slot }] } satisfies Account);
      return NextResponse.json({ ok: true });
    }
    case "photo-put": {
      if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/.test(body.id) || !isCipher(body.photo)) return bad("Invalid request.");
      await kv.set(`photo:${base}:${body.id}`, { iv: body.photo.iv, data: body.photo.data, type: String(body.type ?? "image/jpeg") });
      return NextResponse.json({ ok: true });
    }
    case "photo-get": {
      const p = await kv.get<Cipher & { type: string }>(`photo:${base}:${body.id}`);
      return p ? NextResponse.json(p) : bad("Not found.", 404);
    }
    case "photo-del": {
      await kv.del(`photo:${base}:${body.id}`);
      return NextResponse.json({ ok: true });
    }
    default:
      return bad("Unknown action.");
  }
}
