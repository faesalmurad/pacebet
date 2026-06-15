export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "volt" | "coral" | "amber";
}) {
  const accentClass =
    accent === "volt"
      ? "text-volt"
      : accent === "coral"
      ? "text-coral"
      : accent === "amber"
      ? "text-amber"
      : "text-bone";
  return (
    <div className="panel p-5 flex flex-col justify-between min-h-[112px]">
      <p className="eyebrow">{label}</p>
      <div className="mt-3">
        <p className={`font-display text-4xl leading-none tabular ${accentClass}`}>
          {value}
        </p>
        {sub && <p className="mt-2 text-xs text-muted">{sub}</p>}
      </div>
    </div>
  );
}
