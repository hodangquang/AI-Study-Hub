import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface CustomDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  showInput?: boolean;
  defaultValue?: string;
  inputPlaceholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  title,
  message,
  showInput = false,
  defaultValue = '',
  inputPlaceholder = '',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onClose,
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state when default value changes
  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  // Focus and select the input text when the dialog is opened
  useEffect(() => {
    if (isOpen && showInput) {
      // Small timeout to ensure DOM is fully rendered and accessible
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showInput]);

  // Close dialog on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(inputValue);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-[#000f21]/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" 
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-gray-200/80 rounded-2xl w-full max-w-[440px] overflow-hidden shadow-2xl z-10 p-6 animate-scale-up text-gray-900 select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-xl text-[#202124] tracking-tight">{title}</h3>
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <p className="text-[14px] text-gray-600 leading-normal font-normal">
              {message}
            </p>
          )}

          {showInput && (
            <div className="w-full">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full bg-white border border-[#1a73e8] rounded-md px-3.5 py-2.5 text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 transition-all font-medium"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent hover:bg-gray-50 text-[#1a73e8] font-semibold py-2 px-4 rounded-lg text-sm transition-colors cursor-pointer hover:underline"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className={`font-semibold py-2.5 px-6 rounded-full text-sm transition-all shadow-sm cursor-pointer ${
                isDanger 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/10' 
                  : 'bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-blue-500/10'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomDialog;
