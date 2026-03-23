import React, { useState, useEffect } from 'react';

const NeumorphicRatingDots = ({ 
  maxRating = 5, 
  initialRating = 0, 
  onRatingChange,
  size = 'md',
  readonly = false 
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  // Update internal rating when initialRating changes
  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-6 h-6'
  };

  const handleClick = (value) => {
    if (readonly) return;
    setRating(value);
    if (onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (readonly) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  const getActiveRating = () => {
    return hoverRating || rating;
  };

  return (
    <div className={`neumorphic-rating-container ${size}`}>
      {Array.from({ length: maxRating }, (_, index) => {
        const dotValue = index + 1;
        const isActive = dotValue <= getActiveRating();
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(dotValue)}
            onMouseEnter={() => handleMouseEnter(dotValue)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`
              neumorphic-rating-dot
              ${sizes[size]}
              ${isActive ? 'active' : ''}
              ${readonly ? 'readonly' : ''}
            `}
            aria-label={`Rate ${dotValue} out of ${maxRating}`}
            tabIndex={readonly ? -1 : 0}
          />
        );
      })}
    </div>
  );
};

export default NeumorphicRatingDots;