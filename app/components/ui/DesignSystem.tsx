import React from 'react';

// ===================================
// Reusable Design System Components
// ===================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#00C7D1] text-white hover:bg-[#00a8b0] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-[#334155] text-white hover:bg-[#475569] active:bg-[#1e293b]',
    success: 'bg-[#10b981] text-white hover:bg-[#059669] active:bg-[#047857]',
    danger: 'bg-[#ef4444] text-white hover:bg-[#dc2626] active:bg-[#b91c1c]',
    warning: 'bg-[#f59e0b] text-white hover:bg-[#d97706] active:bg-[#b45309]',
    outline: 'bg-transparent border-2 border-[#00C7D1] text-[#00C7D1] hover:bg-[#00C7D1] hover:text-white active:bg-[#00a8b0]',
  };

  const sizes = {
    sm: 'min-h-[40px] px-4 text-sm',
    md: 'min-h-[44px] sm:min-h-[48px] px-6 text-base',
    lg: 'min-h-[52px] px-8 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`bg-[#334155] border border-[#475569] rounded-lg p-6 shadow-sm ${
        hover ? 'transition-all hover:shadow-lg hover:-translate-y-1' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface StatCardProps {
  icon?: string;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  trend,
  color = '#00C7D1',
}) => {
  return (
    <div className="bg-[#334155] border border-[#475569] rounded-lg p-6 text-center transition-all hover:border-[#00C7D1] hover:shadow-md hover:-translate-y-1">
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <div className="text-3xl font-bold mb-2" style={{ color }}>
        {value}
      </div>
      <div className="text-sm text-[#94a3b8] uppercase tracking-wide">{label}</div>
      {trend && <div className="text-xs text-[#10b981] mt-2">{trend}</div>}
    </div>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info' }) => {
  const variants = {
    success: 'bg-[#10b981]/20 text-[#34d399] border-[#10b981]/30',
    warning: 'bg-[#f59e0b]/20 text-[#fbbf24] border-[#f59e0b]/30',
    danger: 'bg-[#ef4444]/20 text-[#f87171] border-[#ef4444]/30',
    info: 'bg-[#3b82f6]/20 text-[#60a5fa] border-[#3b82f6]/30',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', type, ...props }) => {
  // Enhanced date picker for mobile
  const isDateInput = type === 'date' || type === 'datetime-local' || type === 'time';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#f8fafc] mb-2">{label}</label>
      )}
      <input
        type={type}
        className={`w-full h-11 sm:h-12 px-4 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20 transition-all ${
          isDateInput ? 'text-base' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-[#ef4444]">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, className = '', children, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#f8fafc] mb-2">{label}</label>
      )}
      <select
        className={`w-full h-11 sm:h-12 px-4 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] text-base placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-4xl font-bold text-[#f8fafc] mb-2">{title}</h1>
        {description && <p className="text-[#cbd5e1]">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 scrollbar-thin scrollbar-thumb-[#475569] scrollbar-track-[#1e293b]">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-[#475569] sm:rounded-lg">
          <table className={`min-w-full divide-y divide-[#475569] ${className}`}>{children}</table>
        </div>
      </div>
    </div>
  );
};

export const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <thead className="bg-[#1e293b]">{children}</thead>;
};

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <tbody>{children}</tbody>;
};

export const TableRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <tr className={`border-t border-[#475569] hover:bg-[#475569]/30 ${className}`}>{children}</tr>
  );
};

export const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <th
      className={`px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-semibold text-[#f8fafc] uppercase tracking-wider whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
};

export const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <td className={`px-3 py-3 sm:px-6 sm:py-4 text-sm text-[#cbd5e1] whitespace-nowrap ${className}`}>{children}</td>;
};

export const EmptyState: React.FC<{ icon: string; message: string; description?: string }> = ({
  icon,
  message,
  description,
}) => {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-lg font-medium text-[#f8fafc] mb-2">{message}</p>
      {description && <p className="text-sm text-[#94a3b8]">{description}</p>}
    </div>
  );
};

export const Alert: React.FC<{
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
}> = ({ children, variant = 'info' }) => {
  const variants = {
    info: 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#60a5fa]',
    success: 'bg-[#10b981]/10 border-[#10b981]/30 text-[#34d399]',
    warning: 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#fbbf24]',
    danger: 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#f87171]',
  };

  return (
    <div className={`p-4 rounded-lg border ${variants[variant]}`}>
      {children}
    </div>
  );
};
