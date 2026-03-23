import React from 'react';

export default function ViewHeader({ title, subtitle, icons = [], children }) {
  return (
    <div className="flex flex-col w-full mb-6">
      <div className="mx-3 pt-2 flex items-center justify-between min-h-[44px]">
        <div className="flex items-baseline gap-3">
          {title && <h2 className="text-2xl font-normal">{title}</h2>}
          {subtitle && <span className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>{subtitle}</span>}
        </div>
        <div className="flex items-center gap-4 justify-end flex-1">
          {icons.map((item, idx) => {
            if (React.isValidElement(item)) {
              return React.cloneElement(item, { key: item.key || idx });
            }

            const Icon = item.icon;
            if (!Icon) return null;

            return (
              <button
                key={item.id || idx}
                onClick={item.onClick}
                className={`p-2 rounded-full transition-all duration-200 ${item.isActive ? '' : 'hover:scale-105'} flex-shrink-0 relative ${item.className || ''}`}
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: item.isActive ? 'var(--nm-shadow-inset)' : 'var(--nm-shadow-main)',
                  border: 'none',
                  cursor: 'pointer',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...item.style
                }}
                title={item.label}>

                <Icon className={`w-4 h-4 ${item.iconClassName || ''}`} style={{ color: item.color || (item.isActive ? 'var(--nm-badge-primary-color)' : 'var(--nm-badge-default-color)') }} />
                {item.badge &&
                <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--nm-background)] bg-orange-500" />
                }
              </button>);

          })}
        </div>
      </div>
      {children && <div className="w-full">{children}</div>}
    </div>);

}