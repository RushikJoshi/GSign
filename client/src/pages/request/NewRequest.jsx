import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import UploadStep from "../../components/request/UploadStep";
import SignersStep from "../../components/request/SignersStep";
import FieldEditorStep from "../../components/request/FieldEditorStep";
import { Check } from "lucide-react";

const NewRequest = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({
    file: null,
    title: "",
    signers: [{ name: "", email: "", order: 1 }],
    isSequential: true,
    fields: []
  });

  const handleNext = (stepData) => {
    setData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <UploadStep onNext={handleNext} initialData={data} />;
      case 1:
        return <SignersStep onNext={handleNext} onBack={handleBack} initialData={data} />;
      case 2:
        return (
          <FieldEditorStep 
            onBack={handleBack} 
            data={data} 
          />
        );
      case 3:
        return (
           <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded p-12 text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-8">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Ready to send?</h2>
              <p className="text-slate-500 mt-2">Your document "{data.title}" will be sent to {data.signers.length} signers.</p>
              
              <div className="mt-10 p-6 bg-slate-50 border border-slate-200 rounded text-left">
                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Signer Order</span>
                 <ul className="space-y-3">
                   {data.signers.map((s, i) => (
                     <li key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-200">
                       <span className="font-bold text-slate-700">{i + 1}. {s.name}</span>
                       <span className="text-slate-500">{s.email}</span>
                     </li>
                   ))}
                 </ul>
              </div>

              <div className="flex justify-center gap-4 mt-12">
                 <button onClick={handleBack} className="px-8 py-2 border border-slate-300 rounded font-bold text-slate-600 hover:bg-slate-50 transition">Go back</button>
                 <button className="px-8 py-2 bg-[#249272] hover:bg-[#1e7a5f] rounded font-bold text-white transition active:scale-95 shadow-sm">Send Now</button>
              </div>
           </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="Sign" subtitle="Create and send a new signature request.">
      <div className="min-h-full">
        {renderStep()}
      </div>
    </DashboardLayout>
  );
};

export default NewRequest;
