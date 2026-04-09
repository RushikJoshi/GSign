import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import UploadStep from "../../components/request/UploadStep";
import SignersStep from "../../components/request/SignersStep";
import FieldEditorStep from "../../components/request/FieldEditorStep";
import { Check, Loader2 } from "lucide-react";
import { dmsApi } from "../../services/api";
import { useNavigate } from "react-router-dom";

const NewRequest = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({
    file: null,
    title: "",
    signers: [{ name: "", email: "", order: 1 }],
    isSequential: true,
    fields: []
  });
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();

  const handleNext = (stepData) => {
    setData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSend = async (stepData = {}) => {
    const mergedData = { ...data, ...stepData };
    setData(mergedData); // Persist fields/changes to state
    if (!mergedData.file || !mergedData.title || !mergedData.signers.length) return;

    setIsSending(true);
    try {
      // 1. Upload the document
      const formData = new FormData();
      formData.append("document", mergedData.file);
      formData.append("title", mergedData.title);
      formData.append("selfieRequired", mergedData.selfieRequired || false);

      const uploadRes = await dmsApi.uploadDocument(formData);
      const docId = uploadRes.data.document._id;

      // 2. Map fields to signer emails for backend signature embedding
      const mappedFields = (mergedData.fields || []).map(f => {
        const signer = mergedData.signers[f.recipientId];
        return {
          ...f,
          signerEmail: signer ? signer.email : null
        };
      });

      if (mappedFields.length > 0) {
        await dmsApi.updateFields(docId, { fields: mappedFields });
      }

      // 3. Add signers
      await dmsApi.addSigners(docId, {
        signers: mergedData.signers.map((s, i) => ({
          email: s.email,
          signingOrder: s.order || i + 1
        })),
        selfieRequired: mergedData.selfieRequired
      });

      // 4. Start signing flow (sends first email)
      await dmsApi.startSigningFlow(docId);

      // 5. Move to success step
      setIsSent(true);
      setCurrentStep(3);
    } catch (err) {
      console.error(err);
      alert("Failed to send request: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSending(false);
    }
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
            onSend={handleSend}
            isSending={isSending}
          />
        );
      case 3:
        return (
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded p-12 text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-8">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isSent ? "Document sent!" : "Ready to send?"}
            </h2>
            <p className="text-slate-500 mt-2">
              {isSent
                ? `Your document "${data.title}" has been sent to ${data.signers.length} signers.`
                : `Your document "${data.title}" will be sent to ${data.signers.length} signers.`}
            </p>

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

            {isSent ? (
              <div className="flex justify-center gap-4 mt-12">
                <button
                  onClick={() => navigate("/company-admin")}
                  className="px-8 py-2 bg-slate-900 hover:bg-slate-800 rounded font-bold text-white transition active:scale-95 shadow-sm"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-2 border border-slate-300 rounded font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Send another
                </button>
              </div>
            ) : (
              <div className="flex justify-center gap-4 mt-12">
                <button onClick={handleBack} disabled={isSending} className="px-8 py-2 border border-slate-300 rounded font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50">Go back</button>
                <button
                  onClick={() => handleSend({})}
                  disabled={isSending}
                  className="px-8 py-2 bg-[#249272] hover:bg-[#1e7a5f] rounded font-bold text-white transition active:scale-95 shadow-sm flex items-center gap-2 disabled:opacity-75"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSending ? "Sending..." : "Send Now"}
                </button>
              </div>
            )}
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
