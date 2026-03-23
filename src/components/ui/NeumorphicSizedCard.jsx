import React, { useState, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NeumorphicSizedCard = (props) => {
  const { 
    children, 
    size = '100%', 
    className = '', 
    onClick,
    collapsible = false,
    title = '',
    defaultOpen = true,
    ...otherProps
  } = props;
  
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const cardRef = useRef(null);

  const handleToggle = useCallback(() => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && cardRef.current && window.innerWidth < 768) {
      // Wait for expand animation, then scroll so card top is visible
      // Account for bottom nav (~70px) by using 'nearest' and manual offset
      setTimeout(() => {
        const el = cardRef.current;
        const scrollParent = el.closest('[class*="overflow-y"]') || el.parentElement;
        if (scrollParent) {
          const parentRect = scrollParent.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const offsetTop = elRect.top - parentRect.top + scrollParent.scrollTop;
          // Scroll so the card starts near the top with a small margin
          scrollParent.scrollTo({ top: offsetTop - 16, behavior: 'smooth' });
        }
      }, 350);
    }
  }, [isOpen]);

  const baseStyle = {
    borderRadius: 'var(--nm-radius)',
    background: 'var(--nm-background)',
    boxShadow: 'var(--nm-shadow-main)',
  };

  const sizes = {
    '15%': 'w-[15%]',
    '25%': 'w-[25%]',
    '50%': 'w-[50%]',
    '75%': 'w-[75%]',
    '100%': 'w-full'
  };

  const sizeClass = sizes[size] || sizes['100%'];

  if (!collapsible) {
    return (
      <div 
        style={baseStyle} 
        className={`p-6 transition-all duration-300 hover:shadow-[var(--nm-shadow-hover)] hover:-translate-y-0.5 ${sizeClass} ${className}`}
        onClick={onClick}
        {...otherProps}
      >
        {children}
      </div>
    );
  }

  return (
    <div 
      ref={cardRef}
      style={baseStyle} 
      className={`transition-all duration-300 hover:shadow-[var(--nm-shadow-hover)] hover:-translate-y-0.5 ${sizeClass} ${className}`}
      {...otherProps}
    >
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={handleToggle}
      >
        <span className="font-normal text-lg">{title}</span>
        <motion.div
           animate={{ rotate: isOpen ? 180 : 0 }}
           transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5"/>
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible', transitionEnd: { overflow: 'visible' } }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-6 pb-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeumorphicSizedCard;