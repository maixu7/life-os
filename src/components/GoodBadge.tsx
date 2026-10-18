import { scoreColor, type Goodness } from "@/lib/goodness";

// "Health 8/10 · rich in … · poor in …"
export function GoodBadge({ g, compact }: { g: Goodness; compact?: boolean }) {
  return (
    <div className="text-[11px] leading-snug">
      <span className={`font-bold ${scoreColor(g.score)}`}>💚 Health {g.score}/10</span>
      {g.rich.length > 0 && <span className="text-emerald-300/90"> · best for: {g.rich.slice(0, compact ? 3 : 5).join(", ")}</span>}
      {g.poor.length > 0 && <span className="text-rose-300/90"> · watch: {g.poor.slice(0, compact ? 2 : 4).join(", ")}</span>}
    </div>
  );
}
