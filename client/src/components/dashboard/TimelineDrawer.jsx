import { X, Clock, Eye, CheckCircle2, Mail } from "lucide-react";
import StatusBadge from "./StatusBadge";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

const TimelineDrawer = ({ isOpen, onClose, selectedDoc, timeline, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={`absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transition-transform duration-500 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full bg-slate-50/20">
          
          {/* Header - Compact */}
          <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Audit Timeline</h2>

            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Doc Metadata - Compact */}
          <div className="px-6 py-3.5 bg-white border-b border-slate-100">
             <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-1.5 opacity-60">Current Status</p>
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[13px] font-bold text-slate-800 truncate">{selectedDoc?.title}</h3>
                    <StatusBadge status={selectedDoc?.status} />
                </div>
             </div>
          </div>

          {/* Timeline Content - Compact Spacing */}
          <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <div className="w-6 h-6 border-[3px] border-[#249272] border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading...</p>
              </div>
            ) : timeline && timeline.length > 0 ? (
              <div className="relative space-y-4">
                {/* Vertical Line */}
                <div className="absolute left-[13px] top-1.5 bottom-1.5 w-[1.5px] bg-slate-100" />

                {timeline.map((item, index) => (
                  <div key={`${item.signerEmail}-${index}`} className="relative pl-9 animate-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${index * 40}ms` }}>
                    {/* Status Indicator */}
                    <div className={`absolute left-0 top-1.5 w-6.5 h-6.5 rounded-full border-[3px] border-white flex items-center justify-center z-10 transition-all shadow-sm ${
                      item.status === 'signed' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {item.status === 'signed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-all hover:border-emerald-200">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] bg-slate-50 text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">ORDER-0{item.signingOrder}</span>
                            <StatusBadge status={item.status} />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-slate-800 truncate leading-none mb-1">{item.signerEmail}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Recipient</p>
                        </div>
                        {item.selfie?.url && (
                          <div className="shrink-0 flex flex-col items-center gap-1">
                            <img 
                              src={item.selfie.url} 
                              alt="Verification" 
                              className="w-12 h-12 rounded-lg object-cover border border-emerald-200 shadow-sm transition-transform hover:scale-110 cursor-zoom-in" 
                              onClick={() => window.open(item.selfie.url, '_blank')}
                            />
                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Selfie OK</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" /> Viewed
                          </p>
                          <p className="text-[11px] font-bold text-slate-500 truncate">{formatDate(item.viewedAt)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Signed
                          </p>
                          <p className="text-[11px] font-bold text-slate-500 truncate">{formatDate(item.signedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 opacity-40">
                <Clock className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px]">Empty Trail</p>
              </div>
            )}
          </div>

          {/* Footer - Compact */}
          <div className="h-10 border-t border-slate-50 flex items-center justify-center bg-white">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[5px]">SignFlow Audit</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineDrawer;
