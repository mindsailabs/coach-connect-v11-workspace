import React, { useState } from 'react';
import { Home, Users, Calendar, Map, ClipboardList, CreditCard, BookOpen, Library, Settings, RefreshCw, X } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import ListToolbar from '@/components/app/ListToolbar';
import ContactsList from '@/components/app/ContactsList';
import ContactDetailPanel from '@/components/app/ContactDetailPanel';
import JourneysList from '@/components/app/JourneysList';
import BottomTabBar from '@/components/app/BottomTabBar';
import QuickActions from '@/components/app/QuickActions';
import NoteDetailPanel from '@/components/app/NoteDetailPanel';
import TaskDetailPanel from '@/components/app/TaskDetailPanel';
import TasksList from '@/components/app/TasksList';
import NotesList from '@/components/app/NotesList';
import SessionsList from '@/components/app/SessionsList';
import SettingsSections from '@/components/app/SettingsSections';
import UnsavedChangesWarningModal from '@/components/app/UnsavedChangesWarningModal';
import ApprovalsList from '@/components/app/ApprovalsList';

export default function AppPage() {
  const [activeItem, setActiveItem] = useState('home');
  const [addJourneyFromContact, setAddJourneyFromContact] = useState(false);
  const [addSessionFromContact, setAddSessionFromContact] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [pendingJourney, setPendingJourney] = useState(null);
  const [pendingSourceContact, setPendingSourceContact] = useState(null);
  const [navResetKey, setNavResetKey] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [selectedContactForDetail, setSelectedContactForDetail] = useState(null);
  const [selectedJourneyForDetail, setSelectedJourneyForDetail] = useState(null);
  const [selectedSessionForDetail, setSelectedSessionForDetail] = useState(null);
  const [contactHasUnsaved, setContactHasUnsaved] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [contactEditResetKey, setContactEditResetKey] = useState(0);
  const [contactSaveHandler, setContactSaveHandler] = useState(null);

  const performNavSelect = (id) => {
    setNavResetKey((k) => k + 1);
    setPendingSourceContact(null);
    setSelectedContactForDetail(null);
    setSelectedJourneyForDetail(null);
    setSelectedSessionForDetail(null);
    setActiveSessionSubPanel(null);
    setShowUnsavedWarning(false);
    setContactHasUnsaved(false);
    setContactEditResetKey((k) => k + 1);
    setShowNotePanel(false);
    setShowTaskPanel(false);
    setSettingsHasUnsaved(false);
    setShowSettingsUnsavedWarning(false);
    setAddSessionFromContact(false);
    setAddJourneyFromContact(false);
    setActiveItem(id);
  };

  const handleNavSelect = (id) => {
    if (contactHasUnsaved || settingsHasUnsaved) {
      setPendingNavTarget(id);
      setShowUnsavedModal(true);
    } else {
      performNavSelect(id);
    }
  };

  // handleUnsavedSave/Discard/Cancel are defined below with back action support

  const handleJourneyClick = (journey, sourceContact) => {
    setPendingJourney(journey);
    setPendingSourceContact(sourceContact);
    setActiveItem('journeys');
    setSelectedContactForDetail(null);
  };

  const handleBackToContact = (contact) => {
    setSelectedContactForDetail(contact);
    setTimeout(() => {
      setPendingSourceContact(null);
      setPendingJourney(null);
      setSelectedJourneyForDetail(null);
      setSelectedSessionForDetail(null);
      setActiveItem('contacts');
      setReturnToContact(contact);
    }, 300);
  };

  const handleSessionsClick = (data) => {
    setSessionsContactFilter(data || null);
    setActiveItem('sessions');
    setSelectedContactForDetail(null);
  };

  const [returnToContact, setReturnToContact] = useState(null);
  const [contactCount, setContactCount] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactTypeFilter, setContactTypeFilter] = useState('All');
  const [showContactFilter, setShowContactFilter] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionStatusFilter, setSessionStatusFilter] = useState('All');
  const [showSessionFilter, setShowSessionFilter] = useState(false);
  const [sessionSearchValue, setSessionSearchValue] = useState('');
  const [showContactFilterPanel, setShowContactFilterPanel] = useState(false);

  const [showNotePanel, setShowNotePanel] = useState(false);
  const [noteBackLabel, setNoteBackLabel] = useState('Back');
  const [noteTitle, setNoteTitle] = useState('Add Note');
  const [noteInitialAssignment, setNoteInitialAssignment] = useState(null);

  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [taskBackLabel, setTaskBackLabel] = useState('Back');
  const [taskInitialAssignment, setTaskInitialAssignment] = useState(null);
  const [settingsSection, setSettingsSection] = useState(null);
  const [settingsRequested, setSettingsRequested] = useState(undefined);
  const [settingsHasUnsaved, setSettingsHasUnsaved] = useState(false);
  const [settingsSaveHandler, setSettingsSaveHandler] = useState(null);
  const [showSettingsUnsavedWarning, setShowSettingsUnsavedWarning] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState(null);
  const [pendingNavTarget, setPendingNavTarget] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [sessionsContactFilter, setSessionsContactFilter] = useState(null);
  const [activeSessionSubPanel, setActiveSessionSubPanel] = useState(null);

  const handleAddFormSaveRequest = React.useCallback((getHandler) => setContactSaveHandler(() => getHandler), []);
  const handleSettingsSaveRequest = React.useCallback((getHandler) => setSettingsSaveHandler(() => getHandler), []);

  // Load user avatar on mount — prefer Google profile picture, fallback to profile_image
  React.useEffect(() => {
    (async () => {
      const { base44 } = await import('@/api/base44Client');
      try {
        const res = await base44.functions.invoke('getGoogleProfile');
        if (res.data?.connected && res.data?.profile?.picture) {
          setUserAvatarUrl(res.data.profile.picture);
          return;
        }
      } catch (e) {

        // silently fall through
      }try {
        const user = await base44.auth.me();
        if (user?.profile_image) setUserAvatarUrl(user.profile_image);
      } catch (e) {}
    })();
  }, []);

  const navigationItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'journeys', label: 'Journeys', icon: Map },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'approvals', label: 'Approvals', icon: ClipboardList },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notebook', label: 'Notebook', icon: BookOpen },
  { id: 'knowledgebase', label: 'Knowledge', icon: Library },
  { id: 'settings', label: 'Settings', icon: Settings }];


  // Pending back action to resume after modal
  const [pendingBackAction, setPendingBackAction] = useState(null);

  const handleBackWithUnsavedCheck = (action) => {
    if (contactHasUnsaved || settingsHasUnsaved) {
      setPendingBackAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };

  // Close the unsaved modal FIRST, then save — prevents contact-type modal from appearing behind it
  const handleUnsavedSaveForBack = async () => {
    setShowUnsavedModal(false);
    // Small delay to allow the modal exit animation to begin before next modal appears
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (contactHasUnsaved && contactSaveHandler) {
      await contactSaveHandler();
    }
    if (settingsHasUnsaved && settingsSaveHandler) {
      await settingsSaveHandler();
    }
    if (pendingNavTarget) {
      performNavSelect(pendingNavTarget);
      setPendingNavTarget(null);
    } else if (pendingBackAction) {
      pendingBackAction();
      setPendingBackAction(null);
    }
  };

  const handleUnsavedDiscardForBack = () => {
    setShowUnsavedModal(false);
    setContactHasUnsaved(false);
    setContactEditResetKey((k) => k + 1);
    setSettingsHasUnsaved(false);
    setShowSettingsUnsavedWarning(false);
    if (pendingNavTarget) {
      performNavSelect(pendingNavTarget);
      setPendingNavTarget(null);
    } else if (pendingBackAction) {
      pendingBackAction();
      setPendingBackAction(null);
    }
  };

  const handleUnsavedCancelForBack = () => {
    setShowUnsavedModal(false);
    setPendingNavTarget(null);
    setPendingBackAction(null);
  };

  // Compute back button for the QuickActions bar
  const backButtonProp = React.useMemo(() => {
    if (notificationsOpen) {
      return { label: 'Back', onClick: () => setNotificationsOpen(false) };
    }
    if (settingsSection) {
      return {
        label: 'Back to Settings',
        onClick: () => {
          handleBackWithUnsavedCheck(() => {
            setSettingsSection(null);
            setSettingsRequested(null);
          });
        }
      };
    }
    if (showNotePanel) {
      return { label: noteBackLabel, onClick: () => setShowNotePanel(false) };
    }
    if (showTaskPanel) {
      return { label: taskBackLabel, onClick: () => setShowTaskPanel(false) };
    }
    if (showContactForm) {
      return { 
        label: 'Back to Contacts', 
        onClick: () => {
          handleBackWithUnsavedCheck(() => setShowContactForm(false));
        } 
      };
    }
    if (selectedContactForDetail) {
      if (addSessionFromContact) {
        return {
          label: `Back to ${selectedContactForDetail.full_name || selectedContactForDetail.name}`,
          onClick: () => {
            setAddSessionFromContact(false);
            setActiveItem('contacts');
          }
        };
      }
      if (addJourneyFromContact) {
        return {
          label: `Back to ${selectedContactForDetail.full_name || selectedContactForDetail.name}`,
          onClick: () => {
            setAddJourneyFromContact(false);
            setActiveItem('contacts');
          }
        };
      }
      return {
        label: 'Back to Contacts',
        onClick: () => {
          handleBackWithUnsavedCheck(() => {
            setSelectedContactForDetail(null);
          });
        }
      };
    }
    if (selectedSessionForDetail) {
      if (activeSessionSubPanel === 'transcript' || activeSessionSubPanel === 'recording') {
        return {
          label: 'Back to Session',
          onClick: () => {
            setActiveSessionSubPanel(null);
          }
        };
      }
      if (activeSessionSubPanel === 'edit') {
        return {
          label: 'Back to Session',
          onClick: () => {
            handleBackWithUnsavedCheck(() => {
              setActiveSessionSubPanel(null);
            });
          }
        };
      }
      if (activeItem === 'sessions' && sessionsContactFilter) {
        return {
          label: `Back to ${sessionsContactFilter.name || sessionsContactFilter.full_name} Sessions`,
          onClick: () => {
            handleBackWithUnsavedCheck(() => {
              setSelectedSessionForDetail(null);
            });
          }
        };
      }
      return {
        label: 'Back to Sessions',
        onClick: () => {
          handleBackWithUnsavedCheck(() => {
            setSelectedSessionForDetail(null);
          });
        }
      };
    }
    if (activeItem === 'sessions' && sessionsContactFilter) {
      return {
        label: `Back to ${sessionsContactFilter.name || sessionsContactFilter.full_name}`,
        onClick: () => {
          handleBackWithUnsavedCheck(() => {
            const contactToRestore = sessionsContactFilter;
            setSelectedContactForDetail(contactToRestore);
            setTimeout(() => {
              setSessionsContactFilter(null);
              setActiveItem('contacts');
              setReturnToContact(contactToRestore);
            }, 300);
          });
        }
      };
    }
    if (activeItem === 'journeys' && pendingSourceContact) {
      return {
        label: `Back to ${pendingSourceContact.name || pendingSourceContact.full_name}`,
        onClick: () => {
          handleBackWithUnsavedCheck(() => {
            handleBackToContact(pendingSourceContact);
          });
        }
      };
    }
    if (selectedJourneyForDetail) {
      return { label: 'Back to Journeys', onClick: () => setSelectedJourneyForDetail(null) };
    }
    return null;
  }, [notificationsOpen, settingsSection, settingsHasUnsaved, showNotePanel, noteBackLabel, showTaskPanel, taskBackLabel, showContactForm, selectedContactForDetail, selectedJourneyForDetail, selectedSessionForDetail, pendingSourceContact, contactHasUnsaved, activeItem, sessionsContactFilter, addJourneyFromContact, addSessionFromContact, activeSessionSubPanel]);

  return (
    <div className="flex flex-col md:flex-row h-full bg-[--nm-background]">
      {/* Left Navigation - hidden on mobile */}
      <nav className="neumorphic-nav-container w-64 h-full flex-shrink-0 z-[60] relative ml-[50px] hidden md:block">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const isHovered = hoveredItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavSelect(item.id)}
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
                }}>

                <Icon className="neumorphic-nav-icon" />
                <span className="neumorphic-nav-label">{item.label}</span>
              </button>);

          })}
        </div>
      </nav>

      {/* Main Body Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative pb-24 md:pb-8">
        <div>
          {activeItem === 'contacts' &&
          <ListToolbar
            title="Contacts"
            subtitle={contactCount !== null ? `(${contactCount})` : null}
            onAdd={() => setShowContactForm(true)}
            searchPlaceholder="Search contacts.."
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filterStates={['All Types', 'Client', 'Practitioner', 'Prospect', 'Other']}
            filterColors={['default', 'primary', 'info', 'warning', 'default']}
            onFilterChange={setContactTypeFilter}
            currentFilter={contactTypeFilter}
            showFilter={showContactFilter}
            onFilterToggle={() => {
              const newShowFilter = !showContactFilter;
              setShowContactFilter(newShowFilter);
            }} />

          }
          {activeItem === 'sessions' &&
          <ListToolbar
            title="Sessions"
            onAdd={() => setShowSessionForm(true)}
            searchPlaceholder="Search sessions..."
            searchValue={sessionSearchValue}
            onSearchChange={setSessionSearchValue}
            filterStates={['All', 'Scheduled', 'Completed', 'Cancelled']}
            filterColors={['default', 'info', 'success', 'error']}
            onFilterChange={setSessionStatusFilter}
            currentFilter={sessionStatusFilter}
            showFilter={showSessionFilter}
            onFilterToggle={() => {
              setShowSessionFilter(!showSessionFilter);
            }}
            extraFilters={sessionsContactFilter ?
            <div className="flex items-center gap-2">
                  <button
                onClick={() => setShowContactFilterPanel(true)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>

                    <NeumorphicBadge variant="primary" size="sm">
                      {sessionsContactFilter.name || sessionsContactFilter.full_name}
                      <RefreshCw className="w-3 h-3 ml-1.5 inline-block" style={{ color: 'var(--nm-badge-primary-color)' }} />
                    </NeumorphicBadge>
                  </button>
                  <button
                onClick={() => setSessionsContactFilter(null)}
                className="hover:opacity-70 transition-opacity flex items-center justify-center rounded-full w-6 h-6 flex-shrink-0"
                style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-main)', color: 'var(--nm-text-color)', border: 'none', cursor: 'pointer', padding: 0 }}>

                    <X className="w-3.5 h-3.5" />
                  </button>
                </div> :
            null} />

          }
          {activeItem !== 'contacts' && activeItem !== 'sessions' && (
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-2xl font-normal">
                {navigationItems.find((item) => item.id === activeItem)?.label}
              </h2>
            </div>
          )}
          {activeItem === 'contacts' ?
          <ContactsList 
            key={navResetKey} 
            returnToContact={returnToContact} 
            onReturnToContactClear={() => setReturnToContact(null)} 
            selectedContact={selectedContactForDetail} 
            onContactSelect={setSelectedContactForDetail} 
            showAddForm={showContactForm} 
            onAddFormClose={() => setShowContactForm(false)} 
            onAddFormUnsavedChange={setContactHasUnsaved}
            onAddFormSaveRequest={handleAddFormSaveRequest}
            contactTypeFilter={contactTypeFilter} 
            searchValue={searchValue} 
            onCountChange={setContactCount} 
          /> :
          activeItem === 'journeys' ?
          <JourneysList key={navResetKey} pendingJourney={pendingJourney} pendingSourceContact={pendingSourceContact} onPendingJourneyClear={() => {setPendingJourney(null);}} onBackToContact={handleBackToContact} selectedJourney={selectedJourneyForDetail} onJourneySelect={setSelectedJourneyForDetail} onSourceContactClear={() => setPendingSourceContact(null)} onAssignJourneyOpen={() => setActiveItem('journeys')} /> :
          activeItem === 'sessions' ?
          <SessionsList
            key={navResetKey}
            initialContactFilter={sessionsContactFilter}
            onContactFilterClear={() => setSessionsContactFilter(null)}
            selectedSession={selectedSessionForDetail}
            onSessionSelect={setSelectedSessionForDetail}
            activeSessionSubPanel={activeSessionSubPanel}
            onSessionSubPanelChange={setActiveSessionSubPanel}
            showAddForm={showSessionForm}
            onAddFormClose={() => setShowSessionForm(false)}
            sessionStatusFilter={sessionStatusFilter}
            searchValue={sessionSearchValue}
            showContactFilterPanel={showContactFilterPanel}
            onContactFilterPanelClose={() => setShowContactFilterPanel(false)}
            onContactFilterSelect={(contact) => setSessionsContactFilter(contact)} /> :

          activeItem === 'tasks' ?
          <TasksList key={navResetKey} /> :
          activeItem === 'approvals' ?
          <ApprovalsList key={navResetKey} /> :
          activeItem === 'notebook' ?
          <NotesList key={navResetKey} /> :
          activeItem === 'settings' ?
          <SettingsSections key={navResetKey} onSectionChange={(section) => {setSettingsSection(section);setSettingsRequested(undefined);setShowSettingsUnsavedWarning(false);}} requestedSection={settingsRequested} onUnsavedChange={setSettingsHasUnsaved} onSaveHandlerChange={handleSettingsSaveRequest} onAvatarChange={setUserAvatarUrl} /> :

          <p className="text-gray-600">
              This is the main content area for {activeItem}.
            </p>
          }
        </div>
      </main>

      {/* Quick Actions - top right */}
      <QuickActions
        externalNotificationsOpen={notificationsOpen}
        onNotificationsOpenChange={setNotificationsOpen}
        backButton={backButtonProp}
        onSettingsClick={() => handleNavSelect('settings')}
        onApprovalsClick={() => handleNavSelect('approvals')}
        avatarUrl={userAvatarUrl}
        onSave={
        contactHasUnsaved && contactSaveHandler ? async () => {await contactSaveHandler();} :
        settingsHasUnsaved && settingsSaveHandler ? async () => {await settingsSaveHandler();} :
        null
        }
        onSelectAction={(id) => {
          if (id === 'add_note') {
            let label = 'Back';
            let title = 'Add Note to General';
            let assignment = null;

            if (selectedJourneyForDetail) {
              label = `Back to ${selectedJourneyForDetail.title}`;
              title = `Add Note to ${selectedJourneyForDetail.title}`;
              assignment = {
                type: 'journey',
                id: selectedJourneyForDetail.id,
                contactId: selectedJourneyForDetail.contactId,
                name: selectedJourneyForDetail.title
              };
            } else if (selectedContactForDetail) {
              label = `Back to ${selectedContactForDetail.name}`;
              title = `Add Note to ${selectedContactForDetail.name}`;
              assignment = {
                type: 'contact',
                id: selectedContactForDetail.id,
                name: selectedContactForDetail.name
              };
            } else {
              const navItem = navigationItems.find((item) => item.id === activeItem);
              if (navItem) {
                label = `Back to ${navItem.label}`;
              }
            }
            setNoteBackLabel(label);
            setNoteTitle(title);
            setNoteInitialAssignment(assignment);
            setShowNotePanel(true);
          } else if (id === 'create_task') {
            let label = 'Back';
            let assignment = null;

            if (selectedJourneyForDetail) {
              label = `Back to ${selectedJourneyForDetail.title}`;
              assignment = {
                type: 'journey',
                id: selectedJourneyForDetail.id,
                contactId: selectedJourneyForDetail.contactId,
                name: selectedJourneyForDetail.title
              };
            } else if (selectedContactForDetail) {
              label = `Back to ${selectedContactForDetail.name}`;
              assignment = {
                type: 'contact',
                id: selectedContactForDetail.id,
                name: selectedContactForDetail.name
              };
            } else {
              const navItem = navigationItems.find((item) => item.id === activeItem);
              if (navItem) {
                label = `Back to ${navItem.label}`;
              }
            }
            setTaskBackLabel(label);
            setTaskInitialAssignment(assignment);
            setShowTaskPanel(true);
          } else if (id === 'ai_insights') {
            console.log('AI Insights clicked');
          }
        }} />

      {/* Note Detail Panel */}
      <NoteDetailPanel
        open={showNotePanel}
        onClose={() => setShowNotePanel(false)}
        onBack={(currentAssignment) => {
          setShowNotePanel(false);
          if (currentAssignment?.type === 'contact' && currentAssignment?.name) {
            setReturnToContact({ name: currentAssignment.name });
            setActiveItem('contacts');
          } else if (currentAssignment?.contactName) {
            setReturnToContact({ name: currentAssignment.contactName });
            setActiveItem('contacts');
          }
        }}
        backLabel={noteBackLabel}
        noteTitle={noteTitle}
        initialAssignment={noteInitialAssignment} />


      {/* Task Detail Panel */}
      <TaskDetailPanel
        open={showTaskPanel}
        onClose={() => setShowTaskPanel(false)}
        onBack={(currentAssignment) => {
          setShowTaskPanel(false);
          if (currentAssignment?.type === 'contact' && currentAssignment?.name) {
            setReturnToContact({ name: currentAssignment.name });
            setActiveItem('contacts');
          } else if (currentAssignment?.contactName) {
            setReturnToContact({ name: currentAssignment.contactName });
            setActiveItem('contacts');
          }
        }}
        backLabel={taskBackLabel}
        initialAssignment={taskInitialAssignment} />


      {/* Bottom Tab Bar - mobile only */}
      <BottomTabBar
        navigationItems={navigationItems}
        activeItem={activeItem}
        onSelectItem={(id) => {
          setNotificationsOpen(false);
          handleNavSelect(id);
        }} />


      <ContactDetailPanel
        contact={selectedContactForDetail}
        onClose={() => { setSelectedContactForDetail(null); setAddJourneyFromContact(false); setAddSessionFromContact(false); }}
        onJourneyClick={handleJourneyClick}
        onSessionsClick={(contact) => handleSessionsClick(contact)}
        onUnsavedChange={setContactHasUnsaved}
        editResetKey={contactEditResetKey}
        onSaveRequest={handleAddFormSaveRequest}
        addJourneyOpen={addJourneyFromContact}
        onAddJourneyOpenChange={(val) => {
          setAddJourneyFromContact(val);
          if (val) setActiveItem('journeys');
          else setActiveItem('contacts');
        }}
        addSessionOpen={addSessionFromContact}
        onAddSessionOpenChange={(val) => {
          setAddSessionFromContact(val);
          if (val) setActiveItem('sessions');
          else setActiveItem('contacts');
        }} />


      {/* Unsaved Changes Warning Modal */}
      <UnsavedChangesWarningModal
        isOpen={showUnsavedModal}
        onSave={handleUnsavedSaveForBack}
        onDiscard={handleUnsavedDiscardForBack}
        onCancel={handleUnsavedCancelForBack} />

    </div>);

}