import React from 'react';

export default function NeumorphicLifescoreGauge({ score = 72, label = 'High score', size = 'md' }) {
  const sizeMap = {
    xs: { container: 48, inner: 40, text: '0.7rem', label: '0.5rem' },
    sm: { container: 80, inner: 70, text: '0.875rem', label: '0.65rem' },
    md: { container: 100, inner: 90, text: '1.125rem', label: '0.75rem' },
    lg: { container: 120, inner: 110, text: '1.375rem', label: '0.875rem' },
  };

  const dimensions = sizeMap[size] || sizeMap.md;
  const circumference = 2 * Math.PI * (dimensions.inner / 2);
  const percentage = (score / 100) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center justify-center p-1">
      <div style={{ width: dimensions.container, height: dimensions.container, position: 'relative', overflow: 'visible' }}>
        <svg
          width={dimensions.container}
          height={dimensions.container}
          viewBox={`0 0 ${dimensions.container} ${dimensions.container}`}
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          {/* Background circle */}
          <circle
            cx={dimensions.container / 2}
            cy={dimensions.container / 2}
            r={dimensions.inner / 2}
            fill="none"
            stroke="rgba(209, 217, 230, 0.4)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx={dimensions.container / 2}
            cy={dimensions.container / 2}
            r={dimensions.inner / 2}
            fill="none"
            stroke="#2f949d"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Center content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: dimensions.text, fontWeight: '600', color: 'var(--nm-text-color)' }}>
            {score}
          </div>
          <div style={{ fontSize: dimensions.label, color: 'var(--nm-badge-default-color)', marginTop: '2px' }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}