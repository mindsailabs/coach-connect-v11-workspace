import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const NeumorphicRatingStars = ({ 
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
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
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
        const starValue = index + 1;
        const isActive = starValue <= getActiveRating();
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`
              neumorphic-rating-star
              ${sizes[size]}
              flex items-center justify-center
              ${isActive ? 'active' : ''}
              ${readonly ? 'readonly' : ''}
            `}
            aria-label={`Rate ${starValue} out of ${maxRating} stars`}
            tabIndex={readonly ? -1 : 0}
          >
            <Star 
              className={`${sizes[size]} fill-current`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default NeumorphicRatingStars;