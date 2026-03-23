import React, { useState } from 'react';
import { Plus, StickyNote, ClipboardList, Sparkles, MessageSquare, Calendar, ArrowLeft, Save } from 'lucide-react';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import { AnimatePresence, motion } from 'framer-motion';
import NotificationsPanel from '@/components/app/NotificationsPanel';
import NeumorphicAvatar from '@/components/ui/NeumorphicAvatar';

const quickItems = [
  { id: 'add_note', label: 'Add Note', icon: StickyNote },
  { id: 'create_task', label: 'Create Task', icon: ClipboardList },
  { id: 'send_message', label: 'Send Message', icon: MessageSquare },
  { id: 'add_session', label: 'Add Session', icon: Calendar },
  { id: 'ai_insights', label: 'AI Insights', icon: Sparkles },
];

const avatarButtonStyles = `
  .avatar-notification-btn:active {
    box-shadow: none !important;
    transform: scale(0.98) !important;
  }
`;

export default function QuickActions({ onSelectAction, onNotificationsOpenChange, externalNotificationsOpen, backButton, onSettingsClick, onApprovalsClick, onSave, avatarUrl }) {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [savedAtTime, setSavedAtTime] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const hasSave = !!onSave;

  React.useEffect(() => {
    if (externalNotificationsOpen !== undefined && externalNotificationsOpen !== notificationsOpen) {
      setNotificationsOpen(externalNotificationsOpen);
    }
  }, [externalNotificationsOpen]);

  // Clear saved time after 3 seconds
  React.useEffect(() => {
    if (savedAtTime && !hasSave) {
      const timer = setTimeout(() => setSavedAtTime(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [savedAtTime, hasSave]);

  // When save completes and onSave becomes null, show the time
  React.useEffect(() => {
    if (justSaved && !hasSave) {
      const now = new Date();
      setSavedAtTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
      setJustSaved(false);
    }
  }, [justSaved, hasSave]);

  // Clear saved time when Save button reappears
  React.useEffect(() => {
    if (hasSave) setSavedAtTime(null);
  }, [hasSave]);

  React.useEffect(() => {
    setSavedAtTime(null);
  }, [backButton?.label]);

  React.useEffect(() => {
    onNotificationsOpenChange?.(notificationsOpen);
  }, [notificationsOpen, onNotificationsOpenChange]);

  const handleSelect = (id) => {
    onSelectAction?.(id);
    setOpen(false);
  };

  const handleQuickActionsToggle = () => {
    setNotificationsOpen(false);
    setOpen(prev => !prev);
  };

  return (
    <div>
      <style>{avatarButtonStyles}</style>
      {/* Fixed top bar */}
      <div 
        className="fixed top-0 left-0 right-0"
        style={{
          zIndex: 105,
          background: 'var(--nm-background)',
          height: '65px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '16px',
          paddingRight: '16px',
          borderBottom: '1px solid rgba(209, 217, 230, 0.4)',
        }}
        onClick={() => setNotificationsOpen(false)}
      >
        {/* Left side - Back button */}
        <AnimatePresence mode="wait">
          {backButton ? (
            <motion.button
              key="back-btn"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => { e.stopPropagation(); backButton.onClick(); }}
              className="bottom-nav-btn flex items-center gap-1.5 text-sm font-normal transition-opacity hover:opacity-70 text-left"
              style={{ color: backButton.unsaved ? 'var(--nm-badge-error-color)' : 'var(--nm-text-color)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 16px 0 0', margin: '0 0 0 -16px', paddingLeft: '16px', minHeight: '65px', WebkitTapHighlightColor: 'transparent' }}
            >
              <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0" />
              <span style={{ lineHeight: '1.15', whiteSpace: 'pre-line' }}>{backButton.label}</span>
            </motion.button>
          ) : (
            <motion.div
              key="spacer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            />
          )}
        </AnimatePresence>

        {/* Right side - Save button + Avatar */}
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            {onSave ? (
              <motion.div
                key="save-btn"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <NeumorphicButton variant="primary" size="sm" icon={Save} onClick={async () => {
                  try {
                    await onSave();
                    setJustSaved(true);
                  } catch (err) {
                    console.error("Save failed", err);
                  }
                }}>
                  Save
                </NeumorphicButton>
              </motion.div>
            ) : savedAtTime ? (
              <motion.span
                key="saved-time"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xs"
                style={{ color: 'var(--nm-badge-default-color)' }}
              >
                saved at {savedAtTime}
              </motion.span>
            ) : null}
          </AnimatePresence>
          <button
            onClick={() => {
              setOpen(false);
              setNotificationsOpen(prev => !prev);
            }}
            className="transition-all duration-200 hover:scale-105 relative avatar-notification-btn"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <NeumorphicAvatar size="md" src={avatarUrl || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69912113f1be4a3812d82cba/676bc8bb2_4042422.png"} />
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
              3
            </div>
          </button>
        </div>
      </div>

      {/* Zap tab + drawer - anchored to right edge */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0"
            style={{ zIndex: 104 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="fixed flex items-end"
        style={{ zIndex: 105, bottom: '30%', right: -72 }}
        initial={false}
        animate={{ x: open ? -72 : 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {/* Zap tab - visually a tab protruding from the drawer */}
        <button
          onClick={handleQuickActionsToggle}
          style={{
            width: 36,
            height: 48,
            background: 'var(--nm-background)',
            boxShadow: '-9px -9px 16px #ffffff, -9px 9px 16px #d1d9e6',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '14px 0 0 14px',
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Plus
            className="w-4 h-4 transition-transform duration-200 hover:scale-125"
            style={{ color: open ? '#2f949d' : 'var(--nm-badge-default-color)', strokeWidth: open ? 2 : 1.5 }}
          />
        </button>

        {/* Drawer panel - seamlessly connected to tab */}
        <div
          style={{
            background: 'var(--nm-background)',
            boxShadow: '-9px -9px 16px #ffffff, 9px 9px 16px #d1d9e6',
            borderRadius: '14px 0 0 var(--nm-radius)',
            position: 'relative',
            zIndex: 1,
            marginLeft: '-1px',
            width: 72,
          }}
        >
          <div className="flex flex-col items-center gap-3 px-2 py-4">
            {quickItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="bottom-nav-btn flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer outline-none focus:outline-none"
                  style={{ minWidth: '36px', WebkitTapHighlightColor: 'transparent' }}
                >
                  <Icon
                    className="w-5 h-5 pointer-events-none"
                    style={{ color: 'var(--nm-badge-default-color)', strokeWidth: 1.5 }}
                  />
                  <span
                    className="text-[9px] font-normal pointer-events-none whitespace-nowrap"
                    style={{ color: 'var(--nm-badge-default-color)' }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onSettingsClick={onSettingsClick}
        onApprovalsClick={onApprovalsClick}
      />
    </div>
  );
}