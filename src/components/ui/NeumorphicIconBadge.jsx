import React from 'react';

const NeumorphicIconBadge = ({ 
  icon: Icon, 
  size = 'md', 
  variant = 'default', 
  className = '', 
  onClick, 
  clickable = false,
  badge 
}) => {
  return (
    <div className="relative inline-block">
      <div 
        className={`neumorphic-icon-badge ${size} variant-${variant} ${clickable ? 'clickable' : ''} ${className}`}
        onClick={clickable ? onClick : undefined}
      >
        {Icon && <Icon />}
      </div>
      {badge && (
        <div className="neumorphic-avatar-badge">
          <span style={{ transform: 'translateY(-1px)' }}>{badge}</span>
        </div>
      )}
    </div>
  );
};

export default NeumorphicIconBadge;