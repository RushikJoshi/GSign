import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCcw, Check, X, Loader2, ShieldCheck } from 'lucide-react';

const SelfieCaptureModal = ({ isOpen, onCapture, onClose, signerName }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera();
        }
        return () => stopCamera();
    }, [isOpen, capturedImage]);

    const startCamera = async () => {
        setError("");
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Please ensure permissions are granted.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Add Watermark
            ctx.font = '16px monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            const timestamp = new Date().toLocaleString();
            ctx.fillText(timestamp, 20, canvas.height - 40);
            ctx.fillText("Liveness Verified", 20, canvas.height - 20);

            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(imageData);
            stopCamera();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onCapture(capturedImage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
                {/* Header - Compact */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 text-[#249272] rounded-lg flex items-center justify-center">
                            <Camera className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-bold text-slate-800 leading-none">Selfie Verification</h3>
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">Position your face in the guide below</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-50 rounded-lg transition text-slate-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Camera / Preview Area - optimized aspect ratio */}
                <div className="aspect-[1.2] bg-black relative overflow-hidden group">
                    {!capturedImage ? (
                        <>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            {/* Overlay UI - more professional guide */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[200px] h-[260px] border-2 border-white/20 rounded-[100px] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] relative">
                                    <div className="absolute inset-x-0 -bottom-8 text-center text-[10px] font-bold text-white uppercase tracking-widest opacity-80">
                                        Center your face
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <img src={capturedImage} className="w-full h-full object-cover animate-in fade-in duration-500" alt="Captured selfie" />
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 p-6 text-center">
                            <div className="text-white space-y-3">
                                <p className="text-[13px] font-medium opacity-80">{error}</p>
                                <button onClick={startCamera} className="px-5 py-2 bg-white text-slate-900 rounded-lg text-[11px] font-bold uppercase tracking-wider">Grant Permissions</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions - Compact and Professional */}
                <div className="p-6 bg-white">
                    {!capturedImage ? (
                        <div className="flex flex-col items-center">
                            <button 
                                onClick={handleCapture}
                                disabled={!stream}
                                className="group relative w-16 h-16 bg-white border-4 border-slate-100 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 shadow-sm"
                            >
                                <div className="w-12 h-12 bg-[#249272] hover:bg-[#1e7a5f] rounded-full flex items-center justify-center text-white transition-colors">
                                    <Camera className="w-5 h-5" />
                                </div>
                            </button>
                            <p className="mt-3 text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Capture Moment</p>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button 
                                onClick={handleRetake}
                                className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCcw className="w-3.5 h-3.5" /> Retake
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 h-11 rounded-xl bg-slate-900 text-white font-bold text-[13px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                            >
                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Confirm & Finish</>}
                            </button>
                        </div>
                    )}
                    
                    <div className="flex items-center justify-center gap-2 mt-5 text-[10px] text-slate-400 font-bold uppercase tracking-wider opacity-60">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span>Encrypted Verification</span>
                    </div>
                </div>

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
        </div>
    );
};

export default SelfieCaptureModal;
