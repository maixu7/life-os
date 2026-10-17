# Life OS

A vibrant, gamified daily life tracker. Installable on iPhone, Android and desktop as a web app (PWA).

## Features

- **One account, every device**: username + password, synced end-to-end encrypted. Your password derives (PBKDF2, 600k rounds) an AES-256-GCM key that never leaves the device plus an auth token; the server stores only ciphertext and a hash of the token. Works offline from an encrypted local copy and merges changes when back online. Auto-locks after 3 idle minutes or 30 s in the background. Lockout after 5 wrong passwords. Optional decoy password that opens a separate empty profile.
- **Today**: daily quest checklist, animated water and milk glasses, wake time, meals with tags and macros, sleep with quality tags and caffeine tips, reading and listening.
- **Train**: custom exercises, sets/reps/weight, barbell plate calculator, rest timer with vibration and beeps.
- **Shop**: to-buy list, purchased history with monthly budget barometer and category chart, encrypted photo gallery with side-by-side compare.
- **Focus**: 25-minute timer with rain or lofi ambience, screen wake lock, exam countdown, formula vault.
- **Calendar**: month heatmap, week XP chart, day timeline.
- **Rank**: XP, levels, E to SSS ranks, attribute radar chart, badges, unlockable themes.
- **Voice**: tap the mic and say "drank 2 glasses of milk", "completed 15 pushups", "read for 20 minutes", "woke up" or "study".
- **Backup**: download an encrypted backup file and restore it on another device.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without database variables, dev mode keeps accounts in memory.

## Deploy

1. Import the repo in Vercel (framework: Next.js).
2. In the Vercel project, open **Storage → Create Database → Upstash for Redis** (free plan) and connect it to this project. That adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` also work).
3. Redeploy.

## Install on your phone

Open the deployed URL, then **Share → Add to Home Screen** (iPhone, Safari) or **⋮ → Install app** (Android, Chrome).
