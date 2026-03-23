import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, AlertCircle, Info, Calendar, Users, Target, Settings, CheckSquare, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';

const DEMO_NOTIFICATIONS = [
  {
    id: 1,
    type: 'session',
    icon: Calendar,
    title: 'Session Reminder',
    message: 'You have a session with Sarah Mitchell tomorrow at 10:00 AM',
    time: '2 hours ago',
    read: false,
    variant: 'info'
  },
  {
    id: 2,
    type: 'task',
    icon: CheckCircle2,
    title: 'Task Completed',
    message: 'Sarah Mitchell completed "Week 1 Food Journal"',
    time: '5 hours ago',
    read: false,
    variant: 'success'
  },
  {
    id: 3,
    type: 'journey',
    icon: Target,
    title: 'Journey Milestone',
    message: 'Marcus Johnson reached 50% completion on Performance Optimization',
    time: '1 day ago',
    read: true,
    variant: 'primary'
  },
  {
    id: 4,
    type: 'message',
    icon: Users,
    title: 'New Message',
    message: 'Amanda Foster sent you a message about stress techniques',
    time: '1 day ago',
    read: true,
    variant: 'default'
  },
  {
    id: 5,
    type: 'alert',
    icon: AlertCircle,
    title: 'Payment Due',
    message: 'Invoice #1234 is due for David Thompson in 3 days',
    time: '2 days ago',
    read: true,
    variant: 'warning'
  },
  {
    id: 6,
    type: 'info',
    icon: Info,
    title: 'System Update',
    message: 'New features added: Enhanced journey tracking and analytics',
    time: '3 days ago',
    read: true,
    variant: 'default'
  }
];

export default function NotificationsPanel({ isOpen, onClose, onSettingsClick, onApprovalsClick }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = React.useState(DEMO_NOTIFICATIONS);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleMarkAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0"
            style={{ zIndex: 104 }}
            onClick={onClose}
          />

          {/* Panel - renders below the 65px Quick Actions bar */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed md:absolute left-0 right-0 bottom-0 flex flex-col"
            style={{
              zIndex: 110,
              top: '65px',
              borderRadius: '0',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
            }}
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pb-8" style={{ paddingTop: '24px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>

              <div className="space-y-6">
                {/* Quick Action Icons */}
                <NeumorphicCard className="!p-4">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => { onClose(); onApprovalsClick?.(); }}
                      className="rounded-full transition-all duration-200 hover:scale-105 flex-shrink-0 relative"
                      style={{
                        width: 40,
                        height: 40,
                        background: 'var(--nm-background)',
                        boxShadow: 'var(--nm-shadow-main)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckSquare className="w-5 h-5" style={{ color: 'var(--nm-badge-default-color)', strokeWidth: 1.5 }} />
                      <div
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{
                          background: '#2f949d',
                          color: '#fff',
                          fontSize: '0.625rem',
                          fontWeight: 'bold',
                          boxShadow: 'var(--nm-shadow-main)',
                        }}
                      >
                        2
                      </div>
                    </button>
                    <button
                      onClick={() => { onClose(); navigate(createPageUrl('App')); sessionStorage.setItem('activeNavigation', 'lifescores'); }}
                      className="rounded-full transition-all duration-200 hover:scale-105 flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: 'var(--nm-background)',
                        boxShadow: 'var(--nm-shadow-main)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BookOpen className="w-5 h-5" style={{ color: 'var(--nm-badge-default-color)', strokeWidth: 1.5 }} />
                    </button>
                    <button
                      onClick={() => { onClose(); onSettingsClick?.(); }}
                      className="rounded-full transition-all duration-200 hover:scale-105 flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        background: 'var(--nm-background)',
                        boxShadow: 'var(--nm-shadow-main)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Settings className="w-5 h-5" style={{ color: 'var(--nm-badge-default-color)', strokeWidth: 1.5 }} />
                    </button>
                  </div>
                </NeumorphicCard>

                {/* Header Card */}
                <NeumorphicCard>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="neumorphic-icon-badge md"
                        style={{ position: 'relative' }}
                      >
                        <Bell className="w-5 h-5" style={{ color: 'var(--nm-badge-primary-color)' }} />
                        {unreadCount > 0 && (
                          <div className="neumorphic-avatar-badge" style={{ background: '#2f949d', color: '#fff' }}>
                            {unreadCount}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-normal">Notifications</h3>
                        <p className="text-sm mt-1" style={{ color: 'var(--nm-badge-default-color)' }}>
                          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                        </p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm font-normal transition-opacity hover:opacity-70"
                        style={{ color: 'var(--nm-badge-primary-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </NeumorphicCard>

                {/* Notifications List */}
                <div className="space-y-4">
                  {notifications.map((notification) => {
                    const Icon = notification.icon;
                    return (
                      <NeumorphicCard
                        key={notification.id}
                        className="cursor-pointer"
                        onClick={() => handleMarkAsRead(notification.id)}
                        clickable
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="neumorphic-icon-badge md flex-shrink-0"
                          >
                            <Icon className="w-5 h-5" style={{ color: `var(--nm-badge-${notification.variant}-color)` }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-normal" style={{ color: notification.read ? 'var(--nm-badge-default-color)' : 'var(--nm-text-color)' }}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                  style={{ background: '#2f949d' }}
                                />
                              )}
                            </div>
                            <p className="text-sm mb-2" style={{ color: 'var(--nm-badge-default-color)' }}>
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2">
                              <NeumorphicBadge variant={notification.variant} size="sm">
                                {notification.type}
                              </NeumorphicBadge>
                              <span className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>
                                {notification.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </NeumorphicCard>
                    );
                  })}
                </div>

                {/* Empty State */}
                {notifications.length === 0 && (
                  <NeumorphicCard>
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--nm-badge-default-color)', opacity: 0.5 }} />
                      <p style={{ color: 'var(--nm-badge-default-color)' }}>No notifications yet</p>
                    </div>
                  </NeumorphicCard>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}