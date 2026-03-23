import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NeumorphicButton = ({ children, onClick, className = '', icon: Icon, variant = 'default', loading = false, size = 'md' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false); // Added for active/pressed state

  const baseStyle = {
    borderRadius: 'var(--nm-radius)',
  };

  const variants = {
    default: {
      background: 'var(--nm-background)',
      color: 'var(--nm-text-color)',
      boxShadow: 'var(--nm-shadow-main)',
    },
    primary: {
      background: '#2f949d',
      color: '#ffffff',
      boxShadow: 'var(--nm-shadow-main)',
    },
    // Fix Generate Button Styling: Added distinct color for the generate variant
    generate: {
      background: 'var(--nm-background)',
      color: '#2f949d', // Distinct text color to match the Zap icon
      boxShadow: 'var(--nm-shadow-main)',
    },
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
  };

  const currentVariant = variants[variant] || variants.default;

  const combinedStyle = {
    ...baseStyle,
    ...currentVariant
  };

  const getActiveStyle = () => {
    if (variant === 'primary') {
      return {
        boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.3), inset -2px -2px 6px rgba(255,255,255,0.1)',
      };
    }
    return {
      boxShadow: 'var(--nm-shadow-inset)',
    };
  };

  const getButtonStyle = () => {
    if (variant === 'generate' && loading) {
      return {
        ...combinedStyle,
        boxShadow: 'var(--nm-shadow-inset)',
        transform: 'scale(0.98)'
      };
    }
    return combinedStyle;
  };

  // Sparkle positions for special button effects - positioned around icon area
  const sparklePositions = [
    { x: -10, y: -8 }, { x: -5, y: -12 }, { x: -15, y: 2 },
    { x: -7, y: 5 }, { x: -13, y: -15 }, { x: -3, y: 8 },
    { x: -11, y: -5 }, { x: -17, y: -2 }
  ];

  return (
    <div className="relative" style={{ pointerEvents: 'none' }}>
      {/* Special button effects - particles for generate and other special variants */}
      <AnimatePresence>
        {variant === 'generate' && loading && (
          <>
            {/* Sparkle particles - positioned around icon area with size-responsive positioning */}
            {sparklePositions.map((pos, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [0, 0.8, 0],
                  rotate: [0, 180, 360],
                  x: [0, pos.x, 0],
                  y: [0, pos.y, 0],
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.1,
                  ease: "easeInOut"
                }}
                className="absolute top-1/2 w-2 h-2 pointer-events-none"
                style={{ 
                  zIndex: 40,
                  left: size === 'sm' ? 'calc(2rem)' : 'calc(2rem + 5px)'
                }}
              >
                <div className="w-full h-full rounded-full" 
                     style={{ 
                       backgroundColor: '#ffffff',
                       boxShadow: '2px 2px 4px #d1d9e6, 4px 4px 8px #d1d9e6'
                     }} 
                />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      <button
        onClick={onClick}
        disabled={loading}
        className={`
          font-normal 
          text-center
          focus:outline-none focus:ring-0 focus:border-none
          neumorphic-button
          relative z-20
          transition-all duration-200 ease-out
          ${sizes[size]}
          ${className}
        `}
        data-variant={variant}
        style={{
          ...getButtonStyle(),
          pointerEvents: 'auto',
          transform: (isHovered && !loading) ? 'scale(1.02)' : 
                    (loading && variant === 'generate') ? 'scale(0.98)' : 
                    (isPressed && !loading) ? 'scale(0.98)' : 'scale(1)',
          boxShadow: (loading && variant === 'generate') ? 'var(--nm-shadow-inset)' :
                     (isPressed && !loading) ? getActiveStyle().boxShadow : 
                     getButtonStyle().boxShadow,
          transition: 'all 200ms ease-out'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={(e) => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onFocus={(e) => e.target.style.outline = 'none'}
        onBlur={(e) => e.target.style.outline = 'none'}
      >
        <div className="flex items-center justify-center gap-2 relative z-30">
          {(variant === 'generate' || Icon) && (
              <motion.div 
                className="flex-shrink-0 flex items-center justify-center" 
                style={{ 
                  width: variant === 'generate' ? '20px' : '20px',
                  height: '20px'
                }}
                animate={
                  variant === 'generate' && loading ? {
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  } : variant === 'generate' && !loading && isHovered ? {
                    scale: [1, 1.15, 1],
                    transition: { 
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }
                  } : {}
                }
                transition={{ 
                  duration: 0.5,
                  repeat: loading ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                  {variant === 'generate' && !loading && (
                      <Zap className="w-5 h-5" style={{ color: '#2f949d' }} />
                  )}
                  {Icon && variant !== 'generate' && <Icon className="w-5 h-5" />}
              </motion.div>
          )}
          <motion.span 
            animate={variant === 'generate' && loading ? {
              color: ['var(--nm-text-color)', '#2f949d', 'var(--nm-text-color)']
            } : {}}
            transition={{
              duration: 1.5,
              repeat: loading ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            {children}
          </motion.span>
        </div>
      </button>
    </div>
  );
};

export default NeumorphicButton;