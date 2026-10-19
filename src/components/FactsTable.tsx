import { FACTS, type Facts } from "@/lib/label";

// The nutrition panel as the app shows it: English names, fixed units.
export function FactsTable({ facts, title, className = "" }: { facts?: Facts; title?: string; className?: string }) {
  const rows = FACTS.filter(([k]) => facts?.[k] != null);
  if (!rows.length) return null;
  return (
    <div className={`rounded-xl bg-white/5 p-2 text-[11px] ${className}`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="grid grid-cols-2 gap-x-3">
        {rows.map(([k, name, unit]) => (
          <div key={k} className="flex justify-between border-b border-white/5 py-0.5"><span className="text-muted">{name}</span><b>{facts![k]} {unit}</b></div>
        ))}
      </div>
    </div>
  );
}
