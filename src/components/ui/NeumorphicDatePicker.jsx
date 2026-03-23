import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { motion, AnimatePresence } from 'framer-motion';

const NeumorphicDatePicker = ({
  value,
  onChange = () => {},
  placeholder = "Select date...",
  className = "",
  showDateText = true,
  icon: CustomIcon,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && isMobile && contentRef.current) {
      setTimeout(() => {
        const rect = contentRef.current.getBoundingClientRect();
        const bottomNavHeight = 96; // 24 * 4 (pb-24 = 96px)
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - bottomNavHeight;
        
        if (rect.bottom > availableHeight) {
          contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [isOpen, isMobile]);

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

  const IconComponent = CustomIcon || CalendarIcon;
  const displayIcon = value && !CustomIcon && isHovering ? X : IconComponent;

  const handleClear = (e) => {
    e.stopPropagation();
    if (typeof onChange === 'function') {
      onChange(null);
    }
  };

  if (isMobile) {
    return (
      <div className="relative">
        <button
          ref={triggerRef}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={() => setIsOpen(!isOpen)}
          className={`${showDateText ? 'neumorphic-datepicker-trigger' : ''} ${className}`}
          style={{
            ...(props.style || {}),
            ...(showDateText ? { height: '36px', padding: '0 12px', fontSize: '0.875rem' } : {
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
              <span style={{ color: value ? 'var(--nm-text-color)' : 'var(--nm-badge-default-color)', fontSize: '0.875rem' }}>
                {formatDate(value)}
              </span>
              {value && (isMobile || isHovering) && (
                <X onClick={handleClear} className="w-3 h-3" style={{ color: 'var(--nm-badge-default-color)' }} />
              )}
              </div>
              )}
              {showDateText && (
              <CalendarIcon className="w-5 h-5" style={{ color: 'var(--nm-badge-default-color)' }} />
              )}
              {!showDateText && React.createElement(CustomIcon || CalendarIcon, {
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
              style={{ background: 'var(--nm-background)', borderRadius: '12px', boxShadow: 'var(--nm-shadow-main)', position: 'fixed', left: '16px', right: '16px', zIndex: 100 }}
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
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`${showDateText ? 'neumorphic-datepicker-trigger' : ''} ${className}`}
          style={{
            ...(props.style || {}),
            ...(showDateText ? { height: '36px', padding: '0 12px', fontSize: '0.875rem' } : {
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
              <span style={{ color: value ? 'var(--nm-text-color)' : 'var(--nm-badge-default-color)', fontSize: '0.875rem' }}>
                {formatDate(value)}
              </span>
              {value && isHovering && (
                <X onClick={handleClear} className="w-3 h-3" style={{ color: 'var(--nm-badge-default-color)' }} />
              )}
            </div>
          )}
          {showDateText && (
            <CalendarIcon className="w-5 h-5" style={{ color: 'var(--nm-badge-default-color)' }} />
          )}
          {!showDateText && React.createElement(CustomIcon || CalendarIcon, {
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
      </PopoverTrigger>
      <PopoverContent className="neumorphic-datepicker-content w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleChange}
          defaultMonth={value}
          today={new Date()}
          initialFocus
          className="neumorphic-calendar"
        />
      </PopoverContent>
    </Popover>
  );
};

export default NeumorphicDatePicker;