import React from 'react';

const NeumorphicInput = React.forwardRef(({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange = () => {},
  className = '', 
  onKeyPress,
  widthClass = 'w-full',
  ...props
}, ref) => {
  const handleChange = (e) => {
    if (typeof onChange === 'function') {
      onChange(e);
    }
  };

  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onKeyPress={onKeyPress}
      className={`${widthClass} px-4 py-3 ${className}`}
      style={{
        background: 'var(--nm-background)',
        boxShadow: 'var(--nm-shadow-inset)',
        border: 'none',
        borderRadius: '12px',
        outline: 'none',
        color: 'var(--nm-text-color)',
        transition: 'all 0.3s ease',
        ...props.style
      }}
      {...props}
    />
  );
});

NeumorphicInput.displayName = 'NeumorphicInput';

export default NeumorphicInput;