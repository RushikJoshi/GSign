const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-600 border-amber-200/50 shadow-sm shadow-amber-100",
  viewed: "bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-100",
  signed: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50",
  completed: "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm shadow-indigo-100",
  expired: "bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-100",
  declined: "bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-100",
  in_progress: "bg-sky-50 text-sky-600 border-sky-100 shadow-sm shadow-sky-100",
  sent: "bg-violet-50 text-violet-600 border-violet-100 shadow-sm shadow-violet-100",
  draft: "bg-slate-50 text-slate-500 border-slate-200 shadow-sm shadow-slate-50",
};

const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase().replace(/_/g, ' ');
  const style = STATUS_STYLES[normalized.replace(/ /g, '_')] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-widest transition-all ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse-slow"></span>
      {normalized || "unknown"}
    </span>
  );
};

export default StatusBadge;
