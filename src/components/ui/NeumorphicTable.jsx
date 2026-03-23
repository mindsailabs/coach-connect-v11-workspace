import React from 'react';
import NeumorphicCard from './NeumorphicCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const NeumorphicTable = ({ 
  data = [], 
  columns = [], 
  className = '',
  maxRows = null
}) => {
  const displayData = maxRows ? data.slice(0, maxRows) : data;

  // Calculate equal width for data columns (same as collapsible table - 10% reserved for future icons)
  const dataColumnWidth = `${Math.floor((100 - 10) / columns.length)}%`;

  return (
    <NeumorphicCard className={`!shadow-inner-neumorphic p-2 ${className}`}>
      <Table style={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHeader>
          <TableRow className="border-b-2" style={{ borderBottomColor: 'rgba(209, 217, 230, 0.5)' }}>
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                className={`text-xl font-normal ${column.align === 'right' ? 'text-right' : ''} ${index === 0 ? 'pl-4' : ''} ${index === columns.length - 1 ? 'pr-4' : ''}`}
                style={{ 
                  color: 'var(--nm-text-color)',
                  width: dataColumnWidth
                }}
              >
                {column.header}
              </TableHead>
            ))}
            <TableHead className="text-xl font-normal text-right" style={{ 
              color: 'var(--nm-text-color)', 
              width: '10%' 
            }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.map((row) => (
            <TableRow key={row.id} className="border-0 neumorphic-table-row">
              {columns.map((column, index) => (
                <TableCell 
                  key={index}
                  className={`${index === 0 ? 'text-lg pl-4' : 'text-base'} ${index === columns.length - 1 ? 'pr-4' : ''} font-normal ${column.align === 'right' ? 'text-right' : ''}`}
                  style={{ 
                    color: 'var(--nm-text-color)',
                    width: dataColumnWidth
                  }}
                >
                  <span className="neumorphic-table-cell-content">
                    {column.accessor ? row[column.accessor] : column.render ? column.render(row) : ''}
                  </span>
                </TableCell>
              ))}
              <TableCell className="text-right" style={{ width: '10%' }}>
                {/* Reserved space for future icons */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </NeumorphicCard>
  );
};

export default NeumorphicTable;