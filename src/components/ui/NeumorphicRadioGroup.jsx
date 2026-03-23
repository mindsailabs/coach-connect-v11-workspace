import React, { useState } from 'react';

const NeumorphicRadioGroup = ({ options, name, onValueChange }) => {
  const [selectedValue, setSelectedValue] = useState(null);
  const [hoveredValue, setHoveredValue] = useState(null);

  const handleClick = (value) => {
    setSelectedValue(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <div className="neumorphic-radio-container">
      {options.map(option => (
        <div 
          key={option.value} 
          className="neumorphic-radio-item" 
          onClick={() => handleClick(option.value)}
          onMouseEnter={() => setHoveredValue(option.value)}
          onMouseLeave={() => setHoveredValue(null)}
        >
          <div className={`neumorphic-radio-circle ${selectedValue === option.value ? 'selected' : ''}`}>
            {selectedValue === option.value && <div className="neumorphic-radio-dot"></div>}
          </div>
          <span 
            className="neumorphic-radio-label"
            style={{
              transform: hoveredValue === option.value ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 200ms ease-out'
            }}
          >
            {option.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default NeumorphicRadioGroup;