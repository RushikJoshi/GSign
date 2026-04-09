import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/dashboard/StatusBadge";
import DashboardLayout from "../components/layout/DashboardLayout";
import { dmsApi } from "../services/api";
import { FileText, Send, PenTool, ArrowUpRight, Search, Clock, ChevronRight, Eye } from "lucide-react";

const CompanyAdminDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const docsRes = await dmsApi.getDocuments();
      setDocuments(docsRes.data.documents || []);
    } catch (err) {
      console.error("Failed to load documents.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <DashboardLayout title="Documents" subtitle="Manage your e-signatures in one place." hideBreadcrumbs={true}>
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Core Quick Actions - Minimal & Clean */}
        <section className="flex flex-col sm:flex-row items-stretch gap-6">
          <button
            onClick={() => navigate("/request/new")}
            className="flex-1 flex items-center p-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all active:scale-95 group"
          >
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
               <Send className="w-6 h-6" />
            </div>
            <div className="text-left">
               <span className="block text-[17px] font-bold">New Request</span>
               <span className="text-[13px] opacity-70 font-medium">Send a document for signing.</span>
            </div>
          </button>

          <button
            onClick={() => navigate("/request/sign-yourself")}
            className="flex-1 flex items-center p-6 bg-white border border-slate-200 hover:border-emerald-200 hover:bg-slate-50 rounded-xl shadow-sm transition-all active:scale-95 group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mr-5 group-hover:bg-emerald-600 transition-all duration-300">
               <PenTool className="w-6 h-6 text-emerald-500 group-hover:text-white" />
            </div>
            <div className="text-left">
               <span className="block text-[17px] font-bold text-slate-800">Sign Myself</span>
               <span className="text-[13px] text-slate-500 font-medium">Sign a document personally.</span>
            </div>
          </button>
        </section>

        {/* Simplified Document Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[15px] font-bold text-slate-800">Recent Documents</h3>
            <button 
                onClick={() => navigate("/history")} 
                className="text-[13px] font-bold text-emerald-600 hover:underline flex items-center gap-1.5"
            >
                View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400 italic text-sm">
                         No documents found.
                      </td>
                    </tr>
                  ) : (
                    documents.slice(0, 7).map((doc) => (
                      <tr key={doc._id} onClick={() => navigate(`/history?doc=${doc._id}`)} className="hover:bg-emerald-50/10 transition-colors cursor-pointer group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-50 rounded flex items-center justify-center">
                              <FileText className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-[13.5px] font-bold text-slate-700 truncate max-w-[200px] group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{doc.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={doc.status} />
                        </td>
                        <td className="px-6 py-4 text-[12px] text-slate-400 font-bold uppercase tracking-wider">
                           {new Date(doc.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">
                                  <ArrowUpRight className="w-4.5 h-4.5" />
                             </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
};

export default CompanyAdminDashboard;
