/** Dashboard metric tile. `tone` picks its accent from the palette. */
const TONES = {
  brand: 'bg-brand-500/15 text-brand-300',
  coral: 'bg-coral-500/15 text-coral-400',
  mint: 'bg-mint-500/15 text-mint-400',
  sky: 'bg-sky-500/15 text-sky-400',
  accent: 'bg-accent-500/15 text-accent-400',
};

export default function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  return (
    <div className="card flex items-start gap-3 p-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${TONES[tone] || TONES.brand}`}>
        {Icon ? <Icon className="h-5 w-5" /> : null}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-fog-500">{label}</p>
        <p className="mt-0.5 text-xl font-extrabold leading-tight text-fog-50">{value}</p>
        {hint ? <p className="mt-0.5 truncate text-[11px] text-fog-500">{hint}</p> : null}
      </div>
    </div>
  );
}

export { StatCard };