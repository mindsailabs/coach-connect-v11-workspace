import React, { useState } from 'react';
import { Plug, Bell, Shield, Palette, CreditCard, HelpCircle, ChevronRight, LogOut } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import NeumorphicProgress from '@/components/ui/NeumorphicProgress';
import NeumorphicAvatar from '@/components/ui/NeumorphicAvatar';
import SettingsDetailSlider from '@/components/app/SettingsDetailSlider';
import AvatarUpload from '@/components/app/AvatarUpload';
import CreditProgress from '@/components/app/CreditProgress';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const sections = [
  {
    id: 'account',
    title: 'Account',
    description: 'Profile, email & password',
    icon: null,
    color: '#2f949d',
    isAvatar: true,
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connected apps & services',
    icon: Plug,
    color: '#4299e1',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Email, push & in-app alerts',
    icon: Bell,
    color: '#ed8936',
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    description: 'Data, permissions & 2FA',
    icon: Shield,
    color: '#8b5cf6',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Theme, layout & display',
    icon: Palette,
    color: '#ec4899',
  },
  {
    id: 'billing',
    title: 'Billing & Plan',
    description: 'Subscription & invoices',
    icon: CreditCard,
    color: '#48bb78',
  },
  {
    id: 'support',
    title: 'Help & Support',
    description: 'FAQs, docs & contact us',
    icon: HelpCircle,
    color: '#718096',
  },
];

const DUMMY_CONTENT = {
  account: [
    { label: 'Full Name', value: 'Coach Demo' },
    { label: 'Email', value: 'coach@example.com' },
    { label: 'Phone', value: '+44 7700 900000' },
    { label: 'Timezone', value: 'Europe/London' },
    { label: 'Language', value: 'English (UK)' },
  ],
  integrations: [
    { label: 'Google Calendar', value: 'Connected', variant: 'success' },
    { label: 'Zoom', value: 'Not connected', variant: 'default' },
    { label: 'Stripe', value: 'Connected', variant: 'success' },
    { label: 'Slack', value: 'Not connected', variant: 'default' },
    { label: 'Zapier', value: 'Not connected', variant: 'default' },
  ],
  notifications: [
    { label: 'Email notifications', value: 'Enabled', variant: 'success' },
    { label: 'Push notifications', value: 'Disabled', variant: 'default' },
    { label: 'Session reminders', value: '30 min before' },
    { label: 'Weekly digest', value: 'Enabled', variant: 'success' },
    { label: 'Marketing emails', value: 'Disabled', variant: 'default' },
  ],
  privacy: [
    { label: 'Two-factor authentication', value: 'Enabled', variant: 'success' },
    { label: 'Session timeout', value: '30 minutes' },
    { label: 'Data export', value: 'Available' },
    { label: 'Account deletion', value: 'Request via support' },
  ],
  appearance: [
    { label: 'Theme', value: 'Neumorphic Light' },
    { label: 'Accent colour', value: 'Teal (#2f949d)' },
    { label: 'Font', value: 'Lato' },
    { label: 'Compact mode', value: 'Off' },
    { label: 'Sidebar position', value: 'Left' },
  ],
  billing: [
    { label: 'Current plan', value: 'Professional', variant: 'primary' },
    { label: 'Billing cycle', value: 'Monthly' },
    { label: 'Next payment', value: '15 Mar 2026' },
    { label: 'Payment method', value: 'Visa ****4242' },
  ],
  support: [
    { label: 'Documentation', value: 'docs.example.com' },
    { label: 'Email support', value: 'support@example.com' },
    { label: 'Live chat', value: 'Available 9am–5pm' },
    { label: 'App version', value: '2.4.1' },
  ],
};

export default function SettingsSections({ onSectionChange, requestedSection, onUnsavedChange, onSaveHandlerChange, onAvatarChange }) {
  const [activeSection, setActiveSection] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [settingsData, setSettingsData] = useState(DUMMY_CONTENT);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: googleStatus, refetch: refetchGoogleStatus } = useQuery({
    queryKey: ['googleConnectionStatus'],
    queryFn: async () => {
      try {
        const result = await base44.functions.invoke('getGoogleConnectionStatus');
        return result.data;
      } catch (e) {
        return { connected: false };
      }
    },
  });
  const isGoogleConnected = googleStatus?.connected === true;

  const { data: zoomUser, refetch: refetchZoomUser } = useQuery({
    queryKey: ['zoomUser'],
    queryFn: () => base44.auth.me(),
  });
  const isZoomConnected = zoomUser?.zoom_connected === true;

  const handleConnectZoom = async () => {
    try {
      const response = await base44.functions.invoke('zoomOAuthInit');
      const data = response.data;
      const authUrl = data.authUrl || data.url;
      if (authUrl) {
        window.open(authUrl, 'zoom-oauth', 'width=500,height=600,scrollbars=yes');
        const handleMessage = (event) => {
          if (event.data?.type === 'zoom-oauth-success') {
            refetchZoomUser();
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'zoom-oauth-error') {
            console.error('Zoom OAuth error:', event.data.error);
            window.removeEventListener('message', handleMessage);
          }
        };
        window.addEventListener('message', handleMessage);
      }
    } catch (error) {
      console.error('Failed to start Zoom OAuth:', error);
    }
  };

  const handleDisconnectZoom = async () => {
    if (!window.confirm('Disconnect your Zoom account? You can reconnect anytime.')) return;
    await base44.auth.updateMe({ zoom_access_token: null, zoom_refresh_token: null, zoom_connected: false });
    refetchZoomUser();
  };

  const { data: googleProfile, isLoading: googleProfileLoading, refetch: refetchGoogleProfile } = useQuery({
    queryKey: ['googleProfile'],
    queryFn: async () => {
      try {
        const result = await base44.functions.invoke('getGoogleProfile');
        return result.data;
      } catch (e) {
        return { connected: false };
      }
    },
    enabled: isGoogleConnected,
  });

  const handleConnectGoogle = async () => {
    try {
      const response = await base44.functions.invoke('googleOAuthInit');
      const data = response.data;
      if (data.authUrl) {
        window.open(data.authUrl, 'google-oauth', 'width=500,height=600,scrollbars=yes');
        const handleMessage = (event) => {
          if (event.data?.type === 'google-oauth-success') {
            refetchGoogleStatus();
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'google-oauth-error') {
            console.error('OAuth error:', event.data.error);
            window.removeEventListener('message', handleMessage);
          }
        };
        window.addEventListener('message', handleMessage);
      }
    } catch (error) {
      console.error('Failed to start Google OAuth:', error);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Disconnect your Google account? You can reconnect anytime.')) return;
    await base44.functions.invoke('disconnectGoogle');
    refetchGoogleStatus();
    refetchGoogleProfile();
  };

  const activeData = sections.find(s => s.id === activeSection);
  const hasUnsavedChanges = (isEditing && Object.keys(editValues).length > 0) || pendingAvatarUrl !== null;

  React.useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    if (pendingAvatarUrl) {
      await base44.auth.updateMe({ profile_image: pendingAvatarUrl });
      setAvatarUrl(pendingAvatarUrl);
      setPendingAvatarUrl(null);
      onAvatarChange?.(pendingAvatarUrl);
    }
    setSettingsData(prevData => {
      const newData = { ...prevData };
      const currentSectionData = [...(newData[activeSection] || [])];
      Object.entries(editValues).forEach(([index, value]) => {
        if (currentSectionData[parseInt(index)]) {
          currentSectionData[parseInt(index)] = { ...currentSectionData[parseInt(index)], value };
        }
      });
      newData[activeSection] = currentSectionData;
      return newData;
    });
    setIsEditing(false);
    setEditValues({});
  };

  React.useEffect(() => {
    onSaveHandlerChange?.(() => handleSave);
  }, [editValues, isEditing, pendingAvatarUrl]);

  React.useEffect(() => {
    onSectionChange?.(activeSection ? activeData?.title || null : null);
  }, [activeSection]);

  // Sync with parent: when parent requests null (back button), close the slider
  React.useEffect(() => {
    if (requestedSection === null && activeSection !== null) {
      setActiveSection(null);
      setIsEditing(false);
      setEditValues({});
    }
  }, [requestedSection]);

  // Load saved avatar on mount
  React.useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      if (user?.profile_image) setAvatarUrl(user.profile_image);
    })();
  }, []);

  const handleAvatarSelected = async (file) => {
    setUploadingAvatar(true);
    setUploadProgress(0);
    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval); return 85; }
        return prev + Math.random() * 15;
      });
    }, 200);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    clearInterval(progressInterval);
    setUploadProgress(100);
    setTimeout(() => {
      setPendingAvatarUrl(file_url);
      setUploadingAvatar(false);
      setUploadProgress(0);
    }, 400);
  };

  return (
    <>
      <NeumorphicCard className="!p-0 overflow-hidden">
        <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="flex items-center gap-4 px-6 py-4 transition-all duration-200 cursor-pointer"
                onClick={() => setActiveSection(section.id)}
              >
                {section.isAvatar ? (
                  <NeumorphicAvatar
                    src={pendingAvatarUrl || avatarUrl}
                    initials="CD"
                    size="sm"
                  />
                ) : (
                  <div
                    className="neumorphic-avatar sm flex-shrink-0"
                    style={{ backgroundColor: section.color, color: '#fff' }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-base font-normal">{section.title}</span>
                  <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>{section.description}</p>
                </div>
                <ChevronRight
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: 'var(--nm-badge-default-color)' }}
                />
              </div>
            );
          })}
        </div>
      </NeumorphicCard>

      {/* Detail slider for each section */}
      <SettingsDetailSlider
        open={!!activeSection}
        onClose={() => { setActiveSection(null); setIsEditing(false); }}
        title={activeData?.title || ''}
        icon={activeData?.icon}
        iconColor={activeData?.color}
        onEdit={() => setIsEditing(!isEditing)}
        isEditing={isEditing}
        customIcon={activeSection === 'account' ? (
          <div className="flex flex-col items-center">
            <AvatarUpload
              src={pendingAvatarUrl || avatarUrl}
              initials="CD"
              size="lg"
              onImageSelected={handleAvatarSelected}
            />
            {uploadingAvatar && (
              <div className="w-16 mt-1.5">
                <NeumorphicProgress value={uploadProgress} animated />
              </div>
            )}
          </div>
        ) : activeSection === 'billing' ? (
          <div className="w-full mb-4">
            <CreditProgress />
          </div>
        ) : undefined}
      >
        {activeSection && (
          <>
            {activeSection === 'integrations' ? (
              <NeumorphicCard className="!p-0 overflow-hidden">
                <div className="flex items-center gap-4 px-6 py-4">
                  {/* Google "G" logo */}
                  <div className="flex-shrink-0">
                    <svg width="32" height="32" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal">Google Account</p>
                    <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>Calendar, Meet & Drive</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isGoogleConnected ? (
                      <>
                        <NeumorphicBadge variant="success" size="sm">Connected</NeumorphicBadge>
                        <NeumorphicButton variant="ghost" size="sm" onClick={handleDisconnectGoogle} style={{ color: 'var(--nm-badge-error-color)' }}>
                          Disconnect
                        </NeumorphicButton>
                      </>
                    ) : (
                      <NeumorphicButton variant="primary" size="sm" onClick={handleConnectGoogle}>
                        Connect
                      </NeumorphicButton>
                    )}
                  </div>
                </div>

                {/* Zoom row */}
                <div style={{ borderTop: '1px solid rgba(209, 217, 230, 0.4)' }} />
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-shrink-0">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="24" height="24" rx="6" fill="#2D8CFF" />
                      <path d="M13.5 8.25H6.75A1.5 1.5 0 0 0 5.25 9.75v4.5a1.5 1.5 0 0 0 1.5 1.5h6.75a1.5 1.5 0 0 0 1.5-1.5v-4.5a1.5 1.5 0 0 0-1.5-1.5zm4.72 1.22-2.47 1.65v2.26l2.47 1.65c.34.23.78-.01.78-.42V9.89c0-.41-.44-.65-.78-.42z" fill="white" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal">Zoom</p>
                    <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>Video meetings & recordings</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isZoomConnected ? (
                      <>
                        <NeumorphicBadge variant="success" size="sm">Connected</NeumorphicBadge>
                        <NeumorphicButton variant="ghost" size="sm" onClick={handleDisconnectZoom} style={{ color: 'var(--nm-badge-error-color)' }}>
                          Disconnect
                        </NeumorphicButton>
                      </>
                    ) : (
                      <NeumorphicButton variant="primary" size="sm" onClick={handleConnectZoom}>
                        Connect
                      </NeumorphicButton>
                    )}
                  </div>
                </div>

                {/* Google profile details */}
                {isGoogleConnected && (
                  <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                    <div style={{ borderTop: '1px solid rgba(209, 217, 230, 0.4)' }} />
                    {googleProfileLoading ? (
                      <div className="px-6 py-4 flex items-center gap-4">
                        {/* Skeleton */}
                        <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }} />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 rounded-full w-32" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }} />
                          <div className="h-3 rounded-full w-48" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }} />
                          <div className="h-3 rounded-full w-16" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }} />
                        </div>
                      </div>
                    ) : googleProfile?.profile ? (
                      <div className="px-6 py-4 flex items-center gap-4">
                        {googleProfile.profile.picture ? (
                          <img
                            src={googleProfile.profile.picture}
                            alt={googleProfile.profile.name || googleProfile.profile.email}
                            className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
                            style={{ boxShadow: 'var(--nm-shadow-main)' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <NeumorphicAvatar initials={(googleProfile.profile.email || 'G').charAt(0).toUpperCase()} size="md" />
                        )}
                        <div className="flex-1 min-w-0">
                          {googleProfile.profile.name && (
                            <p className="text-sm font-normal">{googleProfile.profile.name}</p>
                          )}
                          <p className="text-xs mt-0.5" style={{ color: 'var(--nm-badge-default-color)' }}>{googleProfile.profile.email}</p>
                          {googleProfile.profile.locale && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--nm-badge-default-color)' }}>
                              {googleProfile.profile.locale}
                            </p>
                          )}
                          {!googleProfile.profile.name && (
                            <p className="text-xs mt-1" style={{ color: 'var(--nm-badge-warning-color)' }}>
                              Reconnect Google to show full profile
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </NeumorphicCard>
            ) : (
              <NeumorphicCard className="!p-0 overflow-hidden">
                <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                  {(settingsData[activeSection] || []).map((item, i) => (

                    <div key={i} className="flex items-center justify-between px-6 py-4">
                      <span className="text-sm font-normal">{item.label}</span>
                      {isEditing && !item.variant ? (
                        <input
                          type="text"
                          defaultValue={editValues[i] !== undefined ? editValues[i] : item.value}
                          onChange={(e) => setEditValues({ ...editValues, [i]: e.target.value })}
                          className="rounded-lg px-3 text-sm h-9"
                          style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)', border: 'none', color: 'var(--nm-text-color)' }}
                        />
                      ) : item.variant ? (
                        <NeumorphicBadge variant={item.variant} size="sm">{item.value}</NeumorphicBadge>
                      ) : (
                        <span className="text-sm flex items-center min-h-9" style={{ color: 'var(--nm-badge-default-color)' }}>{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
                {activeSection === 'support' && (
                  <>
                    <div style={{ borderTop: '1px solid rgba(209, 217, 230, 0.4)' }} />
                    <div
                      className="flex items-center gap-3 px-6 py-4 cursor-pointer transition-all duration-200 hover:opacity-80"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to log out?')) {
                          base44.auth.logout();
                        }
                      }}
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-error-color)' }} />
                      <span className="text-sm font-normal" style={{ color: 'var(--nm-badge-error-color)' }}>Log Out</span>
                    </div>
                  </>
                )}
              </NeumorphicCard>
            )}
          </>
        )}
      </SettingsDetailSlider>
    </>
  );
}
