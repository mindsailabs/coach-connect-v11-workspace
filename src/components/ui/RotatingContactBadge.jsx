import React from 'react';

const RotatingContactBadge = ({ contactType, size = 'sm' }) => {
  // Map contact types to multi-color rotation
  const colorMap = {
    'Client': ['#2f949d', '#48bb78', '#ed8936'],
    'Practitioner': ['#ec4899', '#8b5cf6', '#4299e1'],
    'Prospect': ['#f6d55c', '#ed8936', '#f56565'],
    'Other': ['#718096', '#a0aec0', '#cbd5e0']
  };

  const colors = colorMap[contactType] || colorMap['Other'];
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <>
      <style>{`
        @keyframes colorRotate-${contactType?.replace(/\s+/g, '-')} {
          0% { background: linear-gradient(135deg, ${colors[0]}, ${colors[1]}); }
          50% { background: linear-gradient(135deg, ${colors[1]}, ${colors[2]}); }
          100% { background: linear-gradient(135deg, ${colors[2]}, ${colors[0]}); }
        }
        .rotating-badge-${contactType?.replace(/\s+/g, '-')} {
          animation: colorRotate-${contactType?.replace(/\s+/g, '-')} 6s ease-in-out infinite;
        }
      `}</style>
      <span
        className={`rotating-badge-${contactType?.replace(/\s+/g, '-')} inline-flex items-center font-normal text-white border-none rounded-lg ${sizes[size]}`}
        style={{
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          boxShadow: 'var(--nm-shadow-main)',
        }}
      >
        <span style={{ transform: 'translateY(-1px)' }}>
          {contactType}
        </span>
      </span>
    </>
  );
};

export default RotatingContactBadge;