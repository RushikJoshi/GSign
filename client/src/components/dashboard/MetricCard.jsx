const MetricCard = ({ title, value, hint, icon: Icon, trend }) => {
  return (
    <article className="sf-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">
          {Icon && <Icon className="w-4 h-4" />}
        </div>
        {trend && (
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">{title}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
          {hint && <span className="text-[11px] text-slate-400 font-medium">— {hint}</span>}
        </div>
      </div>
    </article>
  );
};

export default MetricCard;
