import { useState, useMemo } from "react";
import { Plus, GripVertical, Settings2, UserPlus, ChevronDown, Shield, MessageSquare, X, Check, Users, Mail, Type, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Select from "../common/Select";

const SignersStep = ({ onNext, onBack, initialData }) => {
  const { user } = useAuth();
  const [signers, setSigners] = useState(initialData?.signers || [{
    name: "",
    email: "",
    order: 1,
    role: "sign",
    authentication: false,
    privateNote: ""
  }]);
  const [isSequential, setIsSequential] = useState(initialData?.isSequential ?? true);
  const [selfieRequired, setSelfieRequired] = useState(initialData?.selfieRequired ?? false);

  const roleOptions = [
    { value: "sign", label: "NEEDS TO SIGN" },
    { value: "copy", label: "RECEIVES COPY" },
    { value: "view", label: "NEEDS TO VIEW" }
  ];

  const addSigner = () => {
    setSigners([...signers, {
      name: "",
      email: "",
      order: signers.length + 1,
      role: "sign",
      authentication: false,
      privateNote: ""
    }]);
  };

  const handleAddMe = () => {
    if (!user) return;
    const alreadyPresent = signers.some(s => s.email === user.email);
    if (!alreadyPresent) {
      setSigners([...signers, {
        name: user.name,
        email: user.email,
        order: signers.length + 1,
        role: "sign",
        authentication: false,
        privateNote: ""
      }]);
    }
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
    <div className="w-full max-w-6xl space-y-8 animate-in fade-in duration-300">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recipients List</label>
          <button onClick={handleAddMe} className="text-[12px] font-bold text-emerald-600 hover:underline">Add me as signer</button>
        </div>

        {/* Minimal Signer Rows */}
        <div className="space-y-3 max-w-3xl">
          {signers.map((signer, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-3 items-start border border-slate-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex items-center gap-3 shrink-0">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-black tracking-widest text-slate-400">{index + 1}</span>
              </div>
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={signer.name}
                  onChange={(e) => updateSigner(index, "name", e.target.value)}
                  placeholder="Signer Name"
                  className="w-full h-9 px-3 border border-slate-200 rounded text-[13.5px] font-medium outline-none focus:border-emerald-500 transition-all font-inter"
                />
                <input
                  value={signer.email}
                  onChange={(e) => updateSigner(index, "email", e.target.value)}
                  placeholder="Email Address"
                  className="w-full h-9 px-3 border border-slate-200 rounded text-[13.5px] font-medium outline-none focus:border-emerald-500 transition-all font-inter"
                />
              </div>
              <div className="flex items-center gap-2 pt-2 md:pt-0">
                <Select
                  value={signer.role}
                  onChange={(val) => updateSigner(index, "role", val)}
                  options={roleOptions}
                  className="min-w-[170px]"
                />
                <button onClick={() => removeSigner(index)} className="p-2 text-slate-300 hover:text-red-500 transition active:scale-90">
                  <Plus className="w-4 h-4 rotate-45 stroke-[3px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addSigner} className="text-emerald-600 font-bold text-[13px] flex items-center gap-2 hover:underline">
          <Plus className="w-4 h-4" /> Add another recipient
        </button>

        <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isSequential}
              onChange={(e) => setIsSequential(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
            />
            <span className="text-[13px] text-slate-600 font-bold">Send in order (1, 2, 3...)</span>
          </label>
          <div className="w-[1px] h-4 bg-slate-200" />
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={selfieRequired}
              onChange={(e) => setSelfieRequired(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
            />
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 transition-colors ${selfieRequired ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span className="text-[13px] text-slate-600 font-bold">Require Selfie Verification</span>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-8 space-y-6">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4 border-b border-slate-100 pb-2">Message Setup</label>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Email Subject"
            className="w-full h-10 px-4 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-emerald-500 outline-none transition-all shadow-sm"
          />
          <textarea
            placeholder="Message for the recipients (optional)"
            className="w-full h-[120px] p-4 border border-slate-200 rounded-lg text-[14px] font-medium focus:border-emerald-500 outline-none transition-all shadow-sm resize-none"
          />
        </div>
      </div>

      {/* Simple Footer Actions */}
      <div className="fixed bottom-0 left-[100px] right-0 h-[64px] bg-white border-t border-slate-100 flex items-center justify-end px-12 gap-3 z-40">
        <button onClick={() => window.location.href = "/company-admin"} className="px-6 py-2 bg-white border border-slate-200 text-slate-500 rounded font-bold text-[13px] hover:bg-slate-50 shadow-sm transition-all uppercase">Close</button>
        <button onClick={onBack} className="px-6 py-2 bg-white border border-slate-300 text-slate-600 rounded font-bold text-[13px] hover:bg-slate-50 shadow-sm transition-all uppercase">Back</button>
        <button
          onClick={() => onNext({ signers, isSequential, selfieRequired })}
          className="px-10 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[13px] transition shadow-lg shadow-emerald-500/20 active:scale-95 uppercase"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default SignersStep;
