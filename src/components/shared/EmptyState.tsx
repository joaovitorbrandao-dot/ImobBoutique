import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl shadow-md p-16 text-center animate-fade-in">
      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-extrabold text-slate-800 tracking-wide">{title}</h3>
        {description && <p className="text-xs text-slate-400 leading-relaxed">{description}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          type="button"
          className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider transition-all shadow-sm cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
