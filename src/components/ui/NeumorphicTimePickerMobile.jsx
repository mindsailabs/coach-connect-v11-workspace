import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NeumorphicTimePickerMobile = ({ value, onChange, placeholder = "Select time...", defaultTime = "9:00 AM" }) => {
  const [isOpen, setIsOpen] = useState(false);
  
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

  // Use refs for values so touch handlers always have latest state
  const hourRef = useRef(selectedHour);
  const minuteRef = useRef(selectedMinute);
  const periodRef = useRef(selectedPeriod);

  useEffect(() => { hourRef.current = selectedHour; }, [selectedHour]);
  useEffect(() => { minuteRef.current = selectedMinute; }, [selectedMinute]);
  useEffect(() => { periodRef.current = selectedPeriod; }, [selectedPeriod]);

  const handleTimeChange = useCallback((hour, minute, period) => {
    const timeString = `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
    onChange(timeString);
  }, [onChange]);

  const stepHour = useCallback((direction) => {
    const currentIndex = hours.indexOf(hourRef.current);
    const newIndex = direction === 'up' 
      ? (currentIndex + 1) % hours.length 
      : (currentIndex - 1 + hours.length) % hours.length;
    const newHour = hours[newIndex];
    hourRef.current = newHour;
    setSelectedHour(newHour);
    handleTimeChange(newHour, minuteRef.current, periodRef.current);
  }, [handleTimeChange]);

  const stepMinute = useCallback((direction) => {
    const currentIndex = minutes.indexOf(minuteRef.current);
    const newIndex = direction === 'up' 
      ? (currentIndex + 1) % minutes.length 
      : (currentIndex - 1 + minutes.length) % minutes.length;
    const newMinute = minutes[newIndex];
    minuteRef.current = newMinute;
    setSelectedMinute(newMinute);
    handleTimeChange(hourRef.current, newMinute, periodRef.current);
  }, [handleTimeChange]);

  const stepPeriod = useCallback((direction) => {
    const currentIndex = periods.indexOf(periodRef.current);
    const newIndex = direction === 'up' 
      ? (currentIndex + 1) % periods.length 
      : (currentIndex - 1 + periods.length) % periods.length;
    const newPeriod = periods[newIndex];
    periodRef.current = newPeriod;
    setSelectedPeriod(newPeriod);
    handleTimeChange(hourRef.current, minuteRef.current, newPeriod);
  }, [handleTimeChange]);

  // Touch handling via native touch events on the container
  const touchState = useRef({ 
    startY: 0, 
    lastY: 0, 
    isDragging: false,
    type: null,
    accumulatedDelta: 0
  });

  const containerRef = useRef(null);
  const hourRef2 = useRef(null);
  const minuteRef2 = useRef(null);
  const periodRef2 = useRef(null);

  const getTypeFromTouch = useCallback((touchX, touchY) => {
    const checkRef = (ref, type) => {
      if (!ref.current) return null;
      const rect = ref.current.getBoundingClientRect();
      if (touchX >= rect.left && touchX <= rect.right && touchY >= rect.top && touchY <= rect.bottom) {
        return type;
      }
      return null;
    };
    return checkRef(hourRef2, 'hour') || checkRef(minuteRef2, 'minute') || checkRef(periodRef2, 'period');
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      const type = getTypeFromTouch(touch.clientX, touch.clientY);
      if (!type) return;
      
      e.preventDefault();
      touchState.current = {
        startY: touch.clientY,
        lastY: touch.clientY,
        isDragging: true,
        type,
        accumulatedDelta: 0
      };
    };

    const onTouchMove = (e) => {
      if (!touchState.current.isDragging || !touchState.current.type) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      const currentY = touch.clientY;
      const deltaY = touchState.current.lastY - currentY;
      const stepThreshold = 18;
      
      touchState.current.accumulatedDelta += deltaY;
      touchState.current.lastY = currentY;
      
      while (Math.abs(touchState.current.accumulatedDelta) >= stepThreshold) {
        const direction = touchState.current.accumulatedDelta > 0 ? 'up' : 'down';
        const type = touchState.current.type;
        
        if (type === 'hour') stepHour(direction);
        else if (type === 'minute') stepMinute(direction);
        else if (type === 'period') stepPeriod(direction);
        
        touchState.current.accumulatedDelta -= stepThreshold * (touchState.current.accumulatedDelta > 0 ? 1 : -1);
      }
    };

    const onTouchEnd = () => {
      touchState.current.isDragging = false;
      touchState.current.type = null;
      touchState.current.accumulatedDelta = 0;
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isOpen, stepHour, stepMinute, stepPeriod, getTypeFromTouch]);

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
    height: '120px',
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

  return (
    <div className="relative">
      <button
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
              outline: 'none',
              border: 'none',
              background: 'transparent',
              boxShadow: 'none',
              WebkitTapHighlightColor: 'transparent',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              WebkitTouchCallout: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden mt-4 flex justify-center"
          >
            <div 
              ref={containerRef}
              className="flex gap-4 items-center"
              style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              {/* Hour Roller */}
              <div className="flex flex-col items-center">
                <div 
                  ref={hourRef2}
                  style={{...rollerStyle, touchAction: 'none'}} 
                  className="flex flex-col items-center justify-center p-2 select-none cursor-pointer"
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
                  ref={minuteRef2}
                  style={{...rollerStyle, touchAction: 'none'}} 
                  className="flex flex-col items-center justify-center p-2 select-none cursor-pointer"
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
                  ref={periodRef2}
                  style={{...rollerStyle, touchAction: 'none'}} 
                  className="flex flex-col items-center justify-center p-2 select-none cursor-pointer"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeumorphicTimePickerMobile;