import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { templateApi } from "../../services/api";
import { 
  Loader2, 
  ArrowLeft,
  Eye,
  Calendar,
  PenTool,
  Users,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

const PreviewTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // PDF Preview State
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    const fetchTemplateAndPdf = async () => {
      try {
        const res = await templateApi.getTemplate(id);
        const t = res.data.template;
        setTemplate(t);

        // Fetch PDF as blob with Authorization header
        const token = localStorage.getItem("sf_access_token");
        const fileRes = await fetch(templateApi.templateFileUrl(t._id), {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!fileRes.ok) throw new Error("Failed to load PDF file");

        const blob = await fileRes.blob();
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      } catch (err) {
        console.error("Failed to fetch template", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplateAndPdf();

    // Cleanup blob URL on unmount
    return () => {
       if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [id]);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);
  
  const pdfOptions = useMemo(() => ({
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@5.4.296/standard_fonts/`,
  }), []);

  if (loading) {
    return (
      <DashboardLayout title="Preview Template">
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 mt-4 font-bold text-[14px]">Loading template preview...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1500px] mx-auto h-[calc(100vh-100px)] flex flex-col gap-4 -mt-6">
        {/* Compact Unified Header */}
        <div className="flex items-center justify-between shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/templates")}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-slate-200"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
               <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-tight leading-none">{template?.name}</h3>
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Live Preview</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                   <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 hover:bg-slate-50 rounded-lg disabled:opacity-20 transition-all">
                     <ChevronLeft className="w-4 h-4 text-slate-600" />
                   </button>
                   <span className="text-[11px] font-black text-slate-400 w-20 text-center">PAGE {currentPage} / {numPages || "?"}</span>
                   <button onClick={() => setCurrentPage(p => Math.min(numPages || p, p + 1))} disabled={currentPage === numPages} className="p-1.5 hover:bg-slate-50 rounded-lg disabled:opacity-20 transition-all">
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                   </button>
                </div>
                
                <div className="w-[1px] h-4 bg-slate-200"></div>

                <div className="flex items-center gap-1">
                   <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-all"><ZoomOut className="w-4 h-4" /></button>
                   <span className="text-[11px] font-black text-slate-400 w-12 text-center">{Math.round(scale * 100)}%</span>
                   <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-all"><ZoomIn className="w-4 h-4" /></button>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest leading-none mt-[1px]">Template Inspector</span>
             </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative flex custom-scrollbar">
           {/* Document Area */}
           <div className="flex-1 overflow-auto p-12 flex justify-center custom-scrollbar">
              <div className="relative bg-white shadow-2xl transition-all duration-300">
                  <Document
                    file={pdfBlobUrl}
                    options={pdfOptions}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="p-20 font-bold text-slate-300 uppercase tracking-tight text-center">Loading Preview...</div>}
                  >
                    <Page
                      pageNumber={currentPage}
                      width={800}
                      scale={scale}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                    />
                  </Document>

                  {/* Fields Overlay */}
                  {template.fields.filter(f => f.page === currentPage).map(field => {
                    const roleName = template.roles[field.recipientId];
                    return (
                      <div
                        key={field.id}
                        style={{ 
                          left: field.x * scale, 
                          top: field.y * scale,
                        }}
                        className="absolute border-2 border-emerald-500/50 bg-emerald-50/90 rounded-md p-2 flex items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg backdrop-blur-sm z-10 min-w-[100px]"
                      >
                         <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              {field.type === 'signature' && <PenTool className="w-3 h-3 text-emerald-600" />}
                              {field.type === 'signdate' && <Calendar className="w-3 h-3 text-emerald-600" />}
                              {field.type === 'fullname' && <Users className="w-3 h-3 text-emerald-600" />}
                              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">{field.type}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                               <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                               <span className="text-[10px] font-bold text-slate-700 truncate">{roleName}</span>
                            </div>
                         </div>
                      </div>
                    );
                  })}
              </div>
           </div>

           {/* Info Sidebar */}
           <div className="w-[300px] bg-white border-l border-slate-200 p-6 overflow-y-auto shrink-0">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                 </div>
                 <div>
                    <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Template Info</h4>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Static Analysis</p>
                 </div>
              </div>

              <div className="space-y-8">
                 <section>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3">Roles</label>
                    <div className="space-y-2">
                       {template.roles.map((role, idx) => (
                         <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                            <div className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center text-[10px] font-black text-slate-400">
                               {idx + 1}
                            </div>
                            <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">{role}</span>
                         </div>
                       ))}
                    </div>
                 </section>

                 <section>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3">Field Count</label>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center">
                          <p className="text-[18px] font-black text-slate-800">{template.fields.length}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                       </div>
                       <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center">
                          <p className="text-[18px] font-black text-slate-800">{template.fields.filter(f => f.type === 'signature').length}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signs</p>
                       </div>
                    </div>
                 </section>

                 <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-[11px] font-bold text-emerald-700 leading-relaxed italic">
                       Fields are locked in this mode. To modify positions, use the 'Edit Template' option from the list.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PreviewTemplate;
