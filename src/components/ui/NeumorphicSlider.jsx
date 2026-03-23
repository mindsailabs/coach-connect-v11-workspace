import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const NeumorphicSlider = ({ 
  min = 0, 
  max = 100, 
  initialValue = 50, 
  onChange,
  icon: Icon = Activity // Allow custom icon, default to Activity
}) => {
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div className="neumorphic-slider-container">
      {/* Slider track */}
      <div className="neumorphic-slider-track">
        {/* Progress line */}
        <div
          className="neumorphic-slider-progress"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Slider thumb with icon and value */}
      <motion.div
        className="neumorphic-slider-thumb"
        style={{
          left: `calc(${progress}% - 10px)`,
          marginTop: '-10px',
        }}
        animate={{
          scale: isDragging ? 1.1 : isHovered ? 1.05 : 1,
          y: isDragging ? -2 : 0
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {/* Icon container */}
        <div
          className={`neumorphic-slider-icon ${isDragging ? 'dragging active' : isHovered ? 'hovered active' : 'active'}`}
        >
          <Icon />
        </div>

        {/* Value display */}
        <div className="neumorphic-slider-value">
          {Math.round(value)}
        </div>
      </motion.div>

      {/* Invisible input for drag functionality */}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsDragging(false);
        }}
        className="neumorphic-slider-input"
      />
    </div>
  );
};

export default NeumorphicSlider;