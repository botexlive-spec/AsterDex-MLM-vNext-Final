import React from 'react';

export interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
  mobileLabel?: string; // Optional different label for mobile
}

export interface ResponsiveTableProps {
  columns: TableColumn[];
  data: any[];
  keyField?: string;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  className?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  keyField = 'id',
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-[#8b949e]">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={`hidden md:block overflow-x-auto ${className}`}>
        <table className="w-full">
          <thead className="bg-[#161b22] border-b border-[#30363d]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-[#8b949e] uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#0d1117] divide-y divide-[#30363d]">
            {data.map((row) => (
              <tr
                key={row[keyField]}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-[#161b22]' : ''
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 sm:px-6 py-3 sm:py-4 text-sm text-white ${column.className || ''}`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3 sm:space-y-4">
        {data.map((row) => (
          <div
            key={row[keyField]}
            onClick={() => onRowClick?.(row)}
            className={`bg-[#161b22] rounded-lg p-4 border border-[#30363d] transition-all ${
              onRowClick ? 'cursor-pointer active:scale-[0.98]' : ''
            }`}
          >
            {columns.map((column, index) => {
              const value = column.render
                ? column.render(row[column.key], row)
                : row[column.key];

              // Skip rendering if value is null/undefined
              if (value === null || value === undefined) return null;

              return (
                <div
                  key={column.key}
                  className={`flex justify-between items-start gap-3 ${
                    index !== columns.length - 1 ? 'mb-3 pb-3 border-b border-[#30363d]' : ''
                  }`}
                >
                  <span className="text-xs sm:text-sm font-medium text-[#8b949e] min-w-[100px]">
                    {column.mobileLabel || column.label}
                  </span>
                  <span className="text-sm sm:text-base text-white text-right flex-1 font-medium">
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
};

export default ResponsiveTable;
