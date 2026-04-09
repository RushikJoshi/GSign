import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import UploadStep from "../../components/request/UploadStep";
import FieldEditorStep from "../../components/request/FieldEditorStep";
import { Check, Loader2 } from "lucide-react";
import { dmsApi } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SignYourself = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({
    file: null,
    title: "",
    signers: [],
    isSequential: true,
    fields: []
  });
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();

  const handleNext = (stepData) => {
    // For sign yourself, the user IS the signer.
    if (currentStep === 0) {
       setData(prev => ({ 
         ...prev, 
         ...stepData, 
         signers: [{ name: user.name, email: user.email, order: 1 }] 
       }));
       setCurrentStep(2); // Skip recipient selection
    } else {
       setData(prev => ({ ...prev, ...stepData }));
       setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(0);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSend = async (stepData = {}) => {
    const mergedData = { ...data, ...stepData };
    setData(mergedData);
    if (!mergedData.file || !mergedData.title) return;

    setIsSending(true);
    try {
      // 1. Upload the document
      const formData = new FormData();
      formData.append("document", mergedData.file);
      formData.append("title", mergedData.title);

      const uploadRes = await dmsApi.uploadDocument(formData);
      const docId = uploadRes.data.document._id;

      // 2. Map fields to the current user's email
      const mappedFields = (mergedData.fields || []).map(f => ({
        ...f,
        signerEmail: user.email
      }));

      if (mappedFields.length > 0) {
        await dmsApi.updateFields(docId, { fields: mappedFields });
      }

      // 3. Add self as signer
      await dmsApi.addSigners(docId, {
        signers: [{ email: user.email, signingOrder: 1 }]
      });

      // 4. Start signing flow (sends email BUT we can redirect to sign too)
      await dmsApi.startSigningFlow(docId);

      // 5. Move to success step or redirect to sign
      setIsSent(true);
      setCurrentStep(3);
    } catch (err) {
      console.error(err);
      alert("Failed to create request: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSending(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <UploadStep onNext={handleNext} initialData={data} />;
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
            <h2 className="text-2xl font-bold text-slate-900">Document created!</h2>
            <p className="text-slate-500 mt-2">
              Your document "{data.title}" is ready and waiting for your signature.
            </p>

            <div className="flex justify-center gap-4 mt-12">
              <button
                onClick={() => navigate("/my-documents")}
                className="px-8 py-2 bg-slate-900 hover:bg-slate-800 rounded font-bold text-white transition active:scale-95 shadow-sm"
              >
                Sign Now
              </button>
              <button
                onClick={() => navigate("/company-admin")}
                className="px-8 py-2 border border-slate-300 rounded font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="Sign yourself" subtitle="Upload and sign a document yourself.">
      <div className="min-h-full pb-10">
        {renderStep()}
      </div>
    </DashboardLayout>
  );
};

export default SignYourself;
