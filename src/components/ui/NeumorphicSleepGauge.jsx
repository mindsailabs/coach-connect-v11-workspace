import React, { useState, useCallback, useRef } from 'react';

const NeumorphicSleepGauge = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const gaugeRef = useRef(null);
  
  // Update to represent 1-12 hours over full clockwise area
  const minHours = 1;
  const maxHours = 12;
  const clampedHours = Math.min(maxHours, Math.max(minHours, value));
  
  const getColor = (hours) => {
    if (hours < 6) return 'var(--nm-sleep-poor)'; // Red for less than 6h
    if (hours < 7) return 'var(--nm-sleep-fair)'; // Orange for 6-7h  
    if (hours < 9) return 'var(--nm-sleep-good)'; // Green for 7-9h
    if (hours < 10) return 'var(--nm-sleep-excess)'; // Yellow for 9-10h
    return 'var(--nm-sleep-poor)'; // Red for 10h-11h+
  };

  const formatHours = (hours) => {
    if (hours >= 12) return '12h+';
    if (hours % 1 === 0.5) return `${Math.floor(hours)}.5h`;
    return `${Math.floor(hours)}h`;
  };

  const handleGaugeClick = useCallback((event) => {
    if (!gaugeRef.current) return;
    
    const rect = gaugeRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = event.clientX - rect.left - centerX;
    const y = event.clientY - rect.top - centerY;
    
    const distance = Math.sqrt(x * x + y * y);
    if (distance < 50 || distance > 80) {
        return;
    }
    
    let angle = Math.atan2(x, -y) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    // Convert angle to hours (0-360 degrees = 1h-12h, like clock positions)
    const normalizedAngle = (angle / 360);
    const hours = minHours + normalizedAngle * (maxHours - minHours);
    const roundedHours = Math.round(hours * 2) / 2; // Round to nearest 0.5
    const finalHours = Math.min(maxHours, Math.max(minHours, roundedHours));
    
    onChange(finalHours);
  }, [onChange, minHours, maxHours]);

  const handleMouseMove = useCallback((event) => {
    if (!isDragging) return;
    handleGaugeClick(event);
  }, [isDragging, handleGaugeClick]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = (event) => {
    setIsDragging(true);
    handleGaugeClick(event);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const gaugeStyle = {
    borderRadius: '50%',
    background: 'var(--nm-background)',
    boxShadow: 'var(--nm-shadow-main)',
  };

  // Calculate badge position - map hours like clock positions (1=12 o'clock, 12=11 o'clock)
  const badgeAngle = ((clampedHours - 1) * 30) - 90; // -90 to start at 12 o'clock
  const badgeRadians = (badgeAngle) * (Math.PI / 180);
  const rimRadius = 85;
  const badgeX = rimRadius * Math.cos(badgeRadians);
  const badgeY = rimRadius * Math.sin(badgeRadians);

  // Calculate the arc length for the progress band
  // The arc needs to match the clock hand position exactly
  const circumference = 2 * Math.PI * 59; // 370.84
  const arcLength = (clampedHours / 12) * circumference;

  return (
    <div className="flex flex-col items-center select-none">
      <div 
        ref={gaugeRef}
        className="relative w-40 h-40 cursor-pointer transition-all duration-300 hover:shadow-[var(--nm-shadow-hover)] hover:-translate-y-0.5"
        style={gaugeStyle}
        onMouseDown={handleMouseDown}
      >
        <div 
          className="absolute inset-2 rounded-full"
          style={{
            borderRadius: '50%',
            background: 'var(--nm-background)',
            boxShadow: 'var(--nm-shadow-inset)',
          }}
        />
        
        {/* Progress arc - fixed to match clock hand position */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="59"
            fill="none"
            stroke={getColor(clampedHours)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            className="transition-all duration-300"
            style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))' }}
          />
        </svg>

        {/* Hour markers at 12, 3, 6, 9 positions - moved to front */}
        {[0, 3, 6, 9].map((hour) => {
          const angle = (hour / 12) * 360;
          const radians = (angle * Math.PI) / 180;
          const x1 = 80 + 57 * Math.sin(radians);
          const y1 = 80 - 57 * Math.cos(radians);
          const x2 = 80 + 64 * Math.sin(radians);
          const y2 = 80 - 64 * Math.cos(radians);
          
          return (
            <svg key={hour} className="absolute inset-0 w-full h-full" viewBox="0 0 160 160" style={{ zIndex: 60 }}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--nm-text-color)"
                strokeWidth="2"
                opacity="0.6"
              />
            </svg>
          );
        })}

        {/* Clock hand pointing to current hours */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            transform: `rotate(${clampedHours * 30}deg)` // Direct mapping: 1h=30°, 2h=60°, 3h=90°, 4h=120°, etc.
          }}
        >
          <div 
            className="absolute transition-all duration-500"
            style={{ 
              width: '3px', 
              height: '50px', 
              top: '30px',
              borderRadius: '2px',
              backgroundColor: 'var(--nm-text-color)',
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
            }} 
          />
        </div>

        {/* Center dot */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
          style={{ 
            backgroundColor: 'var(--nm-text-color)',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
          }} 
        />

        {/* Sleep hours badge positioned on the rim */}
        <div 
          className="absolute w-12 h-8 flex items-center justify-center text-sm font-semibold rounded-lg transition-all duration-300"
          style={{
            background: 'var(--nm-background)',
            boxShadow: 'var(--nm-shadow-main)',
            color: getColor(clampedHours),
            left: `calc(50% + ${badgeX}px - 24px)`,
            top: `calc(50% + ${badgeY}px - 16px)`,
          }}
        >
          {formatHours(clampedHours)}
        </div>
      </div>
    </div>
  );
};

export default NeumorphicSleepGauge;