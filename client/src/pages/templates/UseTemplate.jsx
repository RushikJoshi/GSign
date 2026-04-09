import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { templateApi, dmsApi } from "../../services/api";
import { 
  Users, 
  Mail, 
  User, 
  Send, 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  FileText,
  Eye,
  Calendar,
  PenTool,
  Type,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Lock
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

const UseTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [selfieRequired, setSelfieRequired] = useState(false);
  const [mapping, setMapping] = useState({});
  
  // PDF Preview State
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const fetchTemplateAndPdf = async () => {
      try {
        const res = await templateApi.getTemplate(id);
        const t = res.data.template;
        setTemplate(t);
        setDocTitle(t.name);
        
        const initialMapping = {};
        t.roles.forEach(role => {
          initialMapping[role] = { name: "", email: "" };
        });
        setMapping(initialMapping);
        setSelfieRequired(t.selfieRequired || false);

        // Fetch PDF as blob
        const token = localStorage.getItem("sf_access_token");
        const fileRes = await fetch(templateApi.templateFileUrl(t._id), {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!fileRes.ok) throw new Error("Failed to load PDF file");

        const blob = await fileRes.blob();
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      } catch (err) {
        console.error("Failed to load template:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplateAndPdf();

    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [id]);

  const handleInputChange = (role, field, value) => {
    setMapping(prev => ({
      ...prev,
      [role]: { ...prev[role], [field]: value }
    }));
  };

  const handleSend = async () => {
    setSending(true);
    try {
      // 1. Fetch the template PDF file as a blob
      const token = localStorage.getItem('sf_access_token');
      const fileUrl = templateApi.templateFileUrl(template._id);
      
      const fileResponse = await fetch(fileUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await fileResponse.blob();
      const file = new File([blob], template.originalName, { type: template.mimeType });

      // 2. Upload as a new document
      const formData = new FormData();
      formData.append("document", file);
      formData.append("title", docTitle || template.name);
      formData.append("selfieRequired", selfieRequired);
      
      const uploadRes = await dmsApi.uploadDocument(formData);
      const docId = uploadRes.data.document._id;

      // 3. Prepare signers and fields
      const signers = template.roles.map((role, index) => ({
        name: mapping[role].name,
        email: mapping[role].email,
        order: index + 1
      }));

      // Map template fields to the new signers
      const fields = template.fields.map(f => ({
        ...f,
        signerEmail: mapping[template.roles[f.recipientId]].email
      }));

      // 4. Save fields
      await dmsApi.updateFields(docId, { fields });

      // 5. Add signers
      await dmsApi.addSigners(docId, {
        signers: signers.map(s => ({
          email: s.email,
          signingOrder: s.order
        })),
        selfieRequired: selfieRequired
      });

      // 6. Start signing flow
      await dmsApi.startSigningFlow(docId);

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to send document from template: " + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);
  
  const pdfOptions = useMemo(() => ({
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@5.4.296/standard_fonts/`,
  }), []);

  if (loading) {
    return (
      <DashboardLayout title="Use Template">
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 mt-4 font-bold text-[14px]">Preparing your template...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (success) {
    return (
      <DashboardLayout title="Success!">
        <div className="max-w-xl mx-auto py-12 text-center bg-white border border-slate-200 rounded-2xl p-12 shadow-sm animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-8 border border-emerald-100">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-[24px] font-bold text-slate-800 mb-2">Request Sent Successfully</h2>
          <p className="text-slate-500 text-[14px] font-medium leading-relaxed mb-10">
            The document based on "<strong>{template.name}</strong>" has been sent to all recipients for signature.
          </p>
          <div className="flex items-center gap-4 justify-center">
            <button 
               onClick={() => navigate("/company-admin")}
               className="px-8 py-2 bg-slate-900 text-white rounded-lg text-[13px] font-bold hover:bg-slate-800 transition active:scale-95 shadow-lg shadow-black/10"
            >
               Go to Dashboard
            </button>
            <button 
               onClick={() => navigate("/history")}
               className="px-8 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition active:scale-95"
            >
               View Status
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col gap-4 -mt-6">
        {/* Unified Compact Header */}
        <div className="flex items-center justify-between shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/templates")}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
               <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-tight leading-none">{template?.name}</h3>
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Ready to Send</span>
            </div>
          </div>

          {/* Centered PDF Controls (Refactored to here from PDF area) */}
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                   <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 hover:bg-slate-50 rounded-lg disabled:opacity-20 transition-all">
                     <ChevronLeft className="w-4 h-4 text-slate-600" />
                   </button>
                   <span className="text-[11px] font-black text-slate-400 w-20 text-center uppercase">PAGE {currentPage} / {numPages || "?"}</span>
                   <button onClick={() => setCurrentPage(p => Math.min(numPages || p, p + 1))} disabled={currentPage === numPages} className="p-1.5 hover:bg-slate-50 rounded-lg disabled:opacity-20 transition-all">
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                   </button>
                </div>
                <div className="w-[1px] h-4 bg-slate-200"></div>
                <div className="flex items-center gap-1">
                   <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500"><ZoomOut className="w-4 h-4" /></button>
                   <span className="text-[11px] font-black text-slate-400 w-12 text-center">{Math.round(scale * 100)}%</span>
                   <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500"><ZoomIn className="w-4 h-4" /></button>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-full flex items-center gap-2">
                <Lock className="w-3 h-3 text-amber-600" />
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Fields Locked</span>
             </div>
          </div>
        </div>

        <div className="flex-1 flex gap-8 min-h-0">
          {/* Left: Role Mapping Form */}
          <div className="w-[450px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
             <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-4 mb-2">
                   <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                      <Users className="w-5 h-5 text-emerald-600" />
                   </div>
                   <div>
                      <h3 className="text-[15px] font-bold text-slate-800">Recipient Mapping</h3>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Assign emails to roles</p>
                   </div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Document Title */}
                <section>
                   <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-3 ml-1">Document Title</label>
                   <input 
                     value={docTitle}
                     onChange={(e) => setDocTitle(e.target.value)}
                     placeholder="Request name..."
                     className="w-full h-[46px] px-4 border border-slate-200 rounded-xl text-[14px] font-semibold focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                   />
                </section>

                {/* Roles List */}
                <section className="space-y-4">
                   <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-2 ml-1">Assign Signers</label>
                   {template.roles.map((role, idx) => (
                     <div key={role} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:border-emerald-200 hover:bg-white transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-black border border-emerald-200/50">
                                 {idx + 1}
                              </div>
                              <span className="text-[13px] font-black text-slate-700 uppercase tracking-wider">{role}</span>
                           </div>
                           <div className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black rounded border border-slate-200 uppercase tracking-widest leading-none">Role</div>
                        </div>
                        
                        <div className="space-y-3">
                           <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                              <input 
                                placeholder="Full Name"
                                value={mapping[role].name}
                                onChange={(e) => handleInputChange(role, "name", e.target.value)}
                                className="w-full h-[38px] pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-[13px] font-medium focus:border-emerald-500 outline-none transition-all shadow-sm"
                              />
                           </div>
                           <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                              <input 
                                placeholder="Email Address"
                                value={mapping[role].email}
                                onChange={(e) => handleInputChange(role, "email", e.target.value)}
                                className="w-full h-[38px] pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-[13px] font-medium focus:border-emerald-500 outline-none transition-all shadow-sm"
                              />
                           </div>
                        </div>
                     </div>
                   ))}
                </section>
             </div>

             <div className="p-6 bg-slate-50 border-t border-slate-200">
                <button 
                  onClick={handleSend}
                  disabled={sending || Object.values(mapping).some(m => !m.email || !m.name)}
                  className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-[14px] font-bold hover:bg-emerald-700 transition active:scale-[0.98] shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Sending Documents..." : "Send Request Now"}
                </button>
             </div>
          </div>

          {/* Right: Document Preview */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
             <div className="flex-1 bg-slate-100/50 overflow-auto p-12 flex justify-center custom-scrollbar relative">
                <div className="relative bg-white shadow-2xl transition-all duration-300 border border-slate-200">
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

                    {/* Fixed Locked Fields Overlay */}
                    {template.fields.filter(f => f.page === currentPage).map(field => {
                      const roleName = template.roles[field.recipientId];
                      return (
                        <div
                          key={field.id}
                          style={{ 
                            left: field.x * scale, 
                            top: field.y * scale,
                          }}
                          className="absolute border-2 border-emerald-500/50 bg-emerald-50/90 rounded-md p-1.5 flex items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg backdrop-blur-[2px] transition-all hover:scale-110 active:scale-95 group z-10"
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
                               <span className="text-[10px] font-bold text-slate-700 truncate max-w-[80px]">{roleName}</span>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UseTemplate;
