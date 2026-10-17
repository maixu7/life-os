import type { Log } from "@/lib/store";

export { dailyGoals } from "@/lib/missions";

export const sumMl = (logs: Log[], kind: string) =>
  logs.filter((l) => l.kind === kind).reduce((s, l) => s + Number(l.data.ml ?? 0), 0);
