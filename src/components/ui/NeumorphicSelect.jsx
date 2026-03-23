import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const NeumorphicSelect = ({ 
  placeholder, 
  options, 
  onValueChange, 
  onChange,
  value, 
  size = 'md',
  icon: Icon,
  widthClass = 'w-full'
}) => {
  const handleChange = onValueChange || onChange;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || value;

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-3 h-auto'
  };

  const handleSelect = (optionValue) => {
    handleChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`${widthClass} relative`} style={{ zIndex: isOpen ? 50 : 'auto' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${widthClass} ${sizeStyles[size]} font-normal flex items-center justify-between transition-all duration-300`}
        style={{
          borderRadius: isOpen ? '12px 12px 0 0' : '12px',
          background: 'var(--nm-background)',
          boxShadow: isOpen 
            ? 'inset 2px 2px 6px #d1d9e6, inset -2px -2px 6px #ffffff' 
            : 'var(--nm-shadow-main)',
          border: 'none',
          outline: 'none',
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {Icon && <Icon className={size === 'sm' ? 'w-3 h-3 flex-shrink-0' : 'w-4 h-4 flex-shrink-0'} style={{ color: 'var(--nm-badge-default-color)' }} />}
          <span className="truncate" style={{ color: value ? 'var(--nm-text-color)' : 'var(--nm-badge-default-color)' }}>
            {value ? displayValue : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 flex-shrink-0 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          style={{ color: 'var(--nm-badge-default-color)' }} 
        />
      </button>

      {/* Dropdown - rendered inline, no portal */}
      {isOpen && (
        <div
          style={{
            borderRadius: '0 0 12px 12px',
            background: 'var(--nm-background)',
            boxShadow: '2px 4px 8px #d1d9e6, -2px 0px 8px #ffffff',
            border: 'none',
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
          }}
        >
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => !option.disabled && handleSelect(option.value)}
              className={`${size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-sm'} font-normal select-none transition-all duration-200 ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-70'}`}
              style={{ color: 'var(--nm-text-color)', background: 'transparent' }}
            >
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NeumorphicSelect;