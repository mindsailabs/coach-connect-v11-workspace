import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';

const NeumorphicDatePickerMobile = ({
  value,
  onChange = () => {},
  placeholder = "Select date...",
  className = "",
  showDateText = true,
  icon: CustomIcon,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setTimeout(() => {
        const rect = contentRef.current.getBoundingClientRect();
        const bottomNavHeight = 96;
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - bottomNavHeight;
        
        if (rect.bottom > availableHeight) {
          contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [isOpen]);

  const handleChange = (date) => {
    if (typeof onChange === 'function') {
      onChange(date);
    }
    setIsOpen(false);
  };

  const formatDate = (date) => {
    if (!date) return placeholder;

    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
    day === 2 || day === 22 ? 'nd' :
    day === 3 || day === 23 ? 'rd' : 'th';

    return format(date, `MMM d'${suffix}' yyyy`);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (typeof onChange === 'function') {
      onChange(null);
    }
  };

  const IconComponent = CustomIcon || CalendarIcon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${showDateText ? 'neumorphic-datepicker-trigger' : ''} ${className}`}
        style={{
          ...(props.style || {}),
          ...(showDateText ? {} : {
            background: 'transparent !important',
            boxShadow: 'none !important',
            border: 'none !important',
            padding: '0 !important',
            outline: 'none !important',
            borderRadius: '0 !important',
            filter: 'none !important',
            position: 'relative',
            transform: 'translate(5px, 2px)'
          })
        }}
        {...props}
      >
        {showDateText && (
          <div className="flex items-center gap-2">
            <span style={{ color: value ? 'var(--nm-text-color)' : 'var(--nm-badge-default-color)', fontSize: '1rem' }}>
              {formatDate(value)}
            </span>
            {value && (
              <X onClick={handleClear} className="w-3 h-3" style={{ color: 'var(--nm-badge-default-color)' }} />
            )}
          </div>
        )}
        {showDateText && (
          <CalendarIcon className="w-5 h-5" style={{ color: 'var(--nm-badge-default-color)' }} />
        )}
        {!showDateText && React.createElement(IconComponent, {
          className: 'w-3 h-3',
          style: { 
            filter: 'none !important', 
            boxShadow: 'none !important',
            background: 'transparent !important',
            border: 'none !important',
            outline: 'none !important',
            color: 'var(--nm-badge-default-color)'
          }
        })}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={contentRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden mt-2 flex justify-center"
          >
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleChange}
              defaultMonth={value}
              today={new Date()}
              initialFocus
              className="neumorphic-calendar"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeumorphicDatePickerMobile;