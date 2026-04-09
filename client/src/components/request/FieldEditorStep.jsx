import { useState, useMemo } from "react";
import {
  FileText,
  ChevronLeft,
  Send,
  Users,
  Type,
  Calendar,
  Mail,
  PenTool,
  Search,
  Download,
  Printer,
  Maximize,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  Plus,
  Layout,
  Layers,
  ShieldCheck,
  Image,
  Building2,
  User,
  CaseSensitive
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker to version 5.4.296
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

const FieldEditorStep = ({ onBack, data, onSend, isSending, isTemplate }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecipientId, setSelectedRecipientId] = useState(0);
  const [placedFields, setPlacedFields] = useState(data.fields || []);
  const [scale, setScale] = useState(1.0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const ROLE_COLORS = [
    { bg: "bg-emerald-50", border: "border-emerald-400", text: "text-emerald-800", active: "bg-emerald-600", light: "bg-emerald-100", muted: "text-emerald-600" },
    { bg: "bg-indigo-50", border: "border-indigo-400", text: "text-indigo-800", active: "bg-indigo-600", light: "bg-indigo-100", muted: "text-indigo-600" },
    { bg: "bg-rose-50", border: "border-rose-400", text: "text-rose-800", active: "bg-rose-600", light: "bg-rose-100", muted: "text-rose-600" },
    { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-800", active: "bg-amber-600", light: "bg-amber-100", muted: "text-amber-600" },
    { bg: "bg-cyan-50", border: "border-cyan-400", text: "text-cyan-800", active: "bg-cyan-600", light: "bg-cyan-100", muted: "text-cyan-600" },
    { bg: "bg-violet-50", border: "border-violet-400", text: "text-violet-800", active: "bg-violet-600", light: "bg-violet-100", muted: "text-violet-600" },
    { bg: "bg-teal-50", border: "border-teal-400", text: "text-teal-800", active: "bg-teal-600", light: "bg-teal-100", muted: "text-teal-600" },
    { bg: "bg-orange-50", border: "border-orange-400", text: "text-orange-800", active: "bg-orange-600", light: "bg-orange-100", muted: "text-orange-600" },
  ];

  const recipients = data.signers.map((s, i) => {
    const colorSet = ROLE_COLORS[i % ROLE_COLORS.length];
    return {
      id: i,
      name: s.name,
      email: s.email,
      ...colorSet
    };
  });

  const standardFields = [
    { type: "signature", label: "Signature", icon: PenTool },
    { type: "initial", label: "Initial", icon: Type },
    { type: "fullname", label: "Full name", icon: Users },
    { type: "email", label: "Email", icon: Mail },
    { type: "signdate", label: "Sign date", icon: Calendar },
    { type: "date", label: "Date", icon: Calendar },
    { type: "text", label: "Text", icon: Type },
  ];

  const options = useMemo(() => ({
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@5.4.296/standard_fonts/`,
  }), []);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const handlePrint = () => {
    if (!data.file) return;
    const blobUrl = URL.createObjectURL(data.file);
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = blobUrl;
    document.body.appendChild(frame);
    frame.onload = () => {
      frame.contentWindow.print();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    };
  };

  const handleDownload = () => {
    if (!data.file) return;
    const url = URL.createObjectURL(data.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.title || "document.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    const fieldType = e.dataTransfer.getData("fieldType");

    if (fieldType) {
      setPlacedFields([...placedFields, {
        id: Date.now(),
        type: fieldType,
        x,
        y,
        page: currentPage,
        recipientId: selectedRecipientId
      }]);
    }
  };

  const deleteField = (id) => {
    setPlacedFields(placedFields.filter(f => f.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-[120] flex flex-col overflow-hidden animate-in fade-in duration-300">
      
      {/* Simple Header Bar */}
      <header className="h-[50px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-700">{data.title || "Untitled"}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black uppercase tracking-widest">Editor</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-100 mx-2" />

          <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 hover:bg-slate-50 rounded disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[11px] font-black text-slate-500 min-w-20 text-center">PAGE {currentPage} / {numPages || "?"}</span>
            <button onClick={() => setCurrentPage(p => Math.min(numPages || p, p + 1))} disabled={currentPage === numPages} className="p-1 hover:bg-slate-50 rounded disabled:opacity-20 rotate-180"><ChevronLeft className="w-4 h-4" /></button>
          </div>

          <div className="h-6 w-[1px] bg-slate-100 mx-2" />

          <div className="flex items-center gap-1 opacity-60">
            <button onClick={handleZoomOut} className="p-1 hover:bg-slate-50 rounded text-slate-600"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-[11px] font-bold text-slate-400 w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1 hover:bg-slate-50 rounded text-slate-600"><ZoomIn className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onBack} disabled={isSending} className="text-[12px] font-bold text-slate-500 uppercase px-4 h-8 hover:underline">Back</button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSending || placedFields.length === 0}
            className="bg-emerald-600 text-white px-6 h-8 rounded text-[12px] font-bold uppercase transition hover:bg-emerald-700 shadow-md active:scale-95 disabled:opacity-75"
          >
            {isSending ? "Processing..." : (isTemplate ? "Save Template" : "Send Request")}
          </button>
        </div>
      </header>

      {/* Main Formatted Designers Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Thumbnails: Extremely Simple */}
        <aside className="w-[110px] bg-white border-r border-slate-100 shrink-0 overflow-y-auto p-4 flex flex-col gap-3">
          {Array.from({ length: numPages || 0 }).map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`cursor-pointer transition-all ${currentPage === i + 1 ? 'ring-2 ring-emerald-500 rounded p-1 shadow-md' : 'opacity-40 hover:opacity-100'}`}
            >
              <div className="aspect-[1/1.4] bg-slate-100 rounded flex items-center justify-center text-[10px] font-black text-slate-300">
                PAGE {i + 1}
              </div>
            </div>
          ))}
        </aside>

        {/* Center Viewer Area: Clean Paper View */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center custom-scrollbar">
          <div
            className="relative bg-white shadow-xl transition-transform"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {data.file && (
              <Document
                file={data.file}
                options={options}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="p-20 font-bold text-slate-400">Rendering document...</div>}
              >
                <Page
                  pageNumber={currentPage}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  width={800}
                  scale={scale}
                />
              </Document>
            )}

            {/* Simple Floating Field Overlays */}
            {placedFields.filter(f => f.page === currentPage).map(field => {
              const r = recipients.find(res => res.id === field.recipientId);
              return (
                <div
                  key={field.id}
                  style={{ left: field.x * scale, top: field.y * scale }}
                  className={`absolute px-3 py-1.5 rounded-md shadow-lg border-2 text-[10px] font-black transform -translate-x-1/2 -translate-y-1/2 cursor-crosshair transition-all flex items-center gap-3 z-10 ${r?.bg || 'bg-white'} ${r?.border || 'border-slate-400'} ${r?.text || 'text-slate-800'}`}
                >
                  <span className="uppercase tracking-[1px]">{field.type}</span>
                  <X 
                    onClick={(e) => { e.stopPropagation(); deleteField(field.id) }} 
                    className={`w-3 h-3 transition-colors cursor-pointer opacity-50 hover:opacity-100 ${r?.muted || 'text-slate-400'}`} 
                  />
                </div>
              );
            })}
          </div>
        </main>

        {/* Right Tools Palette: Zoho-style Redesign */}
        <aside className="w-[320px] bg-white border-l border-slate-200 shrink-0 flex flex-col overflow-hidden">
          
          {/* Recipients Section */}
          <div className="flex flex-col border-b border-slate-100">
            <div className="p-4 border-b border-slate-100">
               <h3 className="text-[14px] font-bold text-slate-700">Recipients</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {recipients.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecipientId(r.id)}
                  className={`relative p-4 flex items-center gap-4 cursor-pointer transition-all border-b border-slate-50 last:border-0 ${selectedRecipientId === r.id ? 'bg-[#E6F7F2]' : 'hover:bg-slate-50'}`}
                >
                  {/* Active Indicator Bar */}
                  {selectedRecipientId === r.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#249272]" />
                  )}
                  
                  {/* Avatar Circle */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shadow-sm shrink-0 ${r.light} ${r.muted}`}>
                    {r.name[0]}
                  </div>
                  
                  <div className="min-w-0 pr-2">
                    <p className="text-[13px] font-bold text-slate-800 truncate leading-tight capitalize">{r.name}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[20px] bg-slate-100"></div>

          {/* Standard Fields Section */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="bg-slate-50 border-y border-slate-200 py-2.5 text-center px-4">
               <h3 className="text-[13px] font-bold text-slate-600">Standard fields</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
               <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "signature", label: "Signature", icon: PenTool },
                    { type: "initial", label: "Initial", icon: PenTool },
                    { type: "stamp", label: "Stamp", icon: ShieldCheck },
                    { type: "image", label: "Image", icon: Image },
                    { type: "company", label: "Company", icon: Building2 },
                    { type: "fullname", label: "Full name", icon: User },
                    { type: "email", label: "Email", icon: Mail },
                    { type: "signdate", label: "Sign date", icon: Calendar },
                    { type: "date", label: "Date", icon: Calendar },
                    { type: "text", label: "Text", icon: CaseSensitive }
                  ].map((field) => (
                    <div
                      key={field.type}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("fieldType", field.type)}
                      className="group flex items-center bg-white border border-slate-300 rounded overflow-hidden cursor-grab active:cursor-grabbing hover:border-emerald-500 transition-all shadow-sm"
                    >
                      {/* Drag Handle Dots Icon Shorthand */}
                      <div className="px-1.5 flex flex-col gap-[2px] py-2">
                         <div className="w-[3px] h-[3px] bg-slate-300 rounded-full" />
                         <div className="w-[3px] h-[3px] bg-slate-300 rounded-full" />
                         <div className="w-[3px] h-[3px] bg-slate-300 rounded-full" />
                         <div className="w-[3px] h-[3px] bg-slate-300 rounded-full" />
                         <div className="w-[3px] h-[3px] bg-slate-300 rounded-full" />
                      </div>
                      
                      <span className="flex-1 text-[11px] font-bold text-slate-600 px-1 truncate capitalize">
                        {field.label}
                      </span>
                      
                      <div className="w-8 h-full min-h-[32px] bg-[#249272] flex items-center justify-center text-white shrink-0">
                         <field.icon className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Simple Confirmation Modal Redesign */}
      {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[1px] z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-widest">{isTemplate ? "Save Template?" : "Ready to Send?"}</h3>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
                  {isTemplate ? "This will save your field placements for future use." : "This will distribute the document to your selected signers."}
                </p>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-[11px] font-bold text-slate-600">Document: {data.title}</p>
                    <p className="text-[11px] font-bold text-slate-600">Total Fields: {placedFields.length}</p>
                </div>
              </div>
              <div className="px-6 py-6 border-t border-slate-100 flex gap-4">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-6 h-10 border border-slate-300 rounded-lg font-black text-slate-400 text-[11px] uppercase tracking-widest hover:bg-slate-50">Go Back</button>
                <button onClick={() => { setShowConfirmModal(false); onSend({ fields: placedFields }); }} className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-black text-white text-[11px] uppercase tracking-widest transition shadow-md active:scale-95">{isTemplate ? "Save Now" : "Send Now"}</button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default FieldEditorStep;
