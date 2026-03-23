import React from 'react';

const NeumorphicAvatar = ({ src, alt, size = 'md', initials, badge, icon }) => {
  return (
    <div className="relative inline-block">
      <div className={`neumorphic-avatar ${size}`}>
        {src ? (
          <img src={src} alt={alt} />
        ) : icon ? (
          icon
        ) : (
          <span style={{ transform: 'translateY(-1px)' }}>{initials}</span>
        )}
      </div>
      {badge && (
        <div className="neumorphic-avatar-badge">
          <span style={{ transform: 'translateY(-1px)' }}>{badge}</span>
        </div>
      )}
    </div>
  );
};

export default NeumorphicAvatar;