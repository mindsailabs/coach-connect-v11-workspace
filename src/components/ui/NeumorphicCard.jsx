
import React from 'react';

const NeumorphicCard = ({ children, className = '', onClick, clickable = false, ...props }) => {
  const baseStyle = {
    borderRadius: 'var(--nm-radius)',
    background: 'var(--nm-background)',
    boxShadow: 'var(--nm-shadow-main)',
  };

  return (
    <div 
      style={baseStyle} 
      className={`p-6 neumorphic-card transition-all duration-300 hover:shadow-[var(--nm-shadow-hover)] hover:-translate-y-0.5 ${clickable ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      data-clickable={clickable ? 'true' : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default NeumorphicCard;
