import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { templateApi } from "../../services/api";
import UploadStep from "../../components/request/UploadStep";
import FieldEditorStep from "../../components/request/FieldEditorStep";
import { Users, FileText, ChevronRight, Check, Loader2 } from "lucide-react";

const AssignRolesStep = ({ onNext, onBack, initialRoles = [], isEdit }) => {
  const [roles, setRoles] = useState(initialRoles.length > 0 ? initialRoles : [""]);

  const addRole = () => setRoles([...roles, ""]);
  const updateRole = (index, value) => {
    const newRoles = [...roles];
    newRoles[index] = value;
    setRoles(newRoles);
  };
  const removeRole = (index) => setRoles(roles.filter((_, i) => i !== index));

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <h2 className="text-[20px] font-bold text-slate-800 mb-2 flex items-center gap-3">
          <Users className="w-6 h-6 text-[#249272]" /> 
          {isEdit ? "Edit Template Roles" : "Assign Template Roles"}
        </h2>
        <p className="text-[13px] text-slate-500 mb-8 font-medium italic">Define roles like "Customer", "Manager", or "HR" that will be filled when using this template.</p>

        <div className="space-y-4">
          {roles.map((role, index) => (
            <div key={index} className="flex items-center gap-3 group animate-in fade-in slide-in-from-left-2 transition-all">
               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-400 group-focus-within:bg-emerald-50 group-focus-within:text-emerald-500 transition-colors">
                  {index + 1}
               </div>
               <input 
                 value={role}
                 onChange={(e) => updateRole(index, e.target.value)}
                 placeholder="e.g. Employee, Manager, Client"
                 className="flex-1 h-[42px] px-4 border border-slate-200 rounded-lg text-[14px] font-medium outline-none focus:border-[#249272] focus:ring-1 focus:ring-[#249272]/20 transition-all placeholder:text-slate-300"
               />
               {roles.length > 1 && (
                 <button 
                   onClick={() => removeRole(index)}
                   className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors hover:bg-rose-50 rounded-lg"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 </button>
               )}
            </div>
          ))}
          
          <button 
            onClick={addRole}
            className="flex items-center gap-2 text-[13px] font-bold text-[#249272] hover:underline px-1 py-2 mt-2 transition-all active:translate-x-1"
          >
            + Add another role
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-slate-200 flex items-center justify-end px-12 gap-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={onBack}
          className="px-8 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition active:scale-95 shadow-sm"
        >
          Back
        </button>
        <button 
          onClick={() => onNext({ roles: roles.filter(r => r.trim()) })}
          disabled={roles.filter(r => r.trim()).length === 0}
          className="px-10 py-2 bg-[#249272] text-white rounded-lg text-[13px] font-bold disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-[#249272]/20 flex items-center gap-2"
        >
          {isEdit ? "Update and Continue" : "Continue"} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const CreateTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [step, setStep] = useState(isEdit ? 2 : 1);
  const [data, setData] = useState({
    title: "",
    file: null,
    roles: [],
    fields: [],
    templateId: id || null
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      const fetchTemplate = async () => {
        try {
          const res = await templateApi.getTemplate(id);
          const t = res.data.template;
          setData({
            title: t.name,
            file: t.filePath, // We will fetch this as blob if needed, but for editor we need a special logic if it's already on server
            roles: t.roles,
            fields: t.fields,
            templateId: t._id,
            originalName: t.originalName
          });
        } catch (err) {
          console.error(err);
          alert("Failed to load template for editing");
          navigate("/templates");
        } finally {
          setFetching(false);
        }
      };
      fetchTemplate();
    }
  }, [id, isEdit, navigate]);

  const handleUploadNext = async (uploadData) => {
    setData({ ...data, ...uploadData });
    setStep(2);
  };

  const handleRolesNext = async (rolesData) => {
    setLoading(true);
    try {
      if (isEdit || data.templateId) {
        // If editing existing or we already created the base record in this session, just update locally
        setData({ ...data, ...rolesData });
        setStep(3);
      } else {
        const formData = new FormData();
        formData.append("name", data.title);
        formData.append("file", data.file);
        formData.append("roles", JSON.stringify(rolesData.roles));

        const res = await templateApi.createTemplate(formData);
        setData({ ...data, ...rolesData, templateId: res.data.template._id });
        setStep(3);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process roles: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFieldsSend = async ({ fields }) => {
    setLoading(true);
    try {
      await templateApi.updateFields(data.templateId, { fields });
      navigate("/templates");
    } catch (err) {
      console.error(err);
      alert("Failed to save template fields");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
     return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
           <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
           <p className="mt-4 text-[14px] font-bold text-slate-500 uppercase tracking-widest">Loading Template...</p>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-12 py-4">
         <div className="flex items-center gap-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 1 ? 'bg-[#249272] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {step > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
               </div>
               <span className={`text-[12px] font-bold ${step === 1 ? 'text-[#249272]' : 'text-slate-400'}`}>Upload</span>
            </div>
            <div className="h-0.5 w-12 bg-slate-100"></div>
            <div className="flex items-center gap-2">
               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 2 ? 'bg-[#249272] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {step > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
               </div>
               <span className={`text-[12px] font-bold ${step === 2 ? 'text-[#249272]' : 'text-slate-400'}`}>Assign Roles</span>
            </div>
            <div className="h-0.5 w-12 bg-slate-100"></div>
            <div className="flex items-center gap-2">
               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 3 ? 'bg-[#249272] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  3
               </div>
               <span className={`text-[12px] font-bold ${step === 3 ? 'text-[#249272]' : 'text-slate-400'}`}>Place Fields</span>
            </div>
         </div>
      </div>

      {step === 1 && <UploadStep onNext={handleUploadNext} initialData={data} />}
      {step === 2 && <AssignRolesStep onNext={handleRolesNext} onBack={() => isEdit ? navigate("/templates") : setStep(1)} initialRoles={data.roles} isEdit={isEdit} />}
      {step === 3 && (
        <FieldEditorStep 
          onBack={() => setStep(2)} 
          data={{ 
            title: data.title, 
            file: isEdit ? templateApi.templateFileUrl(data.templateId) : data.file,
            signers: data.roles.map(r => ({ name: r, email: `role:${r}` })),
            fields: data.fields 
          }} 
          onSend={handleFieldsSend}
          isSending={loading}
          isTemplate={true}
        />
      )}
    </div>
  );
};

export default CreateTemplate;
