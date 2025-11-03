import React from 'react';

// Form Input Component
export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  icon,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-2`}>
      {label && (
        <label className="block text-sm font-medium text-[#8b949e]">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#8b949e]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3 sm:py-3.5 text-base sm:text-sm
            bg-[#0d1117] border border-[#30363d] rounded-lg
            text-white placeholder-[#8b949e]
            focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20
            outline-none transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10 sm:pl-12' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs sm:text-sm text-[#8b949e]">{helperText}</p>
      )}
    </div>
  );
};

// Form Textarea Component
export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-2`}>
      {label && (
        <label className="block text-sm font-medium text-[#8b949e]">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3 sm:py-3.5 text-base sm:text-sm
          bg-[#0d1117] border border-[#30363d] rounded-lg
          text-white placeholder-[#8b949e]
          focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20
          outline-none transition-all resize-vertical
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        rows={4}
        {...props}
      />
      {error && (
        <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs sm:text-sm text-[#8b949e]">{helperText}</p>
      )}
    </div>
  );
};

// Form Select Component
export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string | number; label: string }>;
  fullWidth?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  helperText,
  options,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-2`}>
      {label && (
        <label className="block text-sm font-medium text-[#8b949e]">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3 sm:py-3.5 text-base sm:text-sm
          bg-[#0d1117] border border-[#30363d] rounded-lg
          text-white
          focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20
          outline-none transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs sm:text-sm text-[#8b949e]">{helperText}</p>
      )}
    </div>
  );
};

// Form Button Component
export interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const FormButton: React.FC<FormButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-[#00C7D1] hover:bg-[#00a8b0] text-white',
    secondary: 'bg-[#334155] hover:bg-[#475569] text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    outline: 'bg-transparent border-2 border-[#00C7D1] text-[#00C7D1] hover:bg-[#00C7D1]/10',
  };

  const sizeClasses = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 sm:h-11 px-5 sm:px-6 text-base sm:text-sm',
    lg: 'h-14 sm:h-12 px-6 sm:px-8 text-lg sm:text-base',
  };

  return (
    <button
      className={`
        ${fullWidth ? 'w-full' : ''}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg font-medium transition-all duration-200
        flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        min-h-[44px] touch-target
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

// Form Checkbox Component
export interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      <label className="flex items-start gap-3 cursor-pointer group min-h-[44px]">
        <input
          type="checkbox"
          className={`
            mt-1 w-5 h-5 sm:w-4 sm:h-4 rounded border-[#30363d]
            bg-[#0d1117] text-[#00C7D1]
            focus:ring-2 focus:ring-[#00C7D1]/20 focus:border-[#00C7D1]
            transition-all cursor-pointer
            ${className}
          `}
          {...props}
        />
        <span className="text-sm sm:text-base text-white group-hover:text-[#00C7D1] transition-colors flex-1">
          {label}
        </span>
      </label>
      {error && (
        <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1 ml-8">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
};

// Form Group Component for consistent spacing
export interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ children, className = '' }) => {
  return (
    <div className={`space-y-4 sm:space-y-5 ${className}`}>
      {children}
    </div>
  );
};

export default {
  Input: FormInput,
  Textarea: FormTextarea,
  Select: FormSelect,
  Button: FormButton,
  Checkbox: FormCheckbox,
  Group: FormGroup,
};
