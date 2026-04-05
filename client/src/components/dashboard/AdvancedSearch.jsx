import { useState } from "react";
import { X, Search, Plus, Minus, ChevronDown } from "lucide-react";

const AdvancedSearch = ({ isOpen, onClose }) => {
  const [criteria, setCriteria] = useState([{ property: "Document name", operator: "Contains", value: "" }]);

  if (!isOpen) return null;

  const addCriteria = () => {
    setCriteria([...criteria, { property: "Document name", operator: "Contains", value: "" }]);
  };

  const removeCriteria = (index) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="absolute top-[60px] left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-[100] animate-in slide-in-from-top duration-300">
      <div className="max-w-6xl mx-auto px-10 py-10">
        
        {/* Filter by Category Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="space-y-2">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <div className="relative group">
              <select className="w-full bg-slate-50 border border-slate-200 h-10 px-4 rounded text-[14px] text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white focus:border-emerald-500 transition-all shadow-sm">
                 <option>Sent documents</option>
                 <option>Received documents</option>
                 <option>Drafts</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Folder</label>
            <div className="relative group">
              <select className="w-full bg-slate-50 border border-slate-200 h-10 px-4 rounded text-[14px] text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white focus:border-emerald-500 transition-all shadow-sm">
                 <option>All</option>
                 <option>General</option>
                 <option>Confidential</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Document type</label>
            <div className="relative group">
              <select className="w-full bg-slate-50 border border-slate-200 h-10 px-4 rounded text-[14px] text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white focus:border-emerald-500 transition-all shadow-sm">
                 <option>Any</option>
                 <option>Signed</option>
                 <option>Declined</option>
                 <option>Expired</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Search Criteria Section */}
        <div className="border-t border-slate-100 pt-8 mb-10">
          <label className="text-[14px] font-bold text-slate-700 mb-4 block">Search criteria</label>
          <div className="space-y-4">
             {criteria.map((item, index) => (
               <div key={index} className="flex items-center gap-4 animate-in fade-in duration-300">
                  <div className="relative w-[300px]">
                    <select className="w-full bg-slate-50 border border-slate-200 h-10 px-4 rounded text-[14px] text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white focus:border-emerald-500 transition-all">
                       <option>Document name</option>
                       <option>Sender name</option>
                       <option>Email</option>
                       <option>Status</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative w-[300px]">
                    <select className="w-full bg-slate-50 border border-slate-200 h-10 px-4 rounded text-[14px] text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white focus:border-emerald-500 transition-all">
                       <option>Contains</option>
                       <option>Starts with</option>
                       <option>Ends with</option>
                       <option>Is exactly</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>

                  <input 
                    type="text" 
                    placeholder="Search word"
                    className="flex-1 bg-white border border-slate-200 h-10 px-4 rounded text-[14px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 transition-all"
                  />

                  <div className="flex gap-2">
                     <button 
                       onClick={() => removeCriteria(index)}
                       className="w-10 h-10 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition shadow-sm"
                     >
                        <Minus className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={addCriteria}
                       className="w-10 h-10 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-emerald-600 transition shadow-sm"
                     >
                        <Plus className="w-4 h-4" />
                     </button>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-4">
           <button className="bg-[#249272] hover:bg-[#1e7a5f] text-white px-10 h-11 rounded font-bold text-[14px] transition active:scale-95 shadow-lg shadow-emerald-700/10 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
           </button>
           <button 
             onClick={onClose}
             className="px-10 h-11 border border-slate-200 rounded font-bold text-[14px] text-slate-600 hover:bg-slate-50 transition shadow-sm"
           >
              Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
