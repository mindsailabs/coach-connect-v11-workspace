import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import NeumorphicBadge from './NeumorphicBadge';

const EditableBadge = ({ 
  badges = [], 
  onAdd, 
  onRemove, 
  variant = 'default', 
  size = 'md',
  placeholder = 'Add badge...',
  solid = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newBadge, setNewBadge] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const inputRef = useRef(null);
  const inputContainerRef = useRef(null); // New ref for input container

  // KEY FIX #1: Mark as initialized after first render to enable transitions
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // KEY FIX #2: Use requestAnimationFrame to prevent focus-related layout jumps
  useEffect(() => {
    if (isAdding && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isAdding]);

  // Add click-away functionality for input field
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the input container AND if the clicked target is not the 'Add badge' button itself
      // This prevents closing immediately after opening by clicking the add button again.
      if (inputContainerRef.current && !inputContainerRef.current.contains(event.target) && !event.target.closest('[aria-label="Add badge"]')) {
        if (isAdding) {
          setIsAdding(false);
          setNewBadge('');
        }
      }
    };

    if (isAdding) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isAdding]);

  const handleAdd = () => {
    if (newBadge.trim()) {
      onAdd?.(newBadge.trim());
      setNewBadge('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setNewBadge('');
    setIsAdding(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Calculate input field styles based on size
  const inputContainerPadding = 
    size === 'sm' ? 'px-2 py-1' : 
    size === 'lg' ? 'px-4 py-2' : 
    'px-3 py-1';
  
  const inputTextSize = 
    size === 'sm' ? 'text-xs' : 
    size === 'lg' ? 'text-base' : 
    'text-sm';

  const buttonHeight = 
    size === 'sm' ? 'h-6' : 
    size === 'lg' ? 'h-10' : 
    'h-7';

  const buttonWidth = 
    size === 'sm' ? 'w-6' : 
    size === 'lg' ? 'w-10' : 
    'w-7';

  const iconSize = 
    size === 'sm' ? 'w-3 h-3' : 
    size === 'lg' ? 'w-4 h-4' : 
    'w-3.5 h-3.5';

  // Cycling color variants for visual distinction
  const variantCycle = ['category', 'primary', 'success', 'warning', 'info', 'learning', 'checkin', 'accent'];

  return (
    <>
      <style>
        {`
          .editable-badge-input[type="text"] {
            box-shadow: none !important;
            background: transparent !important;
          }
          .editable-badge-input[type="text"]:hover {
            box-shadow: none !important;
          }
          .editable-badge-input[type="text"]:focus {
            box-shadow: none !important;
          }
        `}
      </style>
      <div className="flex flex-wrap gap-2 items-center">
        {badges.map((badge, index) => {
          const badgeVariant = variantCycle[index % variantCycle.length];
          const showDelete = onRemove && selectedIndex === index;
          
          return (
            <div
              key={index}
              className="relative cursor-pointer"
              onClick={() => onRemove ? setSelectedIndex(selectedIndex === index ? null : index) : null}
            >
              <NeumorphicBadge
                variant={badgeVariant}
                size={size}
                solid={solid}
                className={`${isInitialized ? 'transition-all duration-300 hover:shadow-[var(--nm-shadow-hover)]' : ''} ${showDelete ? 'pr-6' : ''}`}
              >
                <span>{badge}</span>
              </NeumorphicBadge>
              {showDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(index); setSelectedIndex(null); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 hover:text-red-500 transition-all duration-200"
                  aria-label={`Remove ${badge}`}
                >
                  <X className={iconSize} />
                </button>
              )}
            </div>
          );
        })}

        {onAdd && (isAdding ? (
          <div 
            ref={inputContainerRef}
            className={`inline-flex items-center gap-1 ${inputContainerPadding} ${inputTextSize}`}
            style={{
              borderRadius: '12px',
              background: 'var(--nm-background)',
              boxShadow: 'inset 2px 2px 5px #b8b8bb, inset -2px -2px 5px #ffffff',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="bg-transparent outline-none min-w-[32px] max-w-[60px] editable-badge-input"
              style={{ color: 'var(--nm-badge-default-color)', textShadow: 'none !important' }}
            />
            <button
              onClick={handleAdd}
              className="text-[var(--nm-badge-success-color)] hover:opacity-80 transition-opacity"
              style={{ textShadow: 'none' }}
              aria-label="Confirm"
            >
              <Check className={iconSize} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className={`inline-flex items-center justify-center gap-1.5 ${badges.length === 0 ? 'px-3' : buttonWidth} ${buttonHeight} ${isInitialized ? 'transition-all duration-300 hover:scale-110' : ''}`}
            style={{
              borderRadius: '12px',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
            }}
            aria-label="Add badge"
          >
            <Plus className={iconSize} />
            {badges.length === 0 && (
              <span className={inputTextSize} style={{ color: 'var(--nm-badge-default-color)' }}>add tag</span>
            )}
          </button>
        ))}
      </div>
    </>
  );
};

export default EditableBadge;