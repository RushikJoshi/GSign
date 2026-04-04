import { useState } from "react";
import { FileText, Plus, ChevronDown } from "lucide-react";

const UploadStep = ({ onNext, initialData }) => {
  const [file, setFile] = useState(initialData?.file || null);
  const [title, setTitle] = useState(initialData?.title || "");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(".pdf", ""));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(".pdf", ""));
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="bg-white border-b border-slate-200 pb-2 mb-8">
        <h2 className="text-[20px] font-medium text-slate-800">Send for signatures</h2>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-[15px] font-bold text-slate-800 mb-6">Add documents</h3>
          
          <div className="flex gap-8 items-start">
            {/* Dropzone Area */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="w-[280px] h-[320px] border border-dashed border-slate-300 rounded flex flex-col items-center justify-center bg-white relative hover:border-sky-400 transition-colors"
            >
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
              />
              <div className="flex flex-col items-center gap-4">
                <FileText className="w-12 h-12 text-slate-300 stroke-[1px]" />
                <p className="text-[18px] font-medium text-slate-500">Drag files here</p>
                <p className="text-[13px] text-slate-400">or</p>
                <div className="flex items-center bg-[#249272] text-white rounded px-4 py-1.5 gap-2 text-[13px] font-semibold cursor-pointer pointer-events-none">
                  Add document <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              
              {file && (
                <div className="absolute -bottom-10 left-0 right-0 text-center">
                  <p className="text-[12px] font-bold text-sky-600 truncate px-2">{file.name}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="pt-8">
          <div className="flex items-center gap-6">
            <label className="text-[13px] text-slate-600 w-32 font-medium">Document name</label>
            <input 
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Enter name"
               className="flex-1 max-w-md h-[34px] px-3 border border-slate-300 rounded-sm text-[13px] outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-[240px] right-0 h-[60px] bg-[#f8fafc] border-t border-slate-200 flex items-center px-8 gap-3 z-50">
        <button 
          onClick={() => onNext({ file, title })}
          disabled={!file || !title}
          className="px-6 py-1.5 bg-[#249272] text-white rounded text-[13px] font-bold disabled:opacity-50 transition-transform active:scale-95 shadow-sm"
        >
          Continue
        </button>
        <button className="px-6 py-1.5 bg-white border border-slate-300 text-slate-600 rounded text-[13px] font-bold transition-colors hover:bg-slate-100">
          Close
        </button>
      </div>
    </div>
  );
};

export default UploadStep;
