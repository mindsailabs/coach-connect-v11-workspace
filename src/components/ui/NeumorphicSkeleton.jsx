import React from 'react';
import { motion } from 'framer-motion';

const NeumorphicSkeleton = ({ width = 'w-full', height = 'h-4', className = '', count = 1, variant = 'default' }) => {
  const skeleton = (
    <motion.div
      className={`${width} ${height} ${className} rounded-lg`}
      style={{
        background: 'var(--nm-background)',
        boxShadow: 'var(--nm-shadow-inset)',
      }}
      animate={{ opacity: [0.6, 0.8, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{skeleton}</div>
        ))}
      </div>
    );
  }

  return skeleton;
};

export const NeumorphicListSkeleton = ({ itemCount = 5 }) => {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--nm-background)',
        boxShadow: 'var(--nm-shadow-main)',
      }}
    >
      <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
        {Array.from({ length: itemCount }).map((_, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-4 px-6 py-4"
            animate={{ opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          >
            {/* Avatar skeleton */}
            <div
              className="w-12 h-12 rounded-full flex-shrink-0"
              style={{
                background: 'var(--nm-background)',
                boxShadow: 'var(--nm-shadow-inset)',
              }}
            />

            {/* Main content skeleton */}
            <div className="flex-1 space-y-2 min-w-0">
              <div
                className="h-4 rounded-lg"
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-shadow-inset)',
                  width: '65%',
                }}
              />
              <div
                className="h-3 rounded-lg"
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-shadow-inset)',
                  width: '45%',
                }}
              />
            </div>

            {/* Right side elements - hidden on mobile to match layout */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              {/* Badge skeleton */}
              <div
                className="h-6 rounded-lg"
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-shadow-inset)',
                  width: '70px',
                }}
              />

              {/* Secondary info skeleton */}
              <div
                className="h-4 rounded-lg"
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-shadow-inset)',
                  width: '80px',
                }}
              />
            </div>

            {/* Chevron skeleton */}
            <div
              className="w-5 h-5 flex-shrink-0"
              style={{
                background: 'var(--nm-background)',
                boxShadow: 'var(--nm-shadow-inset)',
                borderRadius: '6px',
              }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default NeumorphicSkeleton;