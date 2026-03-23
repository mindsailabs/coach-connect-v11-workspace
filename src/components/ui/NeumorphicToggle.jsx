import React, { useState } from 'react';

const NeumorphicToggle = ({ initialChecked = false, checked, onToggle, onCheckedChange }) => {
  const [internalState, setInternalState] = useState(initialChecked);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : internalState;

  const handleToggle = () => {
    const newState = !isOn;
    if (!isControlled) {
      setInternalState(newState);
    }
    if (onCheckedChange) {
      onCheckedChange(newState);
    }
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <div 
      className={`neumorphic-toggle-track ${isOn ? 'active' : ''}`}
      onClick={handleToggle}
    >
      <div 
        className={`neumorphic-toggle-thumb ${isOn ? 'active' : ''}`}
      />
    </div>
  );
};

export default NeumorphicToggle;