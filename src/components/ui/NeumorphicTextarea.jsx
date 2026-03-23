import React from 'react';

const NeumorphicTextarea = ({ placeholder, value, onChange, className = '', rows = 4 }) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      className={`w-full px-4 py-3 resize-none ${className}`}
    />
  );
};

export default NeumorphicTextarea;