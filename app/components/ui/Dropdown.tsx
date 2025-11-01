import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate position to prevent viewport overflow
  useEffect(() => {
    if (!isOpen || !menuRef.current || !dropdownRef.current) return;

    const menu = menuRef.current;
    const trigger = dropdownRef.current;
    const menuRect = menu.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Check if there's enough space below
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Position above if not enough space below
    if (spaceBelow < menuRect.height && spaceAbove > menuRect.height) {
      setPosition('top');
    } else {
      setPosition('bottom');
    }
  }, [isOpen]);

  const alignmentClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute z-50 ${alignmentClasses[align]} ${positionClasses[position]} min-w-[200px] max-w-sm bg-[#334155] border border-[#475569] rounded-lg shadow-xl animate-fadeIn`}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  onClick,
  icon,
  children,
  variant = 'default',
  disabled = false,
}) => {
  const variantClasses = {
    default: 'text-[#f8fafc] hover:bg-[#475569]',
    danger: 'text-[#ef4444] hover:bg-[#ef4444]/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 sm:py-4 text-left transition-colors first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${variantClasses[variant]}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
};

export const DropdownDivider: React.FC = () => {
  return <div className="h-px bg-[#475569] my-1" />;
};

export default Dropdown;
