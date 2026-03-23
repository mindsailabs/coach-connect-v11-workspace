import React, { useState } from 'react';

const NeumorphicTabs = ({ tabs, variant = 'main' }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredTab, setHoveredTab] = useState(null);

  const mainStyles = {
    container: { boxShadow: 'var(--nm-shadow-inset)', height: '52px' },
    button: 'px-4 py-2 font-normal text-base h-full',
    active: { boxShadow: 'var(--nm-shadow-main)', color: '#2f949d', paddingTop: '11px', paddingBottom: '11px' },
  };

  const subStyles = {
    container: { boxShadow: 'var(--nm-shadow-inset)', height: '40px' },
    button: 'px-3 py-1 font-normal text-sm h-full',
    active: { boxShadow: 'var(--nm-shadow-main)', color: '#2f949d', paddingTop: '6px', paddingBottom: '6px' }
  };
  
  const styles = variant === 'main' ? mainStyles : subStyles;

  return (
    <div>
      <div className="flex items-center gap-2 rounded-full justify-start" style={styles.container}>
         {tabs.map((tab, index) => (
           <button
             key={index}
             onClick={() => {
               if (tab.onClick) {
                 tab.onClick();
               } else {
                 setActiveTab(index);
               }
             }}
             onMouseEnter={() => setHoveredTab(index)}
             onMouseLeave={() => setHoveredTab(null)}
            style={{
              ...(activeTab === index ? styles.active : {}),
              transform: hoveredTab === index ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 200ms ease-out, all 300ms'
            }}
            className={`${styles.button} rounded-full focus:outline-none focus:ring-0 focus:border-none flex items-center justify-center gap-2 whitespace-nowrap`}
            onFocus={(e) => e.target.style.outline = 'none'}
            onBlur={(e) => e.target.style.outline = 'none'}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tabs[activeTab].content}
      </div>
    </div>
  );
};

export default NeumorphicTabs;