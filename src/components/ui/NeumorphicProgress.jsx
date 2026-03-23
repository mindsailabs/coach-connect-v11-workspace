import React from 'react';
import { motion } from 'framer-motion';

const NeumorphicProgress = ({ value = 0, animated = false, key: animationKey }) => {
  return (
    <div className="neumorphic-progress-track">
      <motion.div 
        className="neumorphic-progress-bar"
        initial={animated ? { width: '0%' } : { width: `${value}%` }}
        animate={{ width: `${value}%` }}
        transition={{ 
          duration: animated ? 0.8 : 0, 
          ease: "easeOut" 
        }}
        key={animationKey}
      />
      <motion.div 
        className="neumorphic-progress-text"
        initial={animated ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ 
          duration: 0.5,
          delay: animated ? 0.6 : 0,
          ease: "easeOut" 
        }}
        key={`text-${animationKey}`}
      >
        {`${Math.round(value)}%`}
      </motion.div>
    </div>
  );
};

export default NeumorphicProgress;