import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { signingApi } from "../services/api";
import {
    Check, Shield, Mail, Loader2, PenTool, Layout, FileText,
    Columns, ChevronUp, ChevronDown, ZoomIn, ZoomOut,
    Download, Printer, Search, Maximize
} from "lucide-react";
import DocumentViewer from "../components/DocumentViewer";
import SignaturePad from "../components/SignaturePad";
import SelfieCaptureModal from "../components/SelfieCaptureModal";
import { Document, Page, pdfjs } from "react-pdf";

// Optimized worker for react-pdf v9+ 
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

const PublicSigningPage = () => {
    const { token } = useParams();
    const [step, setStep] = useState("loading"); // loading | identity | sign | completed
    const [meta, setMeta] = useState(null);
    const [error, setError] = useState("");

    // PDF States
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    // UI States
    const [isLeftSideOpen, setIsLeftSideOpen] = useState(true);
    const [isRightSideOpen, setIsRightSideOpen] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // OTP States
    const [otpCode, setOtpCode] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);

    // Signature/Field States
    const [signatureData, setSignatureData] = useState("");
    const [signingLoading, setSigningLoading] = useState(false);
    const [completedFields, setCompletedFields] = useState([]);
    const [activeField, setActiveField] = useState(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signatureType, setSignatureType] = useState("draw"); // draw | type | upload
    const [typedName, setTypedName] = useState("");
    const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
    const [fieldValues, setFieldValues] = useState({});
    const [showSelfieModal, setShowSelfieModal] = useState(false);

    useEffect(() => {
        fetchDocumentDetails();
    }, [token]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
    const handlePrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

    const handlePrint = () => {
        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        frame.src = signingApi.previewUrl(token);
        document.body.appendChild(frame);
        frame.contentWindow.focus();
        frame.contentWindow.print();
    };

    const handleDownload = () => {
        window.open(signingApi.previewUrl(token), '_blank');
    };

    const fetchDocumentDetails = async () => {
        try {
            const { data } = await signingApi.getDocument(token);
            setMeta(data);

            if (data.signer.status === "signed") {
                setStep("completed");
            } else if (data.document.signingMode === "sequential" && !data.signer.isActive) {
                setStep("waiting");
            } else if (data.signer.isVerified) {
                setStep("sign");
            } else {
                setStep("identity");
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
        if (fieldsRemaining > 0) {
            setError("Please complete all signature fields before submitting.");
            return;
        }

        setError("");

        try {
            // Check for Selfie Requirement
            if (meta?.document?.selfieRequired && !meta?.signer?.selfie?.url) {
                setShowSelfieModal(true);
                return;
            }

            setSigningLoading(true);
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

    const handleSelfieCapture = async (selfieImage) => {
        try {
            const { data } = await signingApi.uploadSelfie({
                token,
                email: meta.signer.email,
                selfieImage,
                device: navigator.userAgent
            });

            // Update meta with the new selfie info so the UI knows we're verified
            setMeta(prev => ({
                ...prev,
                signer: {
                    ...prev.signer,
                    selfie: { url: data.selfieUrl }
                }
            }));
            setShowSelfieModal(false);

            // Directly trigger final signing since selfie was the last hurdle
            handleFinalSign();
        } catch (err) {
            setError(err.response?.data?.message || "Selfie upload failed. Please try again.");
            setShowSelfieModal(false);
        }
    };

    const currentSignerFields = useMemo(() => {
        if (!meta?.document?.fields) return [];
        const signerOrderIndex = (meta?.signer?.signingOrder || 1) - 1;
        const signerEmail = meta?.signer?.email?.toLowerCase();

        return meta.document.fields.filter(f =>
            f.recipientId === signerOrderIndex ||
            f.recipientId === signerEmail ||
            f.signerEmail?.toLowerCase() === signerEmail
        );
    }, [meta]);

    const fieldsRemaining = currentSignerFields.length - completedFields.length;

    const handleFieldClick = (field) => {
        if (completedFields.includes(field.id)) return;

        const type = field.type?.toLowerCase();

        // Auto-fill fields that don't need a modal
        if (["signdate", "date", "fullname", "email", "company"].includes(type)) {
            let val = "";
            const now = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY

            if (type === "signdate" || type === "date") val = now;
            else if (type === "fullname") val = meta?.signer?.name || "";
            else if (type === "email") val = meta?.signer?.email || "";

            setFieldValues(prev => ({ ...prev, [field.id]: val }));
            setCompletedFields(prev => [...prev, field.id]);
            return;
        }

        setActiveField(field);
        setShowSignatureModal(true);
    };

    const handleApplySignature = (signature, applyToAll = false) => {
        if (!signature && !signatureData) return;

        const finalSignature = signature || signatureData;
        setSignatureData(finalSignature);

        let newCompleted = [...completedFields];
        let newValues = { ...fieldValues };

        if (applyToAll) {
            currentSignerFields.forEach(f => {
                const type = f.type?.toLowerCase();
                const isSig = ["signature", "initial"].includes(type);
                const isAutoFill = ["signdate", "date", "fullname", "email", "company"].includes(type);

                if (isSig) {
                    newValues[f.id] = finalSignature;
                    if (!newCompleted.includes(f.id)) newCompleted.push(f.id);
                } else if (isAutoFill) {
                    let val = "";
                    const now = new Date().toLocaleDateString('en-GB');
                    if (type === "signdate" || type === "date") val = now;
                    else if (type === "fullname") val = meta?.signer?.name || "";
                    else if (type === "email") val = meta?.signer?.email || "";

                    newValues[f.id] = val;
                    if (!newCompleted.includes(f.id)) newCompleted.push(f.id);
                }
            });
        } else if (activeField) {
            newValues[activeField.id] = finalSignature;
            if (!newCompleted.includes(activeField.id)) newCompleted.push(activeField.id);
        }

        setFieldValues(newValues);
        setCompletedFields(newCompleted);
        setShowSignatureModal(false);
        setActiveField(null);
    };

    const documentOptions = useMemo(() => ({
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@5.4.296/standard_fonts/`,
    }), []);

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
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2">
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
                <header className="h-[52px] border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 bg-white z-20 shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsLeftSideOpen(!isLeftSideOpen)}
                            className={`p-1.5 hover:bg-slate-100 rounded transition-colors ${isLeftSideOpen ? 'text-[#249272] bg-emerald-50' : 'text-slate-600'}`}
                        >
                            <Columns className="w-[18px] h-[18px]" />
                        </button>

                        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                        <div className="flex items-center gap-2">
                            <h1 className="text-[14px] font-bold text-slate-800 truncate max-w-[150px]">{meta?.document?.title}</h1>
                            <div className="flex items-center gap-2 ml-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${fieldsRemaining > 0 ? 'bg-orange-400 animate-pulse' : 'bg-emerald-500'}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${fieldsRemaining > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                    {fieldsRemaining > 0 ? `${fieldsRemaining} Fields Left` : "Ready to Sign"}
                                </span>
                            </div>
                        </div>

                        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                        <div className="flex items-center gap-2">
                            <button onClick={handlePrevPage} disabled={pageNumber === 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 text-slate-600">
                                <ChevronUp className="w-4 h-4" />
                            </button>
                            <button onClick={handleNextPage} disabled={pageNumber === (numPages || 1)} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 text-slate-600">
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1.5 ml-2">
                                <span className="text-[13px] text-slate-500 font-bold">{pageNumber} of {numPages || '-'}</span>
                            </div>
                        </div>

                        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                        <div className="flex items-center gap-1">
                            <button onClick={handleZoomOut} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                                <ZoomOut className="w-[18px] h-[18px]" />
                            </button>
                            <button onClick={handleZoomIn} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                                <ZoomIn className="w-[18px] h-[18px]" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleFinalSign}
                            disabled={signingLoading || fieldsRemaining > 0}
                            className={`px-6 h-[34px] rounded font-bold text-[13px] transition-all shadow-sm flex items-center gap-2 active:scale-95 ${fieldsRemaining === 0 ? 'bg-[#249272] hover:bg-[#1e7a5f] text-white shadow-emerald-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                        >
                            {signingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Finish Signing</>}
                        </button>
                        <button
                            onClick={() => setIsRightSideOpen(!isRightSideOpen)}
                            className={`p-1.5 hover:bg-slate-100 rounded transition-colors ${isRightSideOpen ? 'text-[#249272] bg-emerald-50' : 'text-slate-600'}`}
                        >
                            <Layout className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Root Document context for synchronized multi-view rendering */}
                <Document
                    file={signingApi.previewUrl(token)}
                    options={documentOptions}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex-1 flex items-center justify-center bg-slate-50">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-[#249272]" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Warming Engine...</p>
                            </div>
                        </div>
                    }
                    className="flex-1 flex overflow-hidden bg-[#f5f6f8]"
                >
                    {isLeftSideOpen && (
                        <aside className="w-[220px] bg-white border-r border-slate-200 flex flex-col shrink-0">
                            <div className="p-4 border-b border-slate-100">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[1px]">Navigation</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20 custom-scrollbar">
                                {[...Array(numPages || 0)].map((_, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setPageNumber(i + 1)}
                                        className={`rounded-lg border-2 cursor-pointer transition-all hover:border-[#249272] bg-white flex flex-col items-center group overflow-hidden ${pageNumber === i + 1 ? 'border-[#249272] shadow-md ring-2 ring-emerald-50' : 'border-slate-200 grayscale-[0.5] opacity-80 hover:grayscale-0 hover:opacity-100'}`}
                                    >
                                        <div className="w-full flex items-center justify-center p-1">
                                            <Page pageNumber={i + 1} width={180} renderTextLayer={false} renderAnnotationLayer={false} />
                                        </div>
                                        <div className={`w-full py-1.5 text-center text-[10px] font-extrabold tracking-tighter ${pageNumber === i + 1 ? 'bg-[#249272] text-white' : 'bg-slate-50 text-slate-400'}`}>
                                            PAGE {i + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-[#eef0f2] flex flex-col items-center">
                        <DocumentViewer
                            pageNumber={pageNumber}
                            scale={scale}
                            fields={currentSignerFields}
                            completedFields={completedFields}
                            fieldValues={fieldValues}
                            onFieldClick={handleFieldClick}
                        />
                    </div>

                    {isRightSideOpen && (
                        <aside className="w-[320px] bg-white border-l border-slate-200 flex flex-col shadow-xl shrink-0">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-[#249272]" /> Identity Verified
                                    </h3>
                                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#249272] text-white flex items-center justify-center text-[16px] font-bold shadow-md">
                                            {meta?.signer?.name?.charAt(0) || "S"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[14px] font-bold text-slate-800 truncate">{meta?.signer?.name || "Signer"}</p>
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">#{meta?.signer?.signingOrder}</span>
                                            </div>
                                            <p className="text-[11px] text-[#249272] font-medium truncate italic">{meta?.signer?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <PenTool className="w-4 h-4 text-[#249272]" /> Adoption Guide
                                    </h3>
                                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                                                <span className="text-slate-500">Progress</span>
                                                <span className="text-[#249272] font-black">{completedFields.length} / {currentSignerFields.length}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-[#249272] h-full transition-all duration-700 ease-out"
                                                    style={{ width: `${(completedFields.length / (currentSignerFields.length || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        {fieldsRemaining > 0 ? (
                                            <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                                                Click on the highlighted signature fields in the document to sign.
                                            </p>
                                        ) : (
                                            <div className="animate-in fade-in slide-in-from-top-2">
                                                <div className="mb-3 flex items-center gap-2 text-emerald-600">
                                                    <Check className="w-4 h-4" />
                                                    <p className="text-[13px] font-bold">All fields completed</p>
                                                </div>
                                                <button onClick={handleFinalSign} className="w-full h-11 bg-slate-900 text-white rounded-lg text-[13px] font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100 uppercase tracking-widest">Complete Now</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-white space-y-4">
                                <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">Standard Enterprise Signing</p>
                            </div>
                        </aside>
                    )}
                </Document>

                {/* Zoho Signature Adopt Modal */}
                {showSignatureModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                                <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                                    Adopt Your Signature
                                </h3>
                                <button onClick={() => setShowSignatureModal(false)} className="p-1 hover:bg-slate-100 rounded transition text-slate-400">
                                    <Maximize className="w-4 h-4 rotate-45" />
                                </button>
                            </div>

                            <div className="flex border-b border-slate-100 bg-[#249272]/5">
                                <div className="flex-1 py-3 flex items-center justify-center gap-2 text-[12px] font-black text-[#249272] border-b-2 border-[#249272] uppercase tracking-[2px]">
                                    <PenTool className="w-4 h-4" /> HAND DRAWN SIGNATURE
                                </div>
                            </div>

                            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {signatureType === "draw" && (
                                    <div className="border border-slate-200 rounded p-4 bg-slate-50 relative group min-h-[300px] flex items-center justify-center animate-in fade-in zoom-in-95">
                                        <SignaturePad onChange={setSignatureData} penColor="#000000" />
                                        <p className="absolute top-2 right-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity italic">Drawing Board Active</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-8 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" id="applyAll" className="w-[17px] h-[17px] rounded border-slate-300 text-[#249272] focus:ring-[#249272]" defaultChecked />
                                    <span className="text-[13px] text-slate-600 group-hover:text-slate-800 transition-colors">fills the signature in all places</span>
                                </label>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowSignatureModal(false)} className="px-6 h-[34px] border border-slate-300 rounded text-slate-600 font-bold hover:bg-slate-50 transition-all text-[12px] uppercase tracking-wider">Cancel</button>
                                    <button
                                        onClick={() => handleApplySignature(signatureData, document.getElementById('applyAll')?.checked)}
                                        className="px-8 h-[34px] bg-[#249272] hover:bg-[#1e7a5f] text-white rounded font-bold transition-all shadow-md active:scale-95 text-[12px] uppercase tracking-wider"
                                    >
                                        Ok
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <SelfieCaptureModal
                    isOpen={showSelfieModal}
                    onClose={() => setShowSelfieModal(false)}
                    onCapture={handleSelfieCapture}
                    signerName={meta?.signer?.name}
                />
            </div>
        );
    }

    if (step === "waiting") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter">
                <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 text-center p-10">
                    <Loader2 className="w-16 h-16 text-[#249272] mx-auto mb-6 animate-spin opacity-20" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Waiting for Others</h1>
                    <p className="text-slate-500 mb-8">
                        This document follows a <strong>sequential signing order</strong>.
                        It is currently not your turn to sign. We will notify you via email when the previous parties have completed their signature.
                    </p>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                            {meta?.signer?.signingOrder || "?"}
                        </div>
                        <div>
                            <p className="text-[12px] text-slate-400 uppercase font-black tracking-widest">Your Position</p>
                            <p className="text-[14px] text-slate-700 font-bold">{meta?.signer?.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === "completed") {
        return (
            <div className="min-h-screen bg-[#249272] flex items-center justify-center p-6 font-inter">
                <div className="bg-white w-full max-w-lg rounded-3xl p-10 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-[#249272] rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 stroke-[3]" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Signature Completed!</h1>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        The document <strong>{meta?.document?.title}</strong> has been successfully signed and secured.
                    </p>
                    <button onClick={() => window.close()} className="px-10 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-xl active:scale-95">Finish and Exit</button>
                </div>
            </div>
        );
    }

    return null;
};

export default PublicSigningPage;
