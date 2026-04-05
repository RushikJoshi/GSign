import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/dashboard/StatusBadge";
import DashboardLayout from "../components/layout/DashboardLayout";
import { dmsApi } from "../services/api";
import { FileText, Send, PenTool, MessageCircle } from "lucide-react";

const CompanyAdminDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const docsRes = await dmsApi.getDocuments();
      setDocuments(docsRes.data.documents || []);
    } catch (err) {
      console.error("Unable to load docs.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <DashboardLayout title="Sign" hideBreadcrumbs={true}>
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Main Action Cards */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-4">
          {/* Send for signatures */}
          <div
            onClick={() => navigate("/request/new")}
            className="w-[320px] h-[220px] bg-[#249272] rounded border border-[#1e7a5f] flex flex-col items-center justify-center gap-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <Send className="w-8 h-8 text-white" />
            </div>
            <span className="text-white text-[19px] font-bold">Send for signatures</span>
          </div>

          {/* Sign yourself */}
          <div
            onClick={() => navigate("/my-documents")}
            className="w-[320px] h-[220px] bg-white rounded border-2 border-[#249272] flex flex-col items-center justify-center gap-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-[#249272]/5 flex items-center justify-center">
              <PenTool className="w-8 h-8 text-[#249272]" />
            </div>
            <span className="text-[#249272] text-[19px] font-bold">Sign yourself</span>
          </div>
        </div>

        {/* Recent Documents Section */}
        <div className="mt-24">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[15px] font-bold text-slate-800">Recent documents</h3>
            <button onClick={() => navigate("/history")} className="text-[13px] font-bold text-[#249272] hover:underline">View all</button>
          </div>

          <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Document</th>
                    <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last Activity</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">No recent documents found.</td>
                    </tr>
                  ) : (
                    documents.slice(0, 5).map((doc) => (
                      <tr key={doc._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-sky-50 rounded flex items-center justify-center">
                              <FileText className="w-4 h-4 text-sky-600" />
                            </div>
                            <span className="text-[13px] font-bold text-slate-700">{doc.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={doc.status} />
                        </td>
                        <td className="px-6 py-4 text-[13px] text-slate-500 font-medium">
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/history?doc=${doc._id}`)}
                            className="text-[12px] font-bold text-slate-400 hover:text-[#249272] transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Floating help / chat icon matching Zoho's style */}
      <div className="fixed bottom-6 right-6">
        <button className="w-12 h-12 bg-[#249272] rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform">
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    </DashboardLayout>
  );
};

export default CompanyAdminDashboard;
