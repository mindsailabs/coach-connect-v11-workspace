import React from 'react';
import NeumorphicProgress from '@/components/ui/NeumorphicProgress';

export default function CreditProgress({ used = 419.7, total = 1200, renewDate = '1/3/26', renewTime = '11:13am' }) {
  const percentage = Math.min((used / total) * 100, 100);

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-normal" style={{ color: 'var(--nm-text-color)' }}>Monthly Credits</span>
        <span className="text-sm font-normal" style={{ color: 'var(--nm-text-color)' }}>
          {used}/{total}
        </span>
      </div>
      <NeumorphicProgress value={percentage} animated={true} />
      <p className="text-xs mt-1.5" style={{ color: 'var(--nm-badge-default-color)' }}>
        Renews at {renewDate} | {renewTime}
      </p>
      <button
        className="text-xs font-normal mt-1"
        style={{
          color: '#ed8936',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Upgrade your plan
      </button>
    </div>
  );
}