
import React, { useState } from 'react';
import { Home, User, Settings, FileText, BarChart3, Bell } from 'lucide-react';

const NeumorphicNavigation = () => {
  const [activeItem, setActiveItem] = useState('home');
  const [hoveredItem, setHoveredItem] = useState(null);

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="neumorphic-nav-container w-64">
      <div className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          const isHovered = hoveredItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onMouseDown={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = 'scale(0.98)';
                }
              }}
              onMouseUp={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = isHovered ? 'scale(1.02)' : 'scale(1)';
                }
              }}
              className={`neumorphic-nav-item ${isActive ? 'active' : ''}`}
              style={{
                transform: !isActive && isHovered ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 200ms ease-out'
              }}
            >
              <Icon className="neumorphic-nav-icon" />
              <span className="neumorphic-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NeumorphicNavigation;
