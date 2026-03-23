
import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown, Check } from 'lucide-react'; // Added Check icon
import NeumorphicBadge from './NeumorphicBadge';
import NeumorphicSelect from './NeumorphicSelect';

const SelectableEditableBadge = ({ 
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
  const [isAddingNew, setIsAddingNew] = useState(false); // New state for adding new badge
  const [newBadge, setNewBadge] = useState(''); // State for new badge input
  const [selectedValue, setSelectedValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const inputRef = useRef(null); // Ref for focusing the new badge input

  // KEY FIX #1: Mark as initialized after first render to enable transitions
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-show dropdown when all badges are removed
  useEffect(() => {
    if (badges.length === 0 && !isAddingNew) {
      setIsSelecting(true);
    }
  }, [badges.length, isAddingNew]);

  // Use requestAnimationFrame to prevent focus-related layout jumps
  useEffect(() => {
    if (isAddingNew && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isAddingNew]);

  // Add click-away functionality for input field
  const inputContainerRef = useRef(null); // Moved this declaration up to be used in useEffect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(event.target)) {
        if (isAddingNew) {
          setIsAddingNew(false);
          setNewBadge('');
        }
      }
    };

    if (isAddingNew) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isAddingNew]);

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

  // Modified handleAdd function to accept value directly
  const handleAdd = (value) => {
    if (value) {
      onAdd?.(value);
      setSelectedValue('');
      setIsSelecting(false);
    }
  };

  // Handler for adding a new badge from the input field
  const handleAddNew = () => {
    if (newBadge.trim()) {
      onAdd?.(newBadge.trim());
      setNewBadge('');
      setIsAddingNew(false);
      setIsSelecting(false); // Ensure select mode is off after adding new
    }
  };

  // Handler for canceling the new badge input
  const handleCancelNew = () => {
    setNewBadge('');
    setIsAddingNew(false);
  };

  // Keyboard events for the new badge input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddNew();
    } else if (e.key === 'Escape') {
      handleCancelNew();
    }
  };

  // SIMPLIFIED: Just handle the value change
  const handleSelectChange = (value) => {
    // If "Add New" option is selected, switch to new badge input mode
    if (value === '__add_new__') {
      setIsSelecting(false); // Hide the select
      setIsAddingNew(true); // Show the input field
      setSelectedValue(''); // Clear selected value
      return;
    }
    
    // Otherwise, directly add the badge and close
    if (value) {
      onAdd?.(value);
      setSelectedValue('');
      setIsSelecting(false);
    }
  };

  // Calculate container styles based on size
  const containerPadding = 
    size === 'sm' ? 'px-2 py-1' : 
    size === 'lg' ? 'px-4 py-2' : 
    'px-3 py-1';
  
  const containerTextSize = 
    size === 'sm' ? 'text-xs' : 
    size === 'lg' ? 'text-base' : 
    'text-sm';

  const buttonHeight = 
    size === 'sm' ? 'h-6' : 
    size === 'lg' ? 'h-10' : 
    'h-7'; // h-7 is 28px

  const buttonWidth = 
    size === 'sm' ? 'w-6' : 
    size === 'lg' ? 'w-10' : 
    'w-7'; // w-7 is 28px

  const iconSize = 
    size === 'sm' ? 'w-3 h-3' : 
    size === 'lg' ? 'w-4 h-4' : 
    'w-3.5 h-3.5';

  // Cycling color variants for visual distinction
  const variantCycle = ['category', 'primary', 'success', 'warning', 'info', 'learning', 'checkin', 'accent'];

  // Filter out already selected options and add "Add New" option
  const availableOptions = [
    { value: '__add_new__', label: 'Add New' }, // Always provide an "Add New" option
    ...options
      .filter(option => {
        const optionValue = typeof option === 'string' ? option : option.label;
        return !badges.includes(optionValue);
      })
      .map(option => typeof option === 'string' ? { value: option, label: option } : option)
  ];


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

          /* Styles for the new editable badge input */
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

        {isAddingNew ? ( // Conditional rendering for the new badge input field
          <div 
            ref={inputContainerRef} // Add ref for click-away detection
            className={`inline-flex items-center gap-1 ${containerPadding} ${containerTextSize}`}
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
              placeholder="Add new..."
              className="bg-transparent outline-none min-w-[75px] max-w-[150px] editable-badge-input"
              style={{ color: 'var(--nm-badge-default-color)', textShadow: 'none !important' }}
            />
            <button
              onClick={handleAddNew}
              className="text-[var(--nm-badge-success-color)] hover:opacity-80 transition-opacity"
              style={{ textShadow: 'none' }}
              aria-label="Confirm new badge"
            >
              <Check className={iconSize} />
            </button>
          </div>
        ) : isSelecting ? ( // Existing logic for the select dropdown
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
                options={availableOptions} // Pass prepared options directly
                value={selectedValue}
                onValueChange={handleSelectChange}
              />
            </div>
          </div>
        ) : ( // Existing logic for the add button
          <button
            onClick={() => setIsSelecting(true)}
            // Disable if only the "Add New" option is available (meaning no other options to select)
            disabled={availableOptions.length <= 1 && options.length === 0} 
            className={`inline-flex items-center justify-center ${buttonWidth} ${buttonHeight} ${isInitialized ? 'transition-all duration-300 hover:scale-110' : ''} ${availableOptions.length <= 1 && options.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
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

export default SelectableEditableBadge;
