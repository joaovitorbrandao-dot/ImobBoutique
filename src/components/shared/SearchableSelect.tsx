import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  disabled,
  emptyMessage = 'Nenhum resultado',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-left flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className={selected ? 'text-slate-800 font-semibold truncate' : 'text-slate-400 truncate'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4.5 top-4.5" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full text-xs bg-slate-50 border-0 rounded-md pl-7 pr-7 py-1.5 focus:ring-1 focus:ring-indigo-500"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-4 cursor-pointer">
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-[11px] text-slate-400 text-center">{emptyMessage}</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors cursor-pointer ${
                    o.value === value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 font-semibold'
                  }`}
                >
                  <div className="truncate">{o.label}</div>
                  {o.sublabel && <div className="text-[10.5px] text-slate-400 font-medium truncate">{o.sublabel}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
