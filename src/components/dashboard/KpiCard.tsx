import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string; // tailwind bg-*-50 / text-*-600 pair prefix, e.g. "indigo"
  sublabel?: string;
  onClick?: () => void;
}

const ACCENT_CLASSES: Record<string, { bg: string; text: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
};

export default function KpiCard({ icon: Icon, label, value, accent, sublabel, onClick }: KpiCardProps) {
  const classes = ACCENT_CLASSES[accent] || ACCENT_CLASSES.slate;
  const content = (
    <>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${classes.bg} ${classes.text}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-lg font-extrabold text-slate-800 tracking-tight">{value}</p>
        <p className="text-[11px] font-bold text-slate-400 tracking-wide mt-0.5">{label}</p>
        {sublabel && <p className="text-[10.5px] text-slate-400 mt-1">{sublabel}</p>}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-3 text-left w-full cursor-pointer hover:shadow-lg transition-shadow"
      >
        {content}
      </button>
    );
  }

  return <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-3">{content}</div>;
}
