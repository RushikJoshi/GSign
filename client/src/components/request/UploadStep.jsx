import { useState, useRef } from "react";
import { FileText, Plus, ChevronDown, MoreHorizontal, Trash2, FileUp } from "lucide-react";

const UploadStep = ({ onNext, initialData }) => {
  const [file, setFile] = useState(initialData?.file || null);
  const [title, setTitle] = useState(initialData?.title || "");
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setTitle(selected.name.replace(".pdf", ""));
      setShowMenu(false);
    }
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      if (!title || title === "") setTitle(selected.name.replace(".pdf", ""));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 py-12 px-6 animate-in fade-in duration-300">
      
      <div className="space-y-8">
        {/* Simple Document Select */}
        <section className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload File</label>
          
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`w-full max-w-xl py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-white hover:border-emerald-500 hover:bg-slate-50 transition-all cursor-pointer relative ${file ? 'border-emerald-200 bg-emerald-50/10' : ''}`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            />
            
            <div className="flex flex-col items-center text-center px-4">
              <FileUp className={`w-10 h-10 mb-4 transition-colors ${file ? 'text-emerald-500' : 'text-slate-300'}`} />
              {file ? (
                <div>
                   <p className="text-[14px] font-bold text-slate-800 truncate max-w-[300px]">{file.name}</p>
                   <p className="text-[12px] text-emerald-600 font-bold mt-1">Successfully attached</p>
                </div>
              ) : (
                <div>
                   <p className="text-[15px] font-bold text-slate-600">Drag PDF here or click to browse</p>
                   <p className="text-[11px] text-slate-400 mt-1">Only PDF format is supported</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Simple Document Title */}
        <section className="space-y-4">
           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document Name</label>
           <input 
             value={title}
             onChange={(e) => setTitle(e.target.value)}
             placeholder="Enter document title..."
             className="w-full h-10 px-4 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-emerald-500 outline-none transition-all shadow-sm"
           />
           <p className="text-[11px] text-slate-400 italic">This name will be shown to the signers.</p>
        </section>
      </div>

      {/* Very Simple Compact Footer Actions */}
      {/* Very Simple Compact Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-slate-200 flex items-center justify-end px-12 gap-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => window.location.href = "/company-admin"}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-500 rounded font-bold text-[13px] hover:bg-slate-50 transition shadow-sm uppercase"
          >
            Cancel
          </button>
          <button 
            onClick={() => onNext({ file, title })}
            disabled={!file || !title}
            className="px-10 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[13px] disabled:opacity-30 transition shadow-md uppercase"
          >
            Continue
          </button>
      </div>
    </div>
  );
};

export default UploadStep;
