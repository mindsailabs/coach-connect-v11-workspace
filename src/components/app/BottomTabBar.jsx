import React, { useState } from 'react';
import { MoreVertical, Home, Users, ClipboardList, MessageSquare, Calendar, BookOpen, Map, CreditCard } from 'lucide-react';
import LifescoresHeartIcon from '@/components/ui/LifescoresHeartIcon';
import { AnimatePresence, motion } from 'framer-motion';

const moreItems = [
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'journeys', label: 'Journeys', icon: Map },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notebook', label: 'Notebook', icon: BookOpen },
  { id: 'lifescores', label: 'Lifescores™', customIcon: LifescoresHeartIcon },
];

export default function BottomTabBar({ navigationItems, activeItem, onSelectItem }) {
  const [showMore, setShowMore] = useState(false);
  const defaultItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  const handleMoreToggle = () => setShowMore((prev) => !prev);

  const handleSelectMore = (id) => {
    onSelectItem(id);
    setShowMore(false);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[130] md:hidden"
      style={{
        background: 'var(--nm-background)',
        boxShadow: '-9px -9px 16px #ffffff, 9px -9px 16px #d1d9e6',
      }}
    >
      {/* Expanded more panel */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              className="fixed inset-0 z-[68]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden border-b relative z-[71]"
              style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}
            >
              <div className="flex items-end justify-around px-2 pt-3 pb-2 w-full">
                {moreItems.map((item) => {
                  const Icon = item.icon || item.customIcon;
                  const isActive = activeItem === item.id;
                  const isCustomIcon = !!item.customIcon;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectMore(item.id)}
                      className="bottom-nav-btn flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer px-3 py-1 outline-none focus:outline-none active:outline-none select-none flex-1"
                      style={{ minWidth: '60px', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
                    >
                      {isCustomIcon ? (
                        <Icon size={24} isActive={isActive} />
                      ) : (
                        <Icon
                          className="w-6 h-6 pointer-events-none"
                          style={{
                            color: isActive ? '#2f949d' : 'var(--nm-badge-default-color)',
                            strokeWidth: isActive ? 2 : 1.5,
                          }}
                        />
                      )}
                      <span
                        className="text-xs font-normal pointer-events-none"
                        style={{ color: isActive ? '#2f949d' : 'var(--nm-badge-default-color)' }}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main bottom bar */}
      <div className="flex items-end justify-around px-2 pt-3 pb-2 relative z-[72] w-full">
         {defaultItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => { onSelectItem(item.id); setShowMore(false); }}
              className="bottom-nav-btn flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer px-3 py-1 relative outline-none focus:outline-none active:outline-none select-none flex-1"
              style={{ minWidth: '60px', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
            >
              <Icon
                className="w-6 h-6 pointer-events-none"
                style={{
                  color: isActive ? '#2f949d' : 'var(--nm-badge-default-color)',
                  strokeWidth: isActive ? 2 : 1.5,
                }}
              />
              <span
                className="text-xs font-normal pointer-events-none"
                style={{ color: isActive ? '#2f949d' : 'var(--nm-badge-default-color)' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 3 vertical dots */}
        {(() => {
          const isMoreActive = showMore || moreItems.some(item => item.id === activeItem);
          return (
            <button
              onClick={handleMoreToggle}
              className="bottom-nav-btn flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer px-3 py-1 relative outline-none focus:outline-none active:outline-none select-none flex-1"
              style={{ minWidth: '60px', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
            >
              <MoreVertical
                className="w-6 h-6 pointer-events-none"
                style={{
                  color: isMoreActive ? '#2f949d' : 'var(--nm-badge-default-color)',
                  strokeWidth: isMoreActive ? 2 : 1.5,
                }}
              />
              <span
                className="text-xs font-normal pointer-events-none"
                style={{ color: isMoreActive ? '#2f949d' : 'var(--nm-badge-default-color)' }}
              >
                More
              </span>
            </button>
          );
        })()}


      </div>
    </nav>
  );
}