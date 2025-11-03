import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'md:w-[400px]',
    md: 'md:w-[500px]',
    lg: 'md:w-[600px]',
    xl: 'md:w-[800px]',
  };

  return (
    <div className="responsive-modal-overlay">
      {/* Backdrop */}
      <div
        className="responsive-modal-backdrop"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className={`responsive-modal-content ${sizeClasses[size]}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#30363d] sticky top-0 bg-[#0d1117] z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-white pr-8">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-[#161b22] rounded-lg transition-colors touch-target"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-[#8b949e] hover:text-white" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto max-h-[calc(85vh-120px)] md:max-h-[calc(80vh-120px)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-[#30363d] sticky bottom-0 bg-[#0d1117] z-10">
            {footer}
          </div>
        )}

        {/* Mobile pull indicator */}
        <div className="md:hidden absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-[#30363d] rounded-full" />
      </div>
    </div>
  );
};

// Confirmation Modal Component
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}) => {
  const variantStyles = {
    danger: {
      icon: '⚠️',
      color: 'text-red-500',
      buttonClass: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: '⚡',
      color: 'text-yellow-500',
      buttonClass: 'bg-yellow-500 hover:bg-yellow-600',
    },
    info: {
      icon: 'ℹ️',
      color: 'text-[#00C7D1]',
      buttonClass: 'bg-[#00C7D1] hover:bg-[#00a8b0]',
    },
  };

  const style = variantStyles[variant];

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 sm:h-10 px-4 bg-[#334155] hover:bg-[#475569] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-11 sm:h-10 px-4 ${style.buttonClass} text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div className={`text-5xl sm:text-6xl ${style.color}`}>
          {style.icon}
        </div>
        <p className="text-base sm:text-lg text-white leading-relaxed">
          {message}
        </p>
      </div>
    </ResponsiveModal>
  );
};

// Alert Modal Component
export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttonText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
}) => {
  const typeStyles = {
    success: { icon: '✅', color: 'text-green-500' },
    error: { icon: '❌', color: 'text-red-500' },
    warning: { icon: '⚠️', color: 'text-yellow-500' },
    info: { icon: 'ℹ️', color: 'text-[#00C7D1]' },
  };

  const style = typeStyles[type];

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <button
          onClick={onClose}
          className="w-full h-11 sm:h-10 px-4 bg-[#00C7D1] hover:bg-[#00a8b0] text-white rounded-lg font-medium transition-colors"
        >
          {buttonText}
        </button>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div className={`text-5xl sm:text-6xl ${style.color}`}>
          {style.icon}
        </div>
        <p className="text-base sm:text-lg text-white leading-relaxed">
          {message}
        </p>
      </div>
    </ResponsiveModal>
  );
};

export default ResponsiveModal;
