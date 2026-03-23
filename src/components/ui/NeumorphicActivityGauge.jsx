import React, { useState, useEffect } from 'react';

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const describePieSlice = (x, y, radius, innerRadius, startAngle, endAngle) => {
    const startOuter = polarToCartesian(x, y, radius, endAngle);
    const endOuter = polarToCartesian(x, y, radius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    const d = [
        'M', startOuter.x, startOuter.y,
        'A', radius, radius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        'L', endInner.x, endInner.y,
        'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
        'Z'
    ].join(' ');

    return d;
};

const NeumorphicActivityGauge = ({ value, onChange }) => {
  const [displayValue, setDisplayValue] = useState(value || "Light");
  const [isVisible, setIsVisible] = useState(true);
  
  const levels = ["Sedentary", "Light", "Moderate", "Very Active"];
  const colors = [
    "var(--nm-activity-sedentary)", 
    "var(--nm-activity-light)", 
    "var(--nm-activity-moderate)", 
    "var(--nm-activity-very-active)"
  ];
  const angleRange = 180;
  const startAngle = -90;
  const segmentAngle = angleRange / levels.length;
  
  const currentIndex = levels.indexOf(value);
  const needleAngle = startAngle + (currentIndex >= 0 ? currentIndex * segmentAngle : segmentAngle) + (segmentAngle / 2);

  // Handle text fade transition when value changes
  useEffect(() => {
    if (value && value !== displayValue) {
      setIsVisible(false);
      setTimeout(() => {
        setDisplayValue(value);
        setIsVisible(true);
      }, 150); // Half of the transition duration
    }
  }, [value, displayValue]);

  const handleGaugeClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = event.clientX - rect.left - centerX;
    const y = event.clientY - rect.top - centerY;
    
    // Calculate distance from center - increased clickable area to 95px
    const distance = Math.sqrt(x * x + y * y);
    if (distance < 50 || distance > 95) {
        return; // Only respond to clicks in the arc area
    }
    
    // Calculate angle from center (12 o'clock is 0 degrees, clockwise positive)
    let angle = Math.atan2(x, -y) * (180 / Math.PI);
    
    // Only respond to clicks in the top half (semicircle from -90 to 90 degrees)
    if (angle < -90 || angle > 90) {
        return;
    }
    
    // Convert angle to activity level index
    const normalizedAngle = angle + 90; // Convert to 0-180 range
    const index = Math.floor(normalizedAngle / segmentAngle);
    const clampedIndex = Math.min(levels.length - 1, Math.max(0, index));

    onChange(levels[clampedIndex]);
  };

  const gaugeStyle = {
    borderRadius: '50%',
    background: 'var(--nm-background)',
    boxShadow: 'var(--nm-shadow-main)',
  };

  return (
    <div className="flex flex-col items-center select-none">
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/seven-segment');
        
        .seven-segment-font {
          font-family: 'Seven Segment', 'Courier New', monospace;
          font-weight: normal;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        
        .needle-group {
          transform-origin: 80px 80px;
          transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .activity-label-text {
          transition: opacity 0.3s ease-in-out;
        }
      `}</style>
      
      <div 
        className="relative w-40 h-40 cursor-pointer transition-all duration-300 hover:shadow-[var(--nm-shadow-hover)] hover:-translate-y-0.5"
        style={gaugeStyle}
        onClick={handleGaugeClick}
      >
        {/* Inner circle with inset shadow - same as sleep gauge */}
        <div 
          className="absolute inset-2 rounded-full"
          style={{
            borderRadius: '50%',
            background: 'var(--nm-background)',
            boxShadow: 'var(--nm-shadow-inset)',
          }}
        />
        
        {/* SVG positioned to align arc with inner circle edge - same position as sleep gauge */}
        <div className="absolute inset-2 flex items-start justify-center">
          <svg viewBox="0 0 160 160" className="w-full h-auto">
            {levels.map((level, i) => (
              <path
                key={level}
                d={describePieSlice(80, 80, 72, 48, startAngle + i * segmentAngle, startAngle + (i + 1) * segmentAngle)}
                fill={colors[i]}
                style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))' }}
              />
            ))}
            <g 
              className="needle-group"
              style={{ transform: `rotate(${needleAngle}deg)` }}
            >
              <path 
                d="M 80 80 L 80 20" 
                stroke="var(--nm-text-color)" 
                strokeWidth="3" 
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.2))' }}
              />
              <path 
                d="M 80 80 L 77 88 L 83 88 Z" 
                fill="var(--nm-text-color)"
                style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.2))' }}
              />
            </g>
            <circle 
              cx="80" 
              cy="80" 
              r="8" 
              fill="var(--nm-text-color)"
              style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.2))' }}
            />
            <circle 
              cx="80" 
              cy="80" 
              r="4" 
              fill="var(--nm-background)"
            />
          </svg>
        </div>

        {/* Activity label centered in bottom half of gauge face with seven segment font */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ 
            bottom: '39px',
            zIndex: 50 
          }}
        >
          <span
            className="inline-flex items-center justify-center text-base seven-segment-font"
            style={{
              borderRadius: '6px',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-inset)',
              width: '105px',
              height: '28px',
              fontWeight: '600',
            }}
          >
            <span 
              className="activity-label-text"
              style={{
                color: 'var(--nm-badge-primary-color)',
                opacity: isVisible ? 1 : 0,
              }}
            >
              {displayValue}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default NeumorphicActivityGauge;