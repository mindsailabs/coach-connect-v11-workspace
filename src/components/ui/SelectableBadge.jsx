
import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import NeumorphicBadge from './NeumorphicBadge';
import NeumorphicSelect from './NeumorphicSelect';

const SelectableBadge = ({ 
  badges = [], 
  onAdd, 
  onRemove, 
  variant = 'default', 
  size = 'md',
  options = [],
  placeholder = 'Select badge...',
  solid = false
}) => {
  const [isSelecting, setIsSelecting] = useState(badges.length === 0); // Auto-show if no badges
  const [selectedValue, setSelectedValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Mark as initialized after first render to enable transitions
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-show dropdown when all badges are removed
  useEffect(() => {
    if (badges.length === 0) {
      setIsSelecting(true);
    }
  }, [badges.length]);

  // Add Escape key handler for closing dropdown
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isSelecting) {
        setIsSelecting(false);
        setSelectedValue('');
      }
    };

    if (isSelecting) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isSelecting]);

  // Handle value change from dropdown
  const handleSelectChange = (value) => {
    if (value) {
      onAdd?.(value);
      setSelectedValue('');
      setIsSelecting(false);
    }
  };

  // Calculate container styles based on size
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

  // Filter out already selected options (no "Add New" option)
  const availableOptions = options
    .filter(option => {
      const optionValue = typeof option === 'string' ? option : option.label;
      return !badges.includes(optionValue);
    })
    .map(option => typeof option === 'string' ? { value: option, label: option } : option);

  return (
    <>
      <style>
        {`
          /* Force select trigger to match badge height exactly */
          .selectable-badge-select [data-radix-select-trigger] {
            height: ${size === 'sm' ? '22px' : size === 'lg' ? '36px' : '28px'} !important;
            max-height: ${size === 'sm' ? '22px' : size === 'lg' ? '36px' : '28px'} !important;
            padding: 0 28px 0 12px !important;
            line-height: ${size === 'sm' ? '22px' : size === 'lg' ? '36px' : '28px'} !important;
            min-height: unset !important;
            display: flex !important;
            align-items: center !important;
            border: none !important;
            font-size: ${size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem'} !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          
          /* Constrain wrapper height */
          .selectable-badge-select .select-wrapper {
            height: ${size === 'sm' ? '22px' : size === 'lg' ? '36px' : '28px'} !important;
            max-height: ${size === 'sm' ? '22px' : size === 'lg' ? '36px' : '28px'} !important;
            overflow: hidden !important;
          }
        `}
      </style>
      <div className="flex flex-wrap gap-2 items-center">
        {badges.map((badge, index) => {
          // Use cycling color variants for visual distinction
          const badgeVariant = variantCycle[index % variantCycle.length];
          
          return (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <NeumorphicBadge
                variant={badgeVariant}
                size={size}
                solid={solid}
                className={`${isInitialized ? 'transition-all duration-300 hover:shadow-[var(--nm-shadow-hover)]' : ''} ${hoveredIndex === index && onRemove ? 'pr-6' : ''}`}
              >
                <span>{badge}</span>
              </NeumorphicBadge>
              {onRemove && hoveredIndex === index && (
                <button
                  onClick={() => onRemove(index)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 hover:text-red-500 transition-all duration-200"
                  aria-label={`Remove ${badge}`}
                >
                  <X className={iconSize} />
                </button>
              )}
            </div>
          );
        })}

        {isSelecting ? (
          <div 
            className={`inline-flex items-center selectable-badge-select`}
            style={{
              borderRadius: '12px',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
              minWidth: '120px',
              // Match badge height exactly
              height: size === 'sm' ? '22px' : size === 'lg' ? '36px' : '28px',
              maxHeight: size === 'sm' ? '22px' : size === 'lg' ? '36px' : '28px',
              overflow: 'hidden'
            }}
          >
            <div className="w-full select-wrapper" style={{ 
              height: size === 'sm' ? '22px' : size === 'lg' ? '36px' : '28px',
              maxHeight: size === 'sm' ? '22px' : size === 'lg' ? '36px' : '28px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center'
            }}>
              <NeumorphicSelect
                placeholder={placeholder}
                options={availableOptions}
                value={selectedValue}
                onValueChange={handleSelectChange}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsSelecting(true)}
            disabled={availableOptions.length === 0}
            className={`inline-flex items-center justify-center ${buttonWidth} ${buttonHeight} ${isInitialized ? 'transition-all duration-300 hover:scale-110' : ''} ${availableOptions.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{
              borderRadius: '12px',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
            }}
            aria-label="Add badge"
          >
            <Plus className={iconSize} />
          </button>
        )}
      </div>
    </>
  );
};

export default SelectableBadge;
