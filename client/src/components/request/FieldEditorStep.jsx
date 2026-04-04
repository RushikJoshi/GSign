import { useState } from "react";
import { 
  FileText, 
  ChevronLeft, 
  Send, 
  Users, 
  Type, 
  Calendar, 
  Mail, 
  Stamp, 
  Image as ImageIcon, 
  PenTool,
  Search,
  Download,
  Printer,
  Maximize,
  ChevronDown
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FieldEditorStep = ({ onBack, data }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecipientId, setSelectedRecipientId] = useState(0);
  const [placedFields, setPlacedFields] = useState([]);

  const recipients = data.signers.map((s, i) => ({ 
    id: i, 
    name: s.name, 
    email: s.email, 
    color: i === 0 ? "bg-sky-100 border-sky-200 text-sky-800" : "bg-orange-100 border-orange-200 text-orange-800"
  }));

  const standardFields = [
    { type: "signature", label: "Signature", icon: PenTool },
    { type: "initial", label: "Initial", icon: Type },
    { type: "stamp", label: "Stamp", icon: Stamp },
    { type: "image", label: "Image", icon: ImageIcon },
    { type: "company", label: "Company", icon: FileText },
    { type: "fullname", label: "Full name", icon: Users },
    { type: "email", label: "Email", icon: Mail },
    { type: "signdate", label: "Sign date", icon: Calendar },
    { type: "date", label: "Date", icon: Calendar },
    { type: "text", label: "Text", icon: Type },
  ];

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const handleDrop = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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

  return (
    <div className="fixed inset-0 bg-slate-100 z-[100] flex flex-col overflow-hidden text-slate-800 font-sans">
      {/* Top Header */}
      <header className="h-[56px] bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <FileText className="w-5 h-5 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold truncate max-w-[200px]">{data.title || "Untitled"}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 ml-4">
            <span className="text-[12px] font-bold text-slate-600">{currentPage} of {numPages || "?"}</span>
          </div>
          <div className="flex items-center gap-2 ml-4 text-slate-400 border-l border-slate-100 pl-4">
            <Maximize className="w-4 h-4 cursor-pointer hover:text-slate-600" />
            <Download className="w-4 h-4 cursor-pointer hover:text-slate-600" />
            <Printer className="w-4 h-4 cursor-pointer hover:text-slate-600" />
            <Search className="w-4 h-4 cursor-pointer hover:text-slate-600" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-[14px] font-bold text-slate-600 px-4 hover:bg-slate-50 h-8 rounded transition">Actions</button>
          <button onClick={onBack} className="text-[14px] font-bold text-slate-600 px-4 hover:bg-slate-50 h-8 rounded border border-slate-200 bg-white">Back</button>
          <button className="bg-[#249272] text-white px-6 h-8 rounded text-[14px] font-bold flex items-center gap-2 hover:bg-[#1e7a5f] transition shadow-sm">
            Send <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Thumbnails */}
        <aside className="w-[120px] bg-white border-r border-slate-200 shrink-0 overflow-y-auto custom-scrollbar p-3 space-y-4">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Documents</h4>
          {Array.from({ length: numPages || 0 }).map((_, i) => (
            <div 
              key={i} 
              onClick={() => setCurrentPage(i + 1)}
              className={`cursor-pointer transition-all ${currentPage === i + 1 ? 'ring-2 ring-sky-500 rounded-sm' : 'opacity-60 hover:opacity-100'}`}
            >
              <div className="bg-slate-100 aspect-[1/1.4] rounded border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                Page {i + 1}
              </div>
            </div>
          ))}
        </aside>

        {/* Center Viewer Area */}
        <main className="flex-1 overflow-y-auto bg-slate-500/10 p-10 flex justify-center custom-scrollbar">
          <div 
             className="relative bg-white shadow-2xl"
             onDragOver={(e) => e.preventDefault()}
             onDrop={handleDrop}
          >
            {data.file && (
              <Document 
                file={data.file} 
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="p-10">Loading PDF...</div>}
              >
                <Page 
                  pageNumber={currentPage} 
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                  width={800}
                />
              </Document>
            )}

            {/* Placed Fields Overlay */}
            {placedFields.filter(f => f.page === currentPage).map(field => (
              <div 
                key={field.id}
                style={{ left: field.x, top: field.y }}
                className={`absolute p-2 rounded shadow-sm border text-[11px] font-bold transform -translate-x-1/2 -translate-y-1/2 ${recipients.find(r => r.id === field.recipientId)?.color || 'bg-white'}`}
              >
                {field.type.toUpperCase()}
              </div>
            ))}
          </div>
        </main>

        {/* Right Sidebar - Fields & Recipients */}
        <aside className="w-[280px] bg-white border-l border-slate-200 shrink-0 flex flex-col overflow-hidden">
          {/* Recipients Section */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-[12px] font-bold text-slate-600 mb-3 flex items-center justify-between">
              Recipients
              <ChevronDown className="w-4 h-4" />
            </h4>
            <div className="space-y-2">
              <div className="p-3 border border-slate-200 rounded-sm flex items-center gap-3 bg-white cursor-pointer hover:bg-slate-50 transition">
                 <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-500">P</div>
                 <span className="text-[13px] font-medium text-slate-700">Prefill by you</span>
              </div>
              {recipients.map(r => (
                 <div 
                  key={r.id} 
                  onClick={() => setSelectedRecipientId(r.id)}
                  className={`p-3 border rounded-sm flex items-center gap-3 cursor-pointer transition ${selectedRecipientId === r.id ? 'bg-sky-50 border-sky-400 ring-1 ring-sky-400' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                 >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[12px] font-bold text-emerald-600 uppercase">{r.name[0]}</div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-800 truncate leading-none mb-1">{r.name}</p>
                      <p className="text-[11px] text-slate-400 truncate leading-none">{r.email}</p>
                    </div>
                 </div>
              ))}
            </div>
          </div>

          {/* Standard Fields Section */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <h4 className="text-[12px] font-bold text-slate-600 mb-4 border-b border-slate-100 pb-2">Standard fields</h4>
            <div className="grid grid-cols-2 gap-2">
              {standardFields.map(field => (
                <div 
                  key={field.type}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("fieldType", field.type)}
                  className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-sm cursor-grab hover:bg-slate-50 transition active:cursor-grabbing bg-white group"
                >
                  <field.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500" />
                  <span className="text-[12px] font-bold text-slate-600 group-hover:text-slate-900">{field.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FieldEditorStep;
