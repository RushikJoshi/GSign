import { useState, useRef, useEffect } from "react";
import ReactSignatureCanvas from "react-signature-canvas";
import { X, RotateCcw, Check, PenTool, Type, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * A comprehensive modal that captures a user signature using three modes:
 * Type, Draw, and Upload.
 */
const SignatureModal = ({ isOpen, onClose, onSave, title = "Create Your Signature", allowedModes = ["type", "draw", "upload"] }) => {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState("draw"); // 'draw' | 'type' | 'upload'
  
  // Draw Mode State
  const signatureRef = useRef(null);
  
  // Type Mode State
  const [typedName, setTypedName] = useState("");
  const [selectedFont, setSelectedFont] = useState("Dancing Script");
  const fonts = [
    { name: "Dancing Script", family: "'Dancing Script', cursive" },
    { name: "Great Vibes", family: "'Great Vibes', cursive" },
    { name: "Sacramento", family: "'Sacramento', cursive" },
    { name: "Allura", family: "'Allura', cursive" },
  ];
  
  // Upload Mode State
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
       const initialName = user.firstName && user.lastName 
         ? `${user.firstName} ${user.lastName}` 
         : (user.name || "");
       setTypedName(initialName);
       
       // Ensure active mode is one of the allowed ones
       if (!allowedModes.includes(activeMode)) {
          setActiveMode(allowedModes[0]);
       }
    }
  }, [isOpen, user, allowedModes]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (activeMode === "draw") {
      signatureRef.current?.clear();
    } else if (activeMode === "type") {
      setTypedName("");
    } else {
      setUploadedImage(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    let dataUrl = null;

    if (activeMode === "draw") {
      if (!signatureRef.current || signatureRef.current.isEmpty()) return;
      dataUrl = signatureRef.current.toDataURL("image/png");
    } 
    else if (activeMode === "type") {
      if (!typedName.trim()) return;
      // Convert typed text to DataURL using a hidden canvas
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `60px ${selectedFont}`;
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
      dataUrl = canvas.toDataURL("image/png");
    } 
    else if (activeMode === "upload") {
      if (!uploadedImage) return;
      dataUrl = uploadedImage;
    }

    if (dataUrl) {
      onSave(dataUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sf-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-[60px] border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
           <h3 className="text-[16px] font-bold text-slate-800">{title}</h3>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
           </button>
        </div>

        {/* Tab Controls - Only show if more than one mode is allowed */}
        {allowedModes.length > 1 && (
          <div className="px-6 py-4 flex gap-2 border-b border-slate-50 overflow-x-auto no-scrollbar bg-white">
             {[
               { id: "type", icon: Type, label: "Type" },
               { id: "draw", icon: PenTool, label: "Draw" },
               { id: "upload", icon: Upload, label: "Upload" }
             ].filter(m => allowedModes.includes(m.id)).map(mode => (
                <button 
                  key={mode.id} 
                  onClick={() => setActiveMode(mode.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded text-[14px] font-bold transition-all ${activeMode === mode.id ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  <mode.icon className="w-4 h-4" />
                  {mode.label}
                </button>
             ))}
          </div>
        )}

        {/* Content Area */}
        <div className="p-8 flex-1 flex flex-col min-h-[350px] overflow-y-auto custom-scrollbar">
           
           {/* TYPE MODE */}
           {activeMode === "type" && (
             <div className="flex-1 flex flex-col gap-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Type your name</label>
                  <input 
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Enter name here..."
                    className="w-full h-12 border-2 border-slate-100 rounded-lg px-4 text-[18px] focus:border-emerald-200 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   {fonts.map(font => (
                     <button 
                       key={font.name}
                       onClick={() => setSelectedFont(font.name)}
                       className={`p-6 border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-2 ${selectedFont === font.name ? "border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-50" : "border-slate-100 bg-slate-50/50 hover:bg-white"}`}
                     >
                        <span style={{ fontFamily: font.family }} className="text-[28px] text-slate-800 truncate w-full text-center">
                          {typedName || "Signature"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{font.name}</span>
                     </button>
                   ))}
                </div>
             </div>
           )}

           {/* DRAW MODE */}
           {activeMode === "draw" && (
             <div className="flex-1 flex flex-col relative bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-lg">
                <ReactSignatureCanvas
                  ref={signatureRef}
                  penColor="#0f172a"
                  canvasProps={{ 
                    style: { width: '100%', height: '100%' }, 
                    className: "flex-1 cursor-crosshair rounded-lg" 
                  }}
                />
                <button 
                  onClick={handleClear}
                  className="absolute top-4 right-4 p-2 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 text-slate-500 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
             </div>
           )}

           {/* UPLOAD MODE */}
           {activeMode === "upload" && (
             <div className="flex-1 flex flex-col">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                <div 
                   onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-slate-100'); }}
                   onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-slate-100'); }}
                   onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-slate-100'); handleFileChange({ target: e.dataTransfer }); }}
                   className="flex-1 border border-slate-200 rounded-sm bg-white flex flex-col items-center justify-center p-12 transition-all relative overflow-hidden"
                >
                   {uploadedImage ? (
                     <div className="relative w-full h-full flex items-center justify-center group/img">
                        <img src={uploadedImage} alt="Uploaded" className="max-h-[200px] border border-slate-100 shadow-sm" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                          className="absolute -top-4 -right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center text-center">
                        {/* Custom Icon mimicking the screenshot */}
                        <div className="relative mb-8 w-24 h-24">
                           {/* Dots and sparkles around icon */}
                           <div className="absolute -top-2 -left-2 w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                           <div className="absolute top-0 -right-2 w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                           <div className="absolute -bottom-2 left-6 w-1 h-1 rounded-full bg-slate-300"></div>
                           <div className="absolute top-1/2 -right-4 w-1 h-1 rounded-full bg-emerald-300 rotate-45"></div>
                           <div className="absolute -left-4 top-1/2 text-rose-400 font-bold text-[12px]">+</div>
                           <div className="absolute -right-6 top-1 text-sky-400 font-bold text-[10px]">+</div>
                           
                           {/* Document Icon */}
                           <div className="w-full h-full border-2 border-slate-100 rounded-sm bg-white relative flex flex-col items-center justify-center">
                              <div className="absolute top-0 right-0 w-8 h-8 border-l border-b border-slate-100 bg-emerald-50 rounded-bl"></div>
                              <div className="w-12 h-0.5 bg-slate-100 mb-2 mt-4 ml-[-4px]"></div>
                              <div className="w-12 h-0.5 bg-slate-100 mb-2 ml-[-4px]"></div>
                              <div className="w-12 h-0.5 bg-slate-100 ml-[-4px]"></div>
                           </div>
                        </div>

                        <h4 className="text-[18px] font-medium text-slate-700 tracking-tight">Drag files here</h4>
                        <p className="text-[14px] text-slate-500 mt-1 mb-8">or</p>
                        
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          type="button" 
                          className="px-8 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-[13px] font-bold text-slate-700 transition shadow-sm"
                        >
                          Upload
                        </button>
                     </div>
                   )}
                </div>
             </div>
           )}
           
           <p className="text-[12px] text-slate-400 font-medium mt-6 leading-tight italic">
              By clicking "Create", I agree that this signature/initial will be stored as an electronic representation.
           </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-6 py-2 border border-slate-300 rounded text-[13px] font-bold text-slate-600 hover:bg-white transition"
           >
              {activeMode === 'upload' ? 'Close' : 'Cancel'}
           </button>
           <button 
             onClick={handleSave}
             disabled={(activeMode === 'type' && !typedName) || (activeMode === 'upload' && !uploadedImage)}
             className="px-10 py-2 bg-[#249272] hover:bg-[#1e7a5f] text-white rounded text-[13px] font-bold transition shadow-sm disabled:opacity-50"
           >
              {activeMode === 'upload' && !uploadedImage ? 'Create' : 'Create'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
