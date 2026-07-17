// Maps the free-text `color` column on pipeline_stages to Tailwind classes.
// Keep in sync with the palette seeded in supabase/schema.sql.
export const STAGE_COLOR_CLASSES: Record<string, { dot: string; chip: string; bar: string }> = {
  slate: { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600 border-slate-200', bar: 'bg-slate-400' },
  indigo: { dot: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200', bar: 'bg-indigo-500' },
  amber: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-500' },
  blue: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500' },
  emerald: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500' },
  red: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 border-red-200', bar: 'bg-red-500' },
};

export const stageColorClasses = (color: string) => STAGE_COLOR_CLASSES[color] || STAGE_COLOR_CLASSES.slate;
