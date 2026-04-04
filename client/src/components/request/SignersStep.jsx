import { useState } from "react";
import { Plus, GripVertical, Settings2, UserPlus, ChevronDown } from "lucide-react";

const SignersStep = ({ onNext, onBack, initialData }) => {
  const [signers, setSigners] = useState(initialData?.signers || [{ name: "", email: "", order: 1 }]);
  const [isSequential, setIsSequential] = useState(initialData?.isSequential ?? true);

  const addSigner = () => {
    setSigners([...signers, { name: "", email: "", order: signers.length + 1 }]);
  };

  const updateSigner = (index, field, value) => {
    const newSigners = [...signers];
    newSigners[index][field] = value;
    setSigners(newSigners);
  };

  const removeSigner = (index) => {
    if (signers.length > 1) {
      setSigners(signers.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="bg-white border-b border-slate-200 pb-2 mb-8">
        <h2 className="text-[20px] font-medium text-slate-800">Send for signatures</h2>
      </div>

      <div className="space-y-8">
        {/* Document Name Display */}
        <section>
          <div className="flex items-center gap-6">
            <label className="text-[13px] text-slate-600 w-32 font-medium">Document name</label>
            <input 
               value={initialData?.title}
               disabled
               className="flex-1 max-w-md h-[34px] px-3 border border-slate-200 bg-slate-50 rounded-sm text-[13px] text-slate-500"
            />
          </div>
        </section>

        {/* Recipients Section */}
        <section className="pt-4">
          <h3 className="text-[15px] font-bold text-slate-800 mb-6">Add recipients</h3>
          
          <div className="flex items-center gap-6 mb-6">
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isSequential} 
                  onChange={(e) => setIsSequential(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-[13px] text-slate-700 font-medium">Send in order</span>
             </label>
             <button className="text-[13px] text-sky-600 font-bold hover:underline">Add me</button>
          </div>

          <div className="space-y-3">
             {signers.map((signer, index) => (
               <div key={index} className="flex items-center gap-3 group relative pl-6">
                  {/* Blue highlight for current focus simulation */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex items-center gap-2 w-full max-w-4xl border border-slate-200 rounded-sm bg-white p-2 group-hover:border-sky-300 transition-colors">
                    <div className="flex items-center gap-2 px-2 border-r border-slate-100">
                      <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                      <span className="text-[12px] font-bold text-slate-500 w-4">{index + 1}</span>
                    </div>
                    
                    <input 
                      value={signer.email}
                      onChange={(e) => updateSigner(index, "email", e.target.value)}
                      placeholder="Email"
                      className="flex-1 h-[32px] px-3 text-[13px] outline-none focus:bg-slate-50 transition-colors"
                    />
                    
                    <input 
                      value={signer.name}
                      onChange={(e) => updateSigner(index, "name", e.target.value)}
                      placeholder="Name"
                      className="flex-1 h-[32px] px-3 border-l border-slate-100 text-[13px] outline-none focus:bg-slate-50 transition-colors"
                    />

                    <select className="h-[32px] px-3 border-l border-slate-100 text-[13px] text-slate-600 outline-none bg-transparent">
                       <option>Needs to sign</option>
                       <option>Receives a copy</option>
                       <option>Needs to view</option>
                    </select>

                    <div className="px-3 border-l border-slate-100 flex items-center text-slate-400">
                       <Settings2 className="w-4 h-4" />
                    </div>

                    <button 
                      className="flex items-center gap-2 px-4 py-1.5 border-l border-slate-100 text-[12px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                       Customize
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeSigner(index)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
               </div>
             ))}
          </div>

          <button 
            onClick={addSigner}
            className="mt-6 flex items-center gap-2 px-4 py-1.5 border border-slate-300 rounded-sm text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
             <Plus className="w-4 h-4" />
             Add recipient
          </button>
        </section>

        <section className="pt-8 border-t border-slate-100 space-y-8">
           <div className="space-y-6 max-w-4xl">
              <div>
                 <h3 className="text-[15px] font-bold text-slate-800 mb-4">Email setup</h3>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-2">Email subject</label>
                    <input 
                       type="text"
                       placeholder="Signature request for document"
                       className="w-full h-[34px] px-3 border border-slate-300 rounded-sm outline-none focus:border-sky-500 text-[13px]"
                    />
                 </div>

                 <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-2">Note to all recipients</label>
                    <textarea 
                       placeholder="Enter message for the recipients..."
                       className="w-full h-[120px] p-4 border border-slate-300 rounded-sm outline-none focus:border-sky-500 text-[13px] resize-none"
                    />
                 </div>
              </div>
           </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-[240px] right-0 h-[60px] bg-[#f8fafc] border-t border-slate-200 flex items-center px-8 gap-3 z-50">
        <button 
          onClick={() => onNext({ signers, isSequential })}
          className="px-6 py-1.5 bg-[#249272] text-white rounded text-[13px] font-bold transition-transform active:scale-95 shadow-sm"
        >
          Continue
        </button>
        <button 
          onClick={onBack}
          className="px-6 py-1.5 bg-white border border-slate-300 text-slate-600 rounded text-[13px] font-bold transition-colors hover:bg-slate-100"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SignersStep;
