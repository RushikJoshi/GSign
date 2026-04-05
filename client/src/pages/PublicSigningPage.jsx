import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { signingApi } from "../services/api";
import { Check, Shield, Mail, Loader2, PenTool, Layout, FileText } from "lucide-react";
import DocumentViewer from "../components/DocumentViewer";
import SignaturePad from "../components/SignaturePad";

const PublicSigningPage = () => {
    const { token } = useParams();
    const [step, setStep] = useState("loading"); // loading | identity | sign | completed
    const [meta, setMeta] = useState(null);
    const [error, setError] = useState("");
    
    // OTP States
    const [otpCode, setOtpCode] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    
    // Signature States
    const [signatureData, setSignatureData] = useState("");
    const [signingLoading, setSigningLoading] = useState(false);

    useEffect(() => {
        fetchDocumentDetails();
    }, [token]);

    const fetchDocumentDetails = async () => {
        try {
            const { data } = await signingApi.getDocument(token);
            setMeta(data);
            if (data.signer.isVerified) {
                setStep("sign");
            } else {
                setStep("identity");
                // Automatically send OTP when landing
                handleSendOTP(data.signer.email);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired signing link.");
            setStep("error");
        }
    };

    const handleSendOTP = async (email) => {
        try {
            await signingApi.sendOTP({ token, email });
        } catch (err) {
            console.error("Failed to re-send OTP", err);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setOtpLoading(true);
        setError("");
        try {
            await signingApi.verifyOTP({ token, email: meta.signer.email, otpCode });
            setStep("sign");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid verification code.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleFinalSign = async () => {
        if (!signatureData) {
            setError("Please provide your signature.");
            return;
        }
        setSigningLoading(true);
        setError("");
        try {
            await signingApi.signDocument({
                token,
                email: meta.signer.email,
                signatureData
            });
            setStep("completed");
        } catch (err) {
            setError(err.response?.data?.message || "Signing failed.");
        } finally {
            setSigningLoading(false);
        }
    };

    if (step === "loading") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#249272]" />
            </div>
        );
    }

    if (step === "error") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-md text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-20" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <div className="text-[12px] text-slate-400 border-t pt-4">
                        Please contact the document sender if you believe this is an error.
                    </div>
                </div>
            </div>
        );
    }

    if (step === "identity") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter">
                <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-[#249272] p-8 text-white text-center">
                        <Shield className="w-12 h-12 mx-auto mb-4 stroke-[1.5]" />
                        <h1 className="text-xl font-bold">Secure Verification</h1>
                        <p className="text-emerald-100 text-sm mt-1">To access the document, please verify your identity.</p>
                    </div>
                    
                    <form onSubmit={handleVerifyOTP} className="p-8 space-y-6">
                        <div className="space-y-4">
                           <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                              <Mail className="w-5 h-5 text-slate-400" />
                              <div className="flex-1">
                                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Recipient Email</p>
                                 <p className="text-[14px] text-slate-700 font-medium">{meta?.signer?.email}</p>
                              </div>
                           </div>
                           
                           <div className="space-y-2">
                              <label className="text-[13px] font-bold text-slate-600">Verification Code</label>
                              <input 
                                 type="text" 
                                 value={otpCode}
                                 onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                 placeholder="Enter 6-digit code"
                                 className="w-full h-12 bg-white border-2 border-slate-100 rounded-xl px-4 text-center text-xl font-bold tracking-[0.5em] focus:border-[#249272] outline-none transition-all placeholder:tracking-normal placeholder:text-slate-300"
                                 required
                              />
                              <p className="text-[12px] text-slate-400 text-center mt-2">
                                 We've sent a code to your email. It expires in 10 minutes.
                              </p>
                           </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 animate-shake">
                                <Shield className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={otpLoading || otpCode.length < 6}
                            className="w-full bg-[#249272] hover:bg-[#1e7a5f] disabled:bg-slate-200 text-white h-12 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify and Continue"}
                        </button>

                        <button 
                            type="button"
                            onClick={() => handleSendOTP(meta.signer.email)}
                            className="w-full text-[13px] text-emerald-600 font-bold hover:underline"
                        >
                            Resend Code
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (step === "sign") {
        return (
            <div className="min-h-screen bg-white flex flex-col font-inter">
                {/* Public Header */}
                <header className="h-16 border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#249272] p-1.5 rounded-lg shadow-sm">
                            <PenTool className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[15px] font-bold text-slate-800 truncate max-w-[200px] md:max-w-md">{meta?.document?.title}</h1>
                            <p className="text-[11px] text-slate-500">Public Signing Session • Secure Session</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-4">
                             <p className="text-[12px] font-bold text-slate-700">{meta?.signer?.email}</p>
                             <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                                <Shield className="w-3 h-3" /> Verified
                             </div>
                        </div>
                        <button 
                           onClick={handleFinalSign}
                           disabled={signingLoading || !signatureData}
                           className="bg-[#249272] hover:bg-[#1e7a5f] disabled:bg-slate-100 disabled:text-slate-400 text-white px-8 h-10 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center gap-2 active:scale-95"
                        >
                            {signingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Sign Document</>}
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-64px)] bg-slate-50">
                    {/* Document View */}
                    <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="bg-white p-2 rounded-xl shadow-xl ring-1 ring-slate-200">
                                <DocumentViewer fileUrl={signingApi.previewUrl(token)} />
                            </div>
                            <div className="h-20" /> {/* Spacer */}
                        </div>
                    </div>

                    {/* Signature Overlay - Side Panel mobile-friendly */}
                    <aside className="w-full md:w-[360px] bg-white border-l border-slate-200 p-6 flex flex-col justify-between shadow-2xl z-10">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                                    <PenTool className="w-5 h-5 text-[#249272]" /> Draw Signature
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Please provide your legal signature below to finalize this document.</p>
                            </div>
                            
                            <div className="aspect-[4/3] w-full ring-1 ring-slate-100 rounded-xl overflow-hidden bg-slate-50">
                                <SignaturePad 
                                    onChange={setSignatureData} 
                                    clearOnResize={false} 
                                    penColor="#000000"
                                />
                            </div>

                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                                <div className="flex gap-3">
                                    <FileText className="w-5 h-5 text-emerald-600 mt-0.5" />
                                    <div>
                                        <p className="text-[13px] font-bold text-emerald-800">Legal Disclosure</p>
                                        <p className="text-[11px] text-emerald-700/70 mt-0.5 leading-relaxed">
                                            By signing, you agree that this electronic signature is as legally binding as a handwritten signature. 
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 mt-6 flex flex-col gap-3">
                            {error && <p className="text-red-500 text-[12px] font-medium text-center">{error}</p>}
                            <p className="text-[11px] text-slate-400 text-center px-4">
                                Once signed, a copy of the completed document will be sent to all parties.
                            </p>
                        </div>
                    </aside>
                </main>
            </div>
        );
    }

    if (step === "completed") {
        return (
            <div className="min-h-screen bg-[#249272] flex items-center justify-center p-6 font-inter">
                <div className="bg-white w-full max-w-lg rounded-3xl p-10 text-center shadow-2xl animate-in fade-in zoom-in-90 duration-700">
                    <div className="w-24 h-24 bg-emerald-100 text-[#249272] rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
                        <Check className="w-12 h-12 stroke-[3]" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Document Executed!</h1>
                    <p className="text-slate-500 text-lg mb-10 leading-relaxed text-balance">
                        Great! You've successfully signed <strong>{meta?.document?.title}</strong>. All parties will be notified via email with a final copy for their records.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 border-t pt-8">
                        <div className="text-left bg-slate-50 p-4 rounded-2xl">
                             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Document ID</p>
                             <p className="text-[12px] font-mono text-slate-600 truncate">{meta?.document?.id}</p>
                        </div>
                        <div className="text-left bg-slate-50 p-4 rounded-2xl">
                             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Signed By</p>
                             <p className="text-[12px] font-bold text-slate-700">{meta?.signer?.email}</p>
                        </div>
                    </div>

                    <div className="mt-10">
                        <p className="text-[11px] text-slate-400">Powered by Gitakshmi Sign • Secure Enterprise Document Signing</p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default PublicSigningPage;
