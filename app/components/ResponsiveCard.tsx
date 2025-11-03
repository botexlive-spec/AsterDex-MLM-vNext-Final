import React from 'react';

export interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'hover' | 'gradient';
  padding?: 'sm' | 'md' | 'lg';
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  padding = 'md',
}) => {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5 lg:p-6',
    lg: 'p-5 sm:p-6 lg:p-8',
  };

  const variantClasses = {
    default: 'bg-[#161b22] border border-[#30363d] hover:border-[#00C7D1]',
    hover: 'bg-[#161b22] border border-[#30363d] hover:border-[#00C7D1] hover:scale-[1.02] hover:shadow-lg',
    gradient: 'bg-gradient-to-br from-[#334155] to-[#1e293b] border border-[#30363d]',
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg transition-all duration-200
        ${paddingClasses[padding]}
        ${variantClasses[variant]}
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Stat Card Component for dashboard metrics
export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: {
    value: string;
    label: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  change,
  onClick,
  actions,
}) => {
  return (
    <ResponsiveCard variant="hover" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-[#8b949e] mb-1 font-medium">{label}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-all">
            {value}
          </p>
        </div>
        <div className="bg-[#00C7D1]/10 p-2.5 sm:p-3 rounded-lg flex-shrink-0">
          {icon}
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <span className={change.isPositive !== false ? 'text-green-500' : 'text-red-500'}>
            {change.value}
          </span>
          <span className="text-[#8b949e]">{change.label}</span>
        </div>
      )}

      {actions && (
        <div className="mt-3 pt-3 border-t border-[#30363d]">
          {actions}
        </div>
      )}
    </ResponsiveCard>
  );
};

// Info Card Component for displaying key-value pairs
export interface InfoCardProps {
  title: string;
  items: Array<{
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
  }>;
  className?: string;
  actions?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  items,
  className = '',
  actions,
}) => {
  return (
    <ResponsiveCard className={className}>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 pb-3 border-b border-[#30363d] last:border-b-0 last:pb-0"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.icon && (
                <span className="flex-shrink-0 text-[#00C7D1]">{item.icon}</span>
              )}
              <span className="text-xs sm:text-sm text-[#8b949e] truncate">
                {item.label}
              </span>
            </div>
            <span className="text-sm sm:text-base text-white font-medium text-right">
              {item.value}
            </span>
          </div>
        ))}
      </div>
      {actions && (
        <div className="mt-4 pt-4 border-t border-[#30363d]">
          {actions}
        </div>
      )}
    </ResponsiveCard>
  );
};

export default ResponsiveCard;
