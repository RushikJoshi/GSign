import { useState } from "react";
import { X, Search, Plus, Minus, ChevronDown } from "lucide-react";
import Select from "../common/Select";

const AdvancedSearch = ({ isOpen, onClose }) => {
  const [criteria, setCriteria] = useState([{ property: "Document name", operator: "Contains", value: "" }]);
  const [category, setCategory] = useState("Sent documents");
  const [folder, setFolder] = useState("All");
  const [docType, setDocType] = useState("Any");

  if (!isOpen) return null;

  const addCriteria = () => {
    setCriteria([...criteria, { property: "Document name", operator: "Contains", value: "" }]);
  };

  const removeCriteria = (index) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter((_, i) => i !== index));
    }
  };

  const updateCriteria = (index, field, value) => {
    const newCriteria = [...criteria];
    newCriteria[index][field] = value;
    setCriteria(newCriteria);
  };

  const categoryOptions = [
    { value: "Sent documents", label: "Sent documents" },
    { value: "Received documents", label: "Received documents" },
    { value: "Drafts", label: "Drafts" }
  ];
  
  const folderOptions = [
    { value: "All", label: "All" },
    { value: "General", label: "General" },
    { value: "Confidential", label: "Confidential" }
  ];

  const docTypeOptions = [
    { value: "Any", label: "Any" },
    { value: "Signed", label: "Signed" },
    { value: "Declined", label: "Declined" },
    { value: "Expired", label: "Expired" }
  ];

  const propertyOptions = [
    { value: "Document name", label: "Document name" },
    { value: "Sender name", label: "Sender name" },
    { value: "Email", label: "Email" },
    { value: "Status", label: "Status" }
  ];

  const operatorOptions = [
    { value: "Contains", label: "Contains" },
    { value: "Starts with", label: "Starts with" },
    { value: "Ends with", label: "Ends with" },
    { value: "Is exactly", label: "Is exactly" }
  ];

  return (
    <div className="absolute top-[64px] left-0 right-0 bg-white border-b border-slate-200 shadow-2xl z-[55] animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto px-10 py-8">
        {/* Filter by Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
            <Select 
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              className="w-full bg-white border-slate-200 h-[38px] text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Folder</label>
            <Select 
              options={folderOptions}
              value={folder}
              onChange={setFolder}
              className="w-full bg-white border-slate-200 h-[38px] text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Document type</label>
            <Select 
              options={docTypeOptions}
              value={docType}
              onChange={setDocType}
              className="w-full bg-white border-slate-200 h-[38px] text-[13px]"
            />
          </div>
        </div>

        {/* Search Criteria Section */}
        <div className="border-t border-slate-100 pt-6 mb-8">
          <label className="text-[13px] font-bold text-slate-600 mb-4 block uppercase tracking-wider">Search criteria</label>
          <div className="space-y-3">
            {criteria.map((item, index) => (
              <div key={index} className="flex items-center gap-3 animate-in fade-in duration-300">
                <div className="w-[200px]">
                  <Select 
                    options={propertyOptions}
                    value={item.property}
                    onChange={(val) => updateCriteria(index, "property", val)}
                    className="w-full bg-white border-slate-200 h-[38px] text-[13px]"
                  />
                </div>

                <div className="w-[200px]">
                  <Select 
                    options={operatorOptions}
                    value={item.operator}
                    onChange={(val) => updateCriteria(index, "operator", val)}
                    className="w-full bg-white border-slate-200 h-[38px] text-[13px]"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Search word"
                  value={item.value}
                  onChange={(e) => updateCriteria(index, "value", e.target.value)}
                  className="flex-1 bg-white border border-slate-200 h-[38px] px-4 rounded text-[13px] outline-none focus:border-emerald-500 transition-all font-medium"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => removeCriteria(index)}
                    className="w-[38px] h-[38px] rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={addCriteria}
                    className="w-[38px] h-[38px] rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-[#249272] transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-start pt-2">
          <button className="bg-[#249272] hover:bg-[#1e7a5f] text-white px-8 h-10 rounded font-bold text-[13px] transition active:scale-95 shadow-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            onClick={onClose}
            className="px-8 h-10 border border-slate-200 rounded font-bold text-[13px] text-slate-600 hover:bg-slate-50 transition active:scale-95 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
