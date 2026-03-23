import React, { useState } from 'react';
import { Check } from 'lucide-react';

const NeumorphicCheckbox = ({ label, initialChecked = false, onCheckedChange }) => {
  const [isChecked, setIsChecked] = useState(initialChecked);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    if (onCheckedChange) {
      onCheckedChange(newState);
    }
  };

  return (
    <div 
      className="neumorphic-checkbox-container" 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`neumorphic-checkbox-box ${isChecked ? 'checked' : ''}`}>
        {isChecked && <Check className="w-4 h-4" style={{ color: '#2f949d' }} />}
      </div>
      {label && (
        <span 
          className="neumorphic-checkbox-label"
          style={{
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            transition: 'transform 200ms ease-out'
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default NeumorphicCheckbox;