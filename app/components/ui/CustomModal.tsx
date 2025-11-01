import React, { useState } from 'react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: 'input' | 'confirm' | 'info';
  children?: React.ReactNode;
  onConfirm?: (value?: string) => void;
  confirmText?: string;
  cancelText?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputType?: string;
  inputRequired?: boolean;
  variant?: 'default' | 'danger' | 'success' | 'warning';
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  title,
  type = 'confirm',
  children,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  inputLabel,
  inputPlaceholder,
  inputType = 'text',
  inputRequired = false,
  variant = 'default',
}) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'input') {
      if (inputRequired && !inputValue.trim()) {
        return;
      }
      onConfirm?.(inputValue);
    } else {
      onConfirm?.();
    }
    setInputValue('');
    onClose();
  };

  const handleCancel = () => {
    setInputValue('');
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconText: 'text-red-600',
        };
      case 'success':
        return {
          button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          icon: '✓',
          iconBg: 'bg-green-100',
          iconText: 'text-green-600',
        };
      case 'warning':
        return {
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          icon: '⚡',
          iconBg: 'bg-yellow-100',
          iconText: 'text-yellow-600',
        };
      default:
        return {
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconText: 'text-blue-600',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                <span className={`text-2xl ${styles.iconText}`}>{styles.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{title}</h3>
                {children && <div className="text-sm text-gray-600">{children}</div>}
              </div>
              <button
                onClick={handleCancel}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Input Field (if type is input) */}
          {type === 'input' && (
            <div className="px-6 pb-4">
              {inputLabel && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {inputLabel}
                  {inputRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}
              <input
                type={inputType}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirm();
                  } else if (e.key === 'Escape') {
                    handleCancel();
                  }
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={type === 'input' && inputRequired && !inputValue.trim()}
              className={`flex-1 px-4 py-3 ${styles.button} text-white font-medium rounded-lg focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
