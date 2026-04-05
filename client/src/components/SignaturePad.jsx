import { useRef, useEffect } from "react";
import ReactSignatureCanvas from "react-signature-canvas";
import { Eraser } from "lucide-react";

const SignaturePad = ({ onChange, penColor = "#0f172a" }) => {
  const signatureRef = useRef(null);

  // Auto-save on every stroke end to make it more fluid
  const handleEnd = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) return;
    onChange(signatureRef.current.toDataURL("image/png"));
  };

  const handleClear = () => {
    signatureRef.current?.clear();
    onChange("");
  };

  // Ensure high quality by matching internal resolution to CSS on mount
  useEffect(() => {
    const canvas = signatureRef.current?.getCanvas();
    if (canvas) {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d").scale(ratio, ratio);
      signatureRef.current.clear(); // Re-clear to fix scaling artifacts
    }
  }, []);

  return (
    <div className="group relative w-full h-full min-h-[140px] bg-white">
      <ReactSignatureCanvas
        ref={signatureRef}
        penColor={penColor}
        onEnd={handleEnd}
        minWidth={0.5}
        maxWidth={2.5}
        velocityFilterWeight={0.7}
        canvasProps={{ 
          className: "signature-canvas w-full h-full cursor-crosshair",
          style: { width: '100%', height: '100%' }
        }}
      />
      
      <button
        type="button"
        onClick={handleClear}
        className="absolute bottom-3 right-3 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
        title="Clear signature"
      >
        <Eraser className="w-4 h-4" />
      </button>

      <div className="absolute top-3 left-3 pointer-events-none opacity-40">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legal Signature Pad</p>
      </div>
    </div>
  );
};

export default SignaturePad;
