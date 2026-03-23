import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import NeumorphicCard from './NeumorphicCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const NeumorphicCollapsibleTable = ({ 
  data = [], 
  columns = [], 
  getRowDetails,
  className = ''
}) => {
  const [openRowId, setOpenRowId] = useState(null);

  const handleRowClick = (id) => {
    setOpenRowId(openRowId === id ? null : id);
  };

  // Calculate equal width for data columns
  const dataColumnWidth = `${Math.floor((100 - 10) / columns.length)}%`; // 10% for chevron column

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
          {data.map((row) => (
            <React.Fragment key={row.id}>
              <TableRow
                className={`border-0 rounded-lg neumorphic-table-row cursor-pointer ${openRowId === row.id ? 'expanded' : ''}`}
                onClick={() => handleRowClick(row.id)}
              >
                {columns.map((column, index) => (
                  <TableCell 
                    key={index}
                    className={`${index === 0 ? 'text-lg pl-4' : 'text-base'} ${index === columns.length - 1 ? 'pr-4' : ''} font-normal ${index === 0 ? 'rounded-l-lg' : ''} ${index === columns.length - 1 ? 'rounded-r-lg' : ''} ${column.align === 'right' ? 'text-right' : ''}`}
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
                <TableCell className="rounded-r-lg" style={{ width: '10%' }}>
                  <motion.div
                    animate={{ rotate: openRowId === row.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-end"
                  >
                    <ChevronDown className="w-4 h-4" style={{ color: 'var(--nm-badge-default-color)' }} />
                  </motion.div>
                </TableCell>
              </TableRow>
              <AnimatePresence>
                {openRowId === row.id && (
                  <TableRow className="bg-transparent">
                    <TableCell colSpan={columns.length + 1} className="p-0 border-0" style={{ width: '100%' }}>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                        style={{ width: '100%' }}
                      >
                        <div className="px-4 py-4 rounded-b-lg" style={{ 
                          color: 'var(--nm-badge-default-color)', 
                          backgroundColor: 'rgba(240, 242, 245, 0.8)',
                          width: '100%'
                        }}>
                          {getRowDetails ? getRowDetails(row) : row.details}
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </NeumorphicCard>
  );
};

export default NeumorphicCollapsibleTable;