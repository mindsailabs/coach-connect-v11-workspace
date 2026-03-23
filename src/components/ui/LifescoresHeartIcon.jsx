import React from 'react';

export default function LifescoresHeartIcon({ size = 24, isActive = false }) {
  const color = isActive ? '#2f949d' : 'var(--nm-badge-default-color)';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      style={{ overflow: 'visible' }}
    >
      {/* Background circle */}
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="3"
        opacity="0.3"
      />
      {/* Progress circle */}
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray="125.6"
        strokeDashoffset="31.4"
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      {/* Heart in center */}
      <path
        d="M24 34c-1.5-1.2-6-5-6-9c0-2.5 1.5-4 3.5-4c1.2 0 2.3.6 2.5 1.5c.2-.9 1.3-1.5 2.5-1.5c2 0 3.5 1.5 3.5 4c0 4-4.5 7.8-6 9z"
        fill={color}
      />
    </svg>
  );
}