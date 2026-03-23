import React from 'react';

const NeumorphicBadge = ({ children, variant = 'default', size = 'md', className = '', solid = false, icon: Icon }) => {
  const baseStyle = {
    borderRadius: '12px',
    background: solid ? 'transparent' : 'var(--nm-background)',
    boxShadow: 'var(--nm-shadow-main)',
  };

  const outlineVariants = {
    default: 'text-[var(--nm-badge-default-color)]',
    primary: 'text-[var(--nm-badge-primary-color)]',
    success: 'text-[var(--nm-badge-success-color)]',
    warning: 'text-[var(--nm-badge-warning-color)]',
    error: 'text-[var(--nm-badge-error-color)]',
    info: 'text-[var(--nm-badge-info-color)]',
    learning: 'text-[var(--nm-badge-learning-color)]',
    checkin: 'text-[var(--nm-badge-checkin-color)]',
    accent: 'text-[var(--nm-badge-accent-color)]',
    category: 'text-[var(--nm-badge-category-color)]',
    tag: 'text-[var(--nm-badge-tag-color)]',
  };

  const solidVariants = {
    default: { background: 'var(--nm-badge-default-muted)', color: 'var(--nm-badge-default-dark)' },
    primary: { background: 'var(--nm-badge-primary-muted)', color: 'var(--nm-badge-primary-dark)' },
    success: { background: 'var(--nm-badge-success-muted)', color: 'var(--nm-badge-success-dark)' },
    warning: { background: 'var(--nm-badge-warning-muted)', color: 'var(--nm-badge-warning-dark)' },
    error: { background: 'var(--nm-badge-error-muted)', color: 'var(--nm-badge-error-dark)' },
    info: { background: 'var(--nm-badge-info-muted)', color: 'var(--nm-badge-info-dark)' },
    learning: { background: 'var(--nm-badge-learning-muted)', color: 'var(--nm-badge-learning-dark)' },
    checkin: { background: 'var(--nm-badge-checkin-muted)', color: 'var(--nm-badge-checkin-dark)' },
    accent: { background: 'var(--nm-badge-accent-muted)', color: 'var(--nm-badge-accent-dark)' },
    category: { background: 'var(--nm-badge-category-muted)', color: 'var(--nm-badge-category-dark)' },
    tag: { background: 'var(--nm-badge-tag-muted)', color: 'var(--nm-badge-tag-dark)' },
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const currentVariant = solid ? solidVariants[variant] || solidVariants.default : null;
  const textVariant = solid ? '' : outlineVariants[variant] || outlineVariants.default;

  const combinedStyle = solid ? {
    ...baseStyle,
    ...currentVariant
  } : baseStyle;

  return (
    <span
      style={combinedStyle}
      className={`inline-flex items-center gap-1.5 font-normal ${textVariant} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span style={{ transform: 'translateY(-1px)' }}>
        {children}
      </span>
    </span>
  );
};

export default NeumorphicBadge;