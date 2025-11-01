import React, { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
  showYearDropdown?: boolean;
  showMonthDropdown?: boolean;
  dropdownMode?: 'scroll' | 'select';
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

// Custom input component that integrates with the theme
const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick, placeholder, error, disabled }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref as any}
    disabled={disabled}
    className={`w-full px-4 py-3 bg-[#1e293b] border rounded-lg text-left flex items-center justify-between transition-colors ${
      error
        ? 'border-[#ef4444] focus:border-[#ef4444]'
        : 'border-[#475569] focus:border-[#00C7D1] hover:border-[#64748b]'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} text-[#f8fafc] focus:outline-none`}
  >
    <span className={value ? 'text-[#f8fafc]' : 'text-[#94a3b8]'}>
      {value || placeholder || 'Select date'}
    </span>
    <svg
      className="w-5 h-5 text-[#94a3b8]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  </button>
));

CustomInput.displayName = 'CustomInput';

export const DatePicker: React.FC<DatePickerProps> = ({
  selected,
  onChange,
  placeholder,
  minDate,
  maxDate,
  dateFormat = 'MMMM d, yyyy',
  showYearDropdown = true,
  showMonthDropdown = true,
  dropdownMode = 'select',
  disabled = false,
  error = false,
  className = '',
}) => {
  return (
    <div className={`date-picker-wrapper ${className}`}>
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        customInput={<CustomInput error={error} disabled={disabled} />}
        dateFormat={dateFormat}
        placeholderText={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        showYearDropdown={showYearDropdown}
        showMonthDropdown={showMonthDropdown}
        dropdownMode={dropdownMode}
        disabled={disabled}
        wrapperClassName="w-full"
        calendarClassName="dark-calendar"
        popperClassName="date-picker-popper"
        yearDropdownItemNumber={100}
        scrollableYearDropdown
      />

      <style>{`
        /* Dark theme calendar styles */
        .react-datepicker {
          font-family: inherit;
          background-color: #334155;
          border: 1px solid #475569;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        }

        .react-datepicker__header {
          background-color: #1e293b;
          border-bottom: 1px solid #475569;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          padding-top: 0.75rem;
        }

        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker-year-header {
          color: #f8fafc;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .react-datepicker__day-name,
        .react-datepicker__day,
        .react-datepicker__time-name {
          color: #cbd5e1;
          width: 2.2rem;
          line-height: 2.2rem;
          margin: 0.2rem;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #00C7D1;
          color: white;
          font-weight: 600;
        }

        .react-datepicker__day:hover {
          background-color: #475569;
          color: #f8fafc;
        }

        .react-datepicker__day--disabled {
          color: #64748b;
          cursor: not-allowed;
        }

        .react-datepicker__day--disabled:hover {
          background-color: transparent;
        }

        .react-datepicker__day--today {
          font-weight: 600;
          border: 1px solid #00C7D1;
        }

        .react-datepicker__day--outside-month {
          color: #64748b;
        }

        .react-datepicker__navigation {
          top: 0.75rem;
        }

        .react-datepicker__navigation-icon::before {
          border-color: #cbd5e1;
        }

        .react-datepicker__navigation:hover *::before {
          border-color: #f8fafc;
        }

        .react-datepicker__month-dropdown,
        .react-datepicker__year-dropdown {
          background-color: #334155;
          border: 1px solid #475569;
          color: #f8fafc;
        }

        .react-datepicker__month-option,
        .react-datepicker__year-option {
          color: #cbd5e1;
          padding: 0.5rem;
        }

        .react-datepicker__month-option:hover,
        .react-datepicker__year-option:hover {
          background-color: #475569;
        }

        .react-datepicker__month-option--selected_month,
        .react-datepicker__year-option--selected_year {
          background-color: #00C7D1;
          color: white;
        }

        .react-datepicker__month-dropdown-container--scroll,
        .react-datepicker__year-dropdown-container--scroll {
          max-height: 200px;
          overflow-y: auto;
        }

        /* Scrollbar styling */
        .react-datepicker__month-dropdown-container--scroll::-webkit-scrollbar,
        .react-datepicker__year-dropdown-container--scroll::-webkit-scrollbar {
          width: 6px;
        }

        .react-datepicker__month-dropdown-container--scroll::-webkit-scrollbar-track,
        .react-datepicker__year-dropdown-container--scroll::-webkit-scrollbar-track {
          background: #1e293b;
        }

        .react-datepicker__month-dropdown-container--scroll::-webkit-scrollbar-thumb,
        .react-datepicker__year-dropdown-container--scroll::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }

        .react-datepicker__month-dropdown-container--scroll::-webkit-scrollbar-thumb:hover,
        .react-datepicker__year-dropdown-container--scroll::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        .react-datepicker-popper {
          z-index: 9999 !important;
        }

        .react-datepicker__triangle {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default DatePicker;
