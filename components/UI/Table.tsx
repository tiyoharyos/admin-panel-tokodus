'use client'

import { ReactNode } from 'react'

interface TableProps {
  headers: string[]
  children: ReactNode
  className?: string
  striped?: boolean
  hoverable?: boolean
}

function Table({
  headers,
  children,
  className = '',
  striped = true,
  hoverable = true
}: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y divide-gray-200 ${striped ? 'bg-white' : ''}`}>
          {children}
        </tbody>
      </table>
    </div>
  )
}

interface TableRowProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
}

function TableRow({ children, className = '', hoverable = true }: TableRowProps) {
  return (
    <tr className={`${hoverable ? 'hover:bg-gray-50 transition-colors' : ''} ${className}`}>
      {children}
    </tr>
  )
}

interface TableCellProps {
  children: ReactNode
  className?: string
  colSpan?: number
}

function TableCell({ children, className = '', colSpan }: TableCellProps) {
  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  )
}

// Export semua sebagai named exports
export { Table, TableRow, TableCell }