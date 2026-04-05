const STATUS_STYLES = {
  pending: "bg-[#fff8e6] text-[#b38b00] border-[#ffe082]",
  viewed: "bg-[#e8f0fe] text-[#1967d2] border-[#c2e7ff]",
  signed: "bg-[#e6fffa] text-[#2c7a7b] border-[#81e6d9]",
  completed: "bg-[#f0fdf4] text-[#166534] border-[#bbfcbe]",
  expired: "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]",
  in_progress: "bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]",
  draft: "bg-[#f8fafc] text-[#475569] border-[#e2e8f0]",
};

const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();
  const style = STATUS_STYLES[normalized] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize tracking-wide ${style}`}>
      {normalized || "unknown"}
    </span>
  );
};

export default StatusBadge;
