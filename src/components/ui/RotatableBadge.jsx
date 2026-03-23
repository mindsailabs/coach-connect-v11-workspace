import React, { useState } from 'react';
import NeumorphicBadge from './NeumorphicBadge';
import { RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

const RotatableBadge = ({ states, variant = 'default', colors, solid = false, onRotate, initialState, alwaysShowIcon = false }) => {
  const initialIndex = initialState ? states.indexOf(initialState) : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [isHovered, setIsHovered] = useState(false);

  const handleRotate = (e) => {
    e.stopPropagation(); // Prevent any parent clicks
    const nextIndex = (currentIndex + 1) % states.length;
    setCurrentIndex(nextIndex);
    
    // Determine the next variant
    const nextVariant = colors ? (colors[nextIndex] || variant) : variant;
    onRotate?.(states[nextIndex], nextVariant, nextIndex);
  };

  // Determine the current variant - use colors array if provided, otherwise use single variant
  const currentVariant = colors ? (colors[currentIndex] || variant) : variant;

  return (
    <div 
      className="relative cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRotate}
    >
      <NeumorphicBadge variant={currentVariant} solid={solid}>
        {states[currentIndex]}
      </NeumorphicBadge>
      <div
        className={`absolute -bottom-2 -right-2 bg-[--nm-background] rounded-full p-0.5 transition-all duration-200 ${
          alwaysShowIcon 
            ? 'opacity-100 scale-100' 
            : 'opacity-100 scale-100 md:opacity-0 md:scale-50 group-hover:opacity-100 group-hover:scale-100'
        }`}
        style={{ boxShadow: 'var(--nm-shadow-main)' }}
      >
        <RotateCw className="w-3 h-3 text-[--nm-text-color]" />
      </div>
    </div>
  );
};

export default RotatableBadge;