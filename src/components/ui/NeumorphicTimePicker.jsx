import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from 'framer-motion';

const NeumorphicTimePicker = ({ value, onChange, placeholder = "Select time...", defaultTime = "9:00 AM" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const popoverRef = useRef(null);
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
  
  // Parse current time or set defaults
  const parseTime = (timeString) => {
    if (!timeString) {
      const [time, period] = defaultTime.split(' ');
      const [hour, minute] = time.split(':');
      return {
        hour: parseInt(hour),
        minute: parseInt(minute),
        period: period || 'AM'
      };
    }
    const [time, period] = timeString.split(' ');
    const [hour, minute] = time.split(':');
    return {
      hour: parseInt(hour),
      minute: parseInt(minute),
      period: period || 'AM'
    };
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };
  
  const currentTime = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(currentTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(currentTime.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(currentTime.period);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const periods = ['AM', 'PM'];

  // Prevent body scroll when popover is open
  React.useEffect(() => {
    if (isOpen) {
      // Disable body scroll
      document.body.style.overflow = 'hidden';
      
      const preventPageScroll = (e) => {
        const target = e.target;
        const isInPopover = popoverRef.current && popoverRef.current.contains(target);
        const isInContent = contentRef.current && contentRef.current.contains(target);
        const isInTrigger = triggerRef.current && triggerRef.current.contains(target);
        
        if (isInPopover || isInContent || isInTrigger) {
          e.preventDefault();
          return false;
        }
      };

      const preventTouchScroll = (e) => {
        const target = e.target;
        const isInPopover = popoverRef.current && popoverRef.current.contains(target);
        const isInContent = contentRef.current && contentRef.current.contains(target);
        const isInTrigger = triggerRef.current && triggerRef.current.contains(target);
        
        if (isInPopover || isInContent || isInTrigger) {
          e.preventDefault();
          return false;
        }
      };
      
      document.addEventListener('wheel', preventPageScroll, { passive: false });
      document.addEventListener('touchmove', preventTouchScroll, { passive: false });
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('wheel', preventPageScroll);
        document.removeEventListener('touchmove', preventTouchScroll);
      };
    }
  }, [isOpen]);

  const handleTimeChange = (hour, minute, period) => {
    const timeString = `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
    onChange(timeString);
  };

  const handleHourChange = (direction) => {
    const currentIndex = hours.indexOf(selectedHour);
    let newIndex = direction === 'up' 
      ? (currentIndex + 1) % hours.length 
      : (currentIndex - 1 + hours.length) % hours.length;
    const newHour = hours[newIndex];
    setSelectedHour(newHour);
    handleTimeChange(newHour, selectedMinute, selectedPeriod);
  };

  const handleMinuteChange = (direction) => {
    const currentIndex = minutes.indexOf(selectedMinute);
    let newIndex = direction === 'up' 
      ? (currentIndex + 1) % minutes.length 
      : (currentIndex - 1 + minutes.length) % minutes.length;
    const newMinute = minutes[newIndex];
    setSelectedMinute(newMinute);
    handleTimeChange(selectedHour, newMinute, selectedPeriod);
  };

  const handlePeriodChange = (direction) => {
    const currentIndex = periods.indexOf(selectedPeriod);
    let newIndex = direction === 'up' 
      ? (currentIndex + 1) % periods.length 
      : (currentIndex - 1 + periods.length) % periods.length;
    const newPeriod = periods[newIndex];
    setSelectedPeriod(newPeriod);
    handleTimeChange(selectedHour, selectedMinute, newPeriod);
  };

  const handleWheel = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const direction = e.deltaY > 0 ? 'down' : 'up';
    
    if (type === 'hour') handleHourChange(direction);
    else if (type === 'minute') handleMinuteChange(direction);
    else if (type === 'period') {
      const now = Date.now();
      if (now - lastPeriodChangeTime.current > 300) {
        handlePeriodChange(direction);
        lastPeriodChangeTime.current = now;
      }
    }
  };

  const handleTouchStart = useRef({ y: 0, type: null });
  const lastPeriodChangeTime = useRef(0);

  const onTouchStart = (e, type) => {
    handleTouchStart.current = { y: e.touches[0].clientY, type };
  };

  const onTouchMove = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const currentY = e.touches[0].clientY;
    const diff = handleTouchStart.current.y - currentY;
    
    if (Math.abs(diff) > 10) {
      const direction = diff > 0 ? 'up' : 'down';
      if (type === 'hour') handleHourChange(direction);
      else if (type === 'minute') handleMinuteChange(direction);
      else if (type === 'period') {
        const now = Date.now();
        if (now - lastPeriodChangeTime.current > 300) {
          handlePeriodChange(direction);
          lastPeriodChangeTime.current = now;
        }
      }
      handleTouchStart.current.y = currentY;
    }
  };

  const inputStyle = {
    background: 'var(--nm-background)',
    boxShadow: 'var(--nm-shadow-inset)',
    borderRadius: '12px',
  };

  const rollerStyle = {
    background: 'var(--nm-background)',
    boxShadow: 'var(--nm-shadow-inset)',
    borderRadius: '8px',
    width: '60px',
    height: '80px',
  };

  const valueStyle = {
    background: 'transparent',
    boxShadow: 'none',
    borderRadius: '6px',
  };

  const getPrevHour = () => {
    const currentIndex = hours.indexOf(selectedHour);
    const prevIndex = (currentIndex - 1 + hours.length) % hours.length;
    return hours[prevIndex];
  };

  const getNextHour = () => {
    const currentIndex = hours.indexOf(selectedHour);
    const nextIndex = (currentIndex + 1) % hours.length;
    return hours[nextIndex];
  };

  const getPrevMinute = () => {
    const currentIndex = minutes.indexOf(selectedMinute);
    const prevIndex = (currentIndex - 1 + minutes.length) % minutes.length;
    return minutes[prevIndex];
  };

  const getNextMinute = () => {
    const currentIndex = minutes.indexOf(selectedMinute);
    const nextIndex = (currentIndex + 1) % minutes.length;
    return minutes[nextIndex];
  };

  const getPrevPeriod = () => {
    const currentIndex = periods.indexOf(selectedPeriod);
    const prevIndex = (currentIndex - 1 + periods.length) % periods.length;
    return periods[prevIndex];
  };

  const getNextPeriod = () => {
    const currentIndex = periods.indexOf(selectedPeriod);
    const nextIndex = (currentIndex + 1) % periods.length;
    return periods[nextIndex];
  };

  const TimeRollers = () => (
    <div className="flex gap-4 items-center">
          {/* Hour Roller */}
          <div className="flex flex-col items-center">
            <div 
              style={{...rollerStyle, touchAction: 'none', height: '120px'}} 
              className="flex flex-col items-center justify-center p-2 select-none cursor-pointer"
              onWheel={(e) => handleWheel(e, 'hour')}
              onTouchStart={(e) => onTouchStart(e, 'hour')}
              onTouchMove={(e) => onTouchMove(e, 'hour')}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="text-sm text-[--nm-badge-default-color] opacity-50 h-6 flex items-center justify-center">
                  {getPrevHour()}
                </div>
                <div 
                  style={valueStyle}
                  className="w-8 h-8 flex items-center justify-center my-1 text-lg font-medium text-[--nm-text-color] transition-all duration-200"
                >
                  {selectedHour}
                </div>
                <div className="text-sm text-[--nm-badge-default-color] opacity-50 h-6 flex items-center justify-center">
                  {getNextHour()}
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="text-2xl font-bold text-[--nm-text-color] pb-2">:</div>

          {/* Minute Roller */}
          <div className="flex flex-col items-center">
            <div 
              style={{...rollerStyle, touchAction: 'none', height: '120px'}} 
              className="flex flex-col items-center justify-center p-2 select-none cursor-pointer"
              onWheel={(e) => handleWheel(e, 'minute')}
              onTouchStart={(e) => onTouchStart(e, 'minute')}
              onTouchMove={(e) => onTouchMove(e, 'minute')}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="text-sm text-[--nm-badge-default-color] opacity-50 h-6 flex items-center justify-center">
                  {getPrevMinute().toString().padStart(2, '0')}
                </div>
                <div 
                  style={valueStyle}
                  className="w-8 h-8 flex items-center justify-center my-1 text-lg font-medium text-[--nm-text-color] transition-all duration-200"
                >
                  {selectedMinute.toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-[--nm-badge-default-color] opacity-50 h-6 flex items-center justify-center">
                  {getNextMinute().toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Period Roller */}
          <div className="flex flex-col items-center">
            <div 
              style={{...rollerStyle, touchAction: 'none', height: '120px'}} 
              className="flex flex-col items-center justify-center p-2 select-none cursor-pointer"
              onWheel={(e) => handleWheel(e, 'period')}
              onTouchStart={(e) => onTouchStart(e, 'period')}
              onTouchMove={(e) => onTouchMove(e, 'period')}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="text-sm text-[--nm-badge-default-color] opacity-50 h-6 flex items-center justify-center">
                  {getPrevPeriod()}
                </div>
                <div 
                  style={valueStyle}
                  className="w-10 h-8 flex items-center justify-center my-1 text-sm font-medium text-[--nm-text-color] transition-all duration-200"
                >
                  {selectedPeriod}
                </div>
                <div className="text-sm text-[--nm-badge-default-color] opacity-50 h-6 flex items-center justify-center">
                  {getNextPeriod()}
                </div>
              </div>
            </div>
          </div>
        </div>
  );

  if (isMobile) {
    return (
      <div className="relative">
        <button
          ref={triggerRef}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              onChange('');
            } else {
              setIsOpen(true);
            }
          }}
          style={inputStyle}
          className="w-full px-4 py-3 text-left text-[--nm-text-color] focus:outline-none focus:ring-0 focus:border-none transition-all duration-300 hover:shadow-[var(--nm-shadow-inset-hover)] flex items-center justify-between"
          onFocus={(e) => e.target.style.outline = 'none'}
          onBlur={(e) => e.target.style.outline = 'none'}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: value ? 'var(--nm-text-color)' : 'var(--nm-badge-default-color)' }}>
              {value || placeholder}
            </span>
            {value && !isOpen && (
              <X onClick={handleClear} className="w-3 h-3" style={{ color: 'var(--nm-badge-default-color)' }} />
            )}
          </div>
          {isOpen ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleTimeChange(selectedHour, selectedMinute, selectedPeriod);
                setIsOpen(false);
              }}
              className="time-picker-close-btn"
              style={{ 
                outline: 'none !important', 
                border: 'none !important', 
                background: 'transparent !important',
                boxShadow: 'none !important',
                WebkitTapHighlightColor: 'transparent',
                tapHighlightColor: 'transparent',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onTouchStart={(e) => e.preventDefault()}
            >
              <Check className="w-5 h-5" style={{ color: '#2f949d' }} />
            </div>
          ) : (
            <Clock className="w-5 h-5" style={{ color: 'var(--nm-badge-default-color)' }} />
          )}
          </button>
          <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={contentRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden mt-4 flex justify-center"
            >
              <TimeRollers />
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
          style={inputStyle}
          className="w-full px-4 py-3 text-left text-[--nm-text-color] focus:outline-none focus:ring-0 focus:border-none transition-all duration-300 hover:shadow-[var(--nm-shadow-inset-hover)] flex items-center justify-between"
          onFocus={(e) => e.target.style.outline = 'none'}
          onBlur={(e) => e.target.style.outline = 'none'}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: value ? 'var(--nm-text-color)' : 'var(--nm-badge-default-color)' }}>
              {value || placeholder}
            </span>
            {value && !isOpen && (
              <X onClick={handleClear} className="w-3 h-3" style={{ color: 'var(--nm-badge-default-color)' }} />
            )}
          </div>
          {isOpen ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleTimeChange(selectedHour, selectedMinute, selectedPeriod);
                setIsOpen(false);
              }}
              className="time-picker-close-btn"
              style={{ 
                outline: 'none !important', 
                border: 'none !important', 
                background: 'transparent !important',
                boxShadow: 'none !important',
                WebkitTapHighlightColor: 'transparent',
                tapHighlightColor: 'transparent',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onTouchStart={(e) => e.preventDefault()}
            >
              <Check className="w-5 h-5" style={{ color: '#2f949d' }} />
            </div>
          ) : (
            <Clock className="w-5 h-5" style={{ color: 'var(--nm-badge-default-color)' }} />
          )}
          </button>
          </PopoverTrigger>
      <PopoverContent 
        ref={popoverRef}
        className="w-auto p-0"
        align="end"
        style={{
          borderRadius: 'var(--nm-radius)',
          background: 'var(--nm-background)',
          boxShadow: 'var(--nm-shadow-main)',
          border: 'none',
          padding: '16px',
        }}
      >
        <TimeRollers />
      </PopoverContent>
    </Popover>
  );
};

export default NeumorphicTimePicker;