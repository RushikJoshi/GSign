import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const Select = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select an option",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value || opt.value === String(value));
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div 
        className={`w-full bg-slate-50 border border-slate-200 h-10 px-4 rounded text-[14px] text-slate-700 outline-none flex items-center justify-between cursor-pointer focus-within:bg-white focus-within:border-emerald-500 transition-all shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="truncate pr-4">{displayValue}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-[13px] text-slate-500 text-center">No options available</div>
          ) : (
            <div className="py-1">
              {options.map((option, index) => (
                <div
                  key={index}
                  className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition flex items-center justify-between ${
                    (value === option.value || String(value) === String(option.value))
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {(value === option.value || String(value) === String(option.value)) && <Check className="w-3.5 h-3.5" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Select;
