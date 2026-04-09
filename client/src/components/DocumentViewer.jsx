import { useMemo } from "react";
import { Page } from "react-pdf";
import { Check, PenTool, Calendar, Mail, User, Type, ShieldCheck, Image as ImageIcon, Building2 } from "lucide-react";

const DocumentViewer = ({ 
    pageNumber = 1, 
    scale = 1.0, 
    fields = [], 
    onFieldClick, 
    completedFields = [],
    fieldValues = {}
}) => {
  const BASE_WIDTH = 800;

  const getFieldAttributes = (type) => {
    switch(type?.toLowerCase()) {
        case "signature": return { label: "Sign Here", icon: PenTool };
        case "initial": return { label: "Initial", icon: Type };
        case "date": return { label: "Date", icon: Calendar };
        case "signdate": return { label: "Sign Date", icon: Calendar };
        case "email": return { label: "Email", icon: Mail };
        case "fullname": return { label: "Name", icon: User };
        case "text": return { label: "Text", icon: Type };
        case "company": return { label: "Company", icon: Building2 };
        case "stamp": return { label: "Stamp", icon: ShieldCheck };
        case "image": return { label: "Image", icon: ImageIcon };
        default: return { label: type || "Field", icon: PenTool };
    }
  };

  return (
    <div className="flex flex-col items-center bg-[#eef0f2] min-h-full py-8">
      <div className="bg-white shadow-2xl rounded-sm ring-1 ring-slate-200 overflow-hidden relative select-none">
        {/* Page rendered within the parent Document context from PublicSigningPage */}
        <Page 
          pageNumber={pageNumber} 
          width={BASE_WIDTH} 
          scale={scale}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="shadow-sm"
          loading={
            <div className="w-[800px] aspect-[1/1.41] flex items-center justify-center bg-white">
               <p className="text-sm text-slate-400 font-bold animate-pulse uppercase tracking-widest">Rendering Page {pageNumber}...</p>
            </div>
          }
        />

        {/* Real-time Field Overlays */}
        <div className="absolute inset-0 pointer-events-none">
             {fields.filter(f => f.page === pageNumber).map((field, idx) => {
                 const isCompleted = completedFields.includes(field.id);
                 const { label, icon: FieldIcon } = getFieldAttributes(field.type);
                 const value = fieldValues[field.id];

                 return (
                     <div
                         key={field.id}
                         onClick={() => onFieldClick?.(field)}
                         style={{ 
                             left: field.x * scale, 
                             top: field.y * scale,
                             width: (field.width || 140) * scale,
                             height: (field.height || 45) * scale
                         }}
                         className={`absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer transition-all border-2 flex items-center justify-center group
                            ${isCompleted 
                                ? 'bg-white/90 border-transparent shadow-sm' 
                                : 'bg-[#fff9c4]/60 border-[#fbc02d] border-dashed hover:bg-[#fff9c4]/90 hover:scale-[1.02] active:scale-95'
                            }`}
                     >
                         {isCompleted ? (
                             <div className="flex items-center justify-center w-full h-full p-1 overflow-hidden">
                                  {["signature", "initial"].includes(field.type?.toLowerCase()) ? (
                                      <img src={value} alt="Signature" className="max-h-full max-w-full object-contain" />
                                  ) : (
                                      <span className="text-[13px] font-bold text-slate-900 truncate px-2">{value}</span>
                                  )}
                             </div>
                         ) : (
                             <div className="flex flex-col items-center gap-0.5">
                                 <FieldIcon className="w-4 h-4 text-[#f57f17] group-hover:scale-110 transition-transform font-bold" />
                                 <span className="text-[9px] font-bold text-[#f57f17] uppercase tracking-[1px]">{label}</span>
                             </div>
                         )}

                         {!isCompleted && !idx && (
                              <div className="absolute inset-0 border-2 border-orange-400 animate-ping opacity-50 rounded-full scale-50" />
                         )}
                     </div>
                 );
             })}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
