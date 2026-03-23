import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Activity, User, BarChart3, Map, Calendar, Edit2, Save, Briefcase, SlidersVertical, Magnet, CheckCircle2, ChevronRight, MessageSquare, CalendarPlus, Trash2 } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import NeumorphicTabs from '@/components/ui/NeumorphicTabs';
import EditableBadge from '@/components/ui/EditableBadge';
import RotatableBadge from '@/components/ui/RotatableBadge';
import ContactDetailSections from '@/components/app/ContactDetailSections';
import ContactFormPanel from '@/components/app/ContactFormPanel';
import ContactFieldRow from '@/components/app/ContactFieldRow';
import JourneyCard from '@/components/app/JourneyCard';
import ContactActivityTimeline from '@/components/app/ContactActivityTimeline';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import NeumorphicAvatar from '@/components/ui/NeumorphicAvatar';
import ViewHeader from '@/components/ui/ViewHeader';
import { formatDate, parseTags, getContactTypeVariant, getInitials } from '@/components/utils/entityHelpers';
import { Contact, ContactJourney } from '@/components/api/entities';
import AddJourneyPanel from '@/components/app/AddJourneyPanel';
import SessionFormPanel from '@/components/app/SessionFormPanel';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronDown } from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CONTACT_TYPE_COLORS = {
  'Client': 'primary',
  'Practitioner': 'info',
  'Prospect': 'warning',
  'Other': 'default'
};

const CONTACT_TYPE_BADGE_VARIANTS = {
  'Client': 'primary',
  'Practitioner': 'info',
  'Prospect': 'warning',
  'Other': 'default'
};

export default function ContactDetailPanel({ contact, onClose, onJourneyClick, onSessionsClick, onUnsavedChange, editResetKey, onSaveRequest, onAnimationComplete, addJourneyOpen, onAddJourneyOpenChange, addSessionOpen, onAddSessionOpenChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [localOverrides, setLocalOverrides] = useState({});
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showContactTypeWarning, setShowContactTypeWarning] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [savePromiseResolve, setSavePromiseResolve] = useState(null);
  const [activityOpen, setActivityOpen] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: activeJourneys = [] } = useQuery({
    queryKey: ['contactJourneys', contact?.id],
    queryFn: async () => {
      if (!contact?.id) return [];
      const results = await ContactJourney.filter({ contact_id: contact.id, status: 'Active' });
      return results;
    },
    enabled: !!contact?.id
  });

  const hasUnsavedChanges = isEditing && Object.keys(editValues).length > 0;

  React.useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChange]);

  React.useEffect(() => {
    onSaveRequest?.(handleSave);
  }, [editValues, isEditing, savePromiseResolve]);

  const rawContact = contact?._raw || contact || {};
  const actualContactType = rawContact.contact_type || contact?.contact_type || contact?.role;

  const baseContact = {
    ...contact,
    full_name: rawContact.full_name || contact?.name,
    email: rawContact.email || contact?.email,
    phone: rawContact.phone || contact?.phone,
    contact_type: rawContact.contact_type || contact?.role,
    status: rawContact.status || 'active',
    gender: rawContact.gender || '',
    pronouns: rawContact.pronouns || '',
    address: rawContact.address || '',
    registered_date: rawContact.registered_date || '',
    health_goals: rawContact.health_goals || '',
    notes: rawContact.notes || '',
    date_of_birth: rawContact.date_of_birth,
    emergency_contact: rawContact.emergency_contact || '',
    specialty: rawContact.specialty || '',
    credentials: rawContact.credentials || '',
    specialization: rawContact.specialization || '',
    years_of_experience: rawContact.years_of_experience || '',
    website: rawContact.website || '',
    profile_image: rawContact.profile_image || '',
    preferred_contact_method: rawContact.preferred_contact_method || '',
    social_media_platforms: rawContact.social_media_platforms || '',
    preferred_support_type: rawContact.preferred_support_type || '',
    focus_areas: rawContact.focus_areas || '',
    tags: rawContact.tags || '',
    contact_source: rawContact.contact_source || '',
    referred_by: rawContact.referred_by || '',
    source_social_media_platform: rawContact.source_social_media_platform || '',
    source_organic_search_engine: rawContact.source_organic_search_engine || '',
    last_contacted_at: rawContact.last_contacted_at || '',
    last_contacted_method: rawContact.last_contacted_method || '',
    last_engaged_at: rawContact.last_engaged_at || '',
    last_engaged_method: rawContact.last_engaged_method || '',
    ai_references: rawContact.ai_references || '',
    ai_recommendations: rawContact.ai_recommendations || '',
    ai_generated_at: rawContact.ai_generated_at,
    ai_session_id: rawContact.ai_session_id || ''
  };

  // localOverrides holds saved values that haven't yet arrived via the prop
  const displayContact = { ...baseContact, ...localOverrides };
  const displayContactType = displayContact.contact_type || actualContactType;

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSave = async () => {
    // Check if contact_type was changed
    const contactTypeChanged = editValues.contact_type !== undefined && editValues.contact_type !== actualContactType;

    if (contactTypeChanged) {
      // Return a promise that will resolve when user confirms/cancels the contact type modal
      return new Promise((resolve) => {
        setSavePromiseResolve(() => resolve);
        // Show contact type warning directly - parent modal has already been closed before calling handleSave
        setShowContactTypeWarning(true);
      });
    }

    await performSave();
  };

  const performSave = async () => {
    const fieldsToUpdate = Object.keys(editValues).reduce((acc, key) => {
      if (editValues[key] !== undefined) {
        acc[key] = editValues[key];
      }
      return acc;
    }, {});

    if (Object.keys(fieldsToUpdate).length > 0) {
      await Contact.update(rawContact.id, fieldsToUpdate);
      setLocalOverrides((prev) => ({ ...prev, ...fieldsToUpdate }));
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
    setIsEditing(false);
    setEditValues({});
    setShowUnsavedWarning(false);
    setShowContactTypeWarning(false);

    // Resolve the promise if one exists
    if (savePromiseResolve) {
      savePromiseResolve();
      setSavePromiseResolve(null);
    }
  };

  const currentTagSource = editValues.tags !== undefined ? editValues.tags : displayContact.tags;
  const currentTags = parseTags(currentTagSource);

  const handleAddTag = (newTag) => {
    const updated = [...currentTags, newTag].join(', ');
    setEditValues((prev) => ({ ...prev, tags: updated }));
  };

  const handleRemoveTag = (index) => {
    const updated = currentTags.filter((_, i) => i !== index).join(', ');
    setEditValues((prev) => ({ ...prev, tags: updated }));
  };

  const contactTypes = ['Client', 'Practitioner', 'Prospect', 'Other'];
  const contactTypeColors = ['primary', 'info', 'warning', 'default'];

  let effectiveContactType = editValues.contact_type !== undefined ? editValues.contact_type : actualContactType;
  if (!contactTypes.includes(effectiveContactType)) {
    effectiveContactType = 'Other';
  }
  const currentContactType = effectiveContactType;

  const handleContactTypeRotate = (newType) => {
    setEditValues((prev) => ({ ...prev, contact_type: newType }));
  };

  React.useEffect(() => {
    // Reset overrides when a different contact is opened
    setLocalOverrides({});
  }, [rawContact.id]);

  React.useEffect(() => {
    // Exit edit mode when navigating away
    setIsEditing(false);
    setEditValues({});
  }, [editResetKey]);

  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {!!contact &&
      <>
          <AddJourneyPanel
            open={!!addJourneyOpen}
            onClose={() => onAddJourneyOpenChange?.(false)}
            onSuccess={() => onAddJourneyOpenChange?.(false)}
            contact={rawContact}
          />
          <SessionFormPanel
            open={!!addSessionOpen}
            onClose={() => onAddSessionOpenChange?.(false)}
            onSuccess={() => onAddSessionOpenChange?.(false)}
            initialContact={rawContact}
            backLabel={`Back to ${rawContact.full_name || rawContact.name || 'Contact'}`}
          />
          <motion.div
          className="absolute inset-0"
          style={{ zIndex: 40 }}
          onClick={() => {
            if (hasUnsavedChanges) {
              setShowUnsavedWarning(true);
            } else {
              onClose();
            }
          }} />


          <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed md:absolute left-0 right-0 bottom-0 flex flex-col"
          style={{
            zIndex: 90,
            top: '65px',
            borderRadius: '0',
            background: 'var(--nm-background)',
            boxShadow: 'var(--nm-shadow-main)'
          }}>

            {/* Content - single scrollable area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <div className="flex items-center justify-between mb-6 mx-3 pt-2 min-h-[44px]">
                <div className="flex-1 flex items-center min-w-0 mr-4">
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="flex items-center gap-4 min-w-0"
                      >
                        <h2 className="text-2xl font-normal truncate" style={{ color: 'var(--nm-text-color)' }}>
                          Edit Contact
                        </h2>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex items-center gap-4 justify-end flex-shrink-0">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => console.log('Message clicked')}
                        className="p-2 rounded-full transition-all duration-200 hover:scale-105 flex-shrink-0 relative"
                        style={{
                          background: 'var(--nm-background)',
                          boxShadow: 'var(--nm-shadow-main)',
                          border: 'none',
                          cursor: 'pointer',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MessageSquare className="w-4 h-4" style={{ color: 'var(--nm-badge-default-color)' }} />
                      </button>
                      <button
                        onClick={() => onSessionsClick?.(displayContact)}
                        className="p-2 rounded-full transition-all duration-200 hover:scale-105 flex-shrink-0 relative"
                        style={{
                          background: 'var(--nm-background)',
                          boxShadow: 'var(--nm-shadow-main)',
                          border: 'none',
                          cursor: 'pointer',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CalendarPlus className="w-4 h-4" style={{ color: 'var(--nm-badge-default-color)' }} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      if (isEditing && hasUnsavedChanges) {
                        setShowUnsavedWarning(true);
                      } else if (isEditing) {
                        setIsEditing(false);
                        setEditValues({});
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 relative ${isEditing ? '' : 'hover:scale-105'}`}
                    style={{
                      background: 'var(--nm-background)',
                      boxShadow: isEditing ? 'var(--nm-shadow-inset)' : 'var(--nm-shadow-main)',
                      border: 'none',
                      cursor: 'pointer',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Edit2 className="w-4 h-4" style={{ color: isEditing ? 'var(--nm-badge-primary-color)' : 'var(--nm-badge-default-color)' }} />
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                 <NeumorphicCard className="pt-4 pr-6 pb-4 pl-6 neumorphic-card transition-all duration-300 hover:shadow-[var(--nm-shadow-hover)] hover:-translate-y-0.5">
                 <div className="flex items-center gap-4">
                      <div className="relative">
                        <NeumorphicAvatar
                          initials={getInitials(displayContact.full_name || contact.name)}
                          src={displayContact.profile_image}
                          size="md" />
                        {activeJourneys.length > 0 && (
                          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[--nm-background]" />
                        )}
                      </div>

                      <div className="flex-1">
                        {/* Name row */}
                        <div className={`mb-1 ${isEditing ? 'mb-4' : ''}`}>
                          {isEditing ?
                      <input
                        type="text"
                        value={editValues.full_name !== undefined ? editValues.full_name : displayContact.full_name || contact.name}
                        onChange={(e) => setEditValues({ ...editValues, full_name: e.target.value })}
                        className="rounded-lg px-3 text-sm h-9"
                        style={{
                          background: 'var(--nm-background)',
                          boxShadow: 'var(--nm-shadow-inset)',
                          border: 'none',
                          color: 'var(--nm-text-color)',
                          width: '200px'
                        }}
                        placeholder="Contact name" /> :
                      <h2 className="text-xl font-normal" style={{ color: 'var(--nm-text-color)' }}>
                              {displayContact.full_name || contact.name}
                            </h2>
                      }
                        </div>

                        {/* Badge + tags row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isEditing ?
                      <RotatableBadge
                        states={contactTypes}
                        colors={contactTypeColors}
                        onRotate={handleContactTypeRotate}
                        initialState={currentContactType}
                        alwaysShowIcon={true} /> :
                      <span
                        className="flex-shrink-0"
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          backgroundColor: `var(--nm-badge-${CONTACT_TYPE_BADGE_VARIANTS[displayContactType] || 'default'}-color)`,
                          color: '#fff',
                          fontWeight: '500',
                        }}
                      >
                        {displayContactType}
                      </span>
                      }
                          {displayContact.status === 'inactive' &&
                      <span
                        className="flex-shrink-0"
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          backgroundColor: 'var(--nm-badge-default-color)',
                          color: '#fff',
                          fontWeight: '500',
                        }}
                      >
                        Inactive
                      </span>
                      }
                          {(isEditing || currentTags.length > 0) &&
                      <EditableBadge
                        badges={currentTags.slice(0, 2)}
                        onAdd={isEditing && currentTags.length < 2 ? handleAddTag : undefined}
                        onRemove={isEditing ? handleRemoveTag : undefined}
                        variant="category"
                        size="sm"
                        placeholder="add tag..." />
                      }
                        </div>
                      </div>
                 </div>

                 {/* Divider */}
                 {!isEditing && (displayContact.email || displayContact.phone) && (
                   <>
                     <div className="border-t w-full mt-4 mb-3" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }} />
                     <div className="text-sm flex flex-col gap-2" style={{ color: 'var(--nm-badge-default-color)' }}>
                            {displayContact.email &&
                      <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" />
                                <span>{displayContact.email}</span>
                                {displayContact.preferred_contact_method?.includes('Email') &&
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--nm-badge-primary-color)', flexShrink: 0 }} />
                        }
                              </div>
                      }
                            {displayContact.phone &&
                      <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{displayContact.phone}</span>
                                {displayContact.preferred_contact_method?.includes('Phone Call') &&
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--nm-badge-primary-color)', flexShrink: 0 }} />
                        }
                              </div>
                      }
                     </div>
                   </>
                 )}
                 </NeumorphicCard>

                  {/* Desktop: Latest Activity above tabs - hidden when editing */}
                  {!isEditing &&
              <div className="hidden md:block mt-6">
                      <div
                  className="rounded-lg overflow-hidden transition-all duration-300"
                  style={{
                    background: 'var(--nm-background)',
                    boxShadow: activityOpen ? 'var(--nm-shadow-main)' : 'var(--nm-shadow-inset)'
                  }}>

                        <button
                    onClick={() => setActivityOpen(!activityOpen)}
                    className="w-full flex items-center justify-between p-4 transition-all duration-200"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}>

                          <h4 className="text-base font-normal" style={{ color: 'var(--nm-text-color)' }}>
                            Latest Activity
                          </h4>
                          <ChevronDown
                      className="w-4 h-4 transition-transform duration-200"
                      style={{
                        color: 'var(--nm-badge-default-color)',
                        transform: activityOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                      }} />

                        </button>
                        {activityOpen &&
                  <div
                    className="px-4 pb-4 overflow-y-auto"
                    style={{
                      maxHeight: '50px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'var(--nm-badge-default-color) transparent'
                    }}>

                            <ContactActivityTimeline
                      activities={[
                      { id: 1, type: 'session', title: 'Session completed', description: 'Initial consultation session', date: '2026-02-20T14:30:00', created_date: '2026-02-20T14:30:00' },
                      { id: 2, type: 'note', title: 'Note added', description: 'Follow-up notes from session', date: '2026-02-20T15:00:00', created_date: '2026-02-20T15:00:00' },
                      { id: 3, type: 'email', title: 'Email sent', description: 'Welcome email with resources', date: '2026-02-19T10:00:00', created_date: '2026-02-19T10:00:00' },
                      { id: 4, type: 'contact', title: 'Contact created', description: 'New client onboarded', date: '2026-02-18T09:00:00', created_date: '2026-02-18T09:00:00' }]
                      } />

                          </div>
                  }
                      </div>
                    </div>
              }

                  {/* Desktop: tabs inside card */}
                  {!isEditing &&
              <div className="hidden md:block">
                      <div className="pt-[10px]" />
                      {(() => {
                  const dc = displayContact;
                  const isPractitioner = actualContactType === 'Practitioner';
                  const desktopTabs = [
                  {
                    label: 'Personal Information',
                    icon: User,
                    content:
                    <div className="space-y-4">
                                <ContactFieldRow label="Email" field="email" value={dc.email} type="email" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Phone" field="phone" value={dc.phone} type="tel" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Date of Birth" field="date_of_birth" value={dc.date_of_birth} type="date" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Gender" field="gender" value={dc.gender} type="select" options={['Male', 'Female', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Pronouns" field="pronouns" value={dc.pronouns} type="text" placeholder="e.g., he/him, she/her, they/them" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Address" field="address" value={dc.address} type="textarea" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Emergency Contact" field="emergency_contact" value={dc.emergency_contact} type="text" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Registered Date" field="registered_date" value={dc.registered_date} type="date" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                              </div>

                  },
                  ...(isPractitioner ? [{
                    label: 'Professional Details',
                    icon: Briefcase,
                    content:
                    <div className="space-y-4">
                                <ContactFieldRow label="Specialty" field="specialty" value={dc.specialty} type="text" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Credentials" field="credentials" value={dc.credentials} type="text" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Specialization" field="specialization" value={dc.specialization} type="text" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Years of Experience" field="years_of_experience" value={dc.years_of_experience} type="number" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                <ContactFieldRow label="Website" field="website" value={dc.website} type="url" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                              </div>

                  }] : []),
                  {
                    label: 'Preferences',
                    icon: SlidersVertical,
                    content:
                    <div className="space-y-4">
                                <ContactFieldRow label="Preferred Contact Methods" field="preferred_contact_method" value={dc.preferred_contact_method} type="checkboxes" options={['Email', 'SMS', 'Phone Call', 'Social']} editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                {(() => {
                        const pcm = editValues.preferred_contact_method !== undefined ? editValues.preferred_contact_method : dc.preferred_contact_method || '';
                        const methods = pcm.split(',').map((s) => s.trim()).filter(Boolean);
                        return methods.includes('Social') ?
                        <ContactFieldRow label="Social Media Platforms" field="social_media_platforms" value={dc.social_media_platforms} type="checkboxes" options={['Instagram', 'Facebook', 'LinkedIn', 'Twitter']} editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} /> :
                        null;
                      })()}
                                {actualContactType === 'Client' &&
                      <>
                                    <ContactFieldRow label="Preferred Support Type" field="preferred_support_type" value={dc.preferred_support_type} type="checkboxes" options={['Accountability', 'Education', 'Motivation', 'Structure', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                    <ContactFieldRow label="Focus Areas" field="focus_areas" value={dc.focus_areas} type="checkboxes" options={['Weight loss', 'Strength', 'Hormones', 'Gut health', 'Sleep', 'Stress', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                  </>
                      }
                              </div>

                  },
                  {
                    label: 'Other Details',
                    icon: Magnet,
                    content:
                    <div className="space-y-4">
                                <ContactFieldRow label="Referred By" field="contact_source" value={dc.contact_source} type="select" options={['Person', 'Social Media', 'Search Engine', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                                {(isEditing && (editValues.contact_source !== undefined ? editValues.contact_source : dc.contact_source) === 'Person' || !isEditing && dc.contact_source === 'Person') &&
                      <ContactFieldRow label="Person's Name" field="referred_by" value={dc.referred_by} type="text" placeholder="Name of person" editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                      }
                                {(isEditing && (editValues.contact_source !== undefined ? editValues.contact_source : dc.contact_source) === 'Social Media' || !isEditing && dc.contact_source === 'Social Media') &&
                      <ContactFieldRow label="Social Media Platform" field="source_social_media_platform" value={dc.source_social_media_platform} type="select" options={['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                      }
                                {(isEditing && (editValues.contact_source !== undefined ? editValues.contact_source : dc.contact_source) === 'Search Engine' || !isEditing && dc.contact_source === 'Search Engine') &&
                      <ContactFieldRow label="Search Engine" field="source_organic_search_engine" value={dc.source_organic_search_engine} type="select" options={['Google', 'Bing', 'DuckDuckGo', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={isEditing} />
                      }
                              </div>

                  },
                  {
                    label: 'Lifescores™',
                    icon: BarChart3,
                    content: <p className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>Lifescores™ data for {contact.name}.</p>
                  },
                  {
                    label: 'Journeys',
                    icon: Map,
                    isClickable: true,
                    onClick: () => {
                      onJourneyClick?.(null, displayContact);
                    },
                    content: activeJourneys.length > 0 ?
                    <div className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>
                                 {activeJourneys.map((j) =>
                      <div key={j.id}>{j.journey_id}</div>
                      )}
                               </div> :

                    <p className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>No active journeys</p>

                  },
                  {
                    label: 'Sessions',
                    icon: Calendar,
                    isClickable: true,
                    onClick: () => {
                      onSessionsClick?.(displayContact);
                    },
                    content: <p className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>Sessions for {contact.name}.</p>
                  }];

                  return <NeumorphicTabs variant="sub" tabs={desktopTabs} />;
                })()}
                    </div>
              }

                {/* Mobile: collapsible cards */}
                 <div className="block md:hidden">
                   <ContactDetailSections
                  contact={displayContact}
                  onJourneyClick={(journey, sourceContact) => {
                    onJourneyClick?.(journey, sourceContact);
                  }}
                  onSessionsClick={(data) => {
                    onSessionsClick?.(data);
                  }}
                  isEditing={isEditing}
                  onEditChange={setIsEditing}
                  editValues={editValues}
                  setEditValues={setEditValues}
                  onDataUpdate={(updated) => setLocalOverrides((prev) => ({ ...prev, ...updated }))}
                  onAddJourneyOpen={() => onAddJourneyOpenChange?.(true)}
                  onAddSessionOpen={() => onAddSessionOpenChange?.(true)} />

              </div>   {/* mobile section */}
              
              {isEditing && (
                <div className="mt-6 mb-4">
                  <NeumorphicCard 
                    className="!p-0 overflow-visible"
                    clickable
                    onClick={() => setShowDeleteWarning(true)}
                  >
                    <div className="flex items-center gap-4 px-6 py-4">
                      <div className="neumorphic-avatar md flex-shrink-0" style={{ background: 'var(--nm-background)' }}>
                        <Trash2 className="w-4 h-4" style={{ color: 'var(--nm-badge-error-color)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-normal" style={{ color: 'var(--nm-badge-error-color)' }}>Delete Contact</span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>This action cannot be undone.</p>
                      </div>
                    </div>
                  </NeumorphicCard>
                </div>
              )}
              </div>   {/* space-y-6 */}
            </div>     {/* scrollable area */}
          </motion.div>

              {/* Delete Warning Modal */}
              {showDeleteWarning &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ background: 'var(--nm-modal-backdrop)' }}
          onClick={() => setShowDeleteWarning(false)}>

              <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm p-6"
            style={{
              borderRadius: 'var(--nm-radius)',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-modal-shadow-main)'
            }}
            onClick={(e) => e.stopPropagation()}>

                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--nm-badge-error-color)' }} />
                  <h3 className="text-base font-normal" style={{ color: 'var(--nm-text-color)' }}>Delete Contact</h3>
                </div>

                <p className="text-sm mb-6" style={{ color: 'var(--nm-badge-default-color)' }}>
                  Once deleted, this action cannot be reversed. Are you sure you want to continue?
                </p>

                <div className="flex flex-col gap-3">
                  <NeumorphicButton variant="default" onClick={async () => {
                await Contact.delete(rawContact.id);
                queryClient.invalidateQueries({ queryKey: ['contacts'] });
                setShowDeleteWarning(false);
                onClose();
              }} className="w-full !bg-[#f56565] !text-white">
                    Continue
                  </NeumorphicButton>
                  <NeumorphicButton variant="default" onClick={() => setShowDeleteWarning(false)} className="w-full">
                    Cancel
                  </NeumorphicButton>
                </div>
              </motion.div>
            </motion.div>
        }

          {/* Unsaved Changes Warning Modal */}
          {showUnsavedWarning &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ background: 'var(--nm-modal-backdrop)' }}
          onClick={() => setShowUnsavedWarning(false)}>

              <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm p-6"
            style={{
              borderRadius: 'var(--nm-radius)',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-modal-shadow-main)'
            }}
            onClick={(e) => e.stopPropagation()}>

                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--nm-badge-warning-color)' }} />
                  <h3 className="text-base font-normal" style={{ color: 'var(--nm-text-color)' }}>Unsaved Changes</h3>
                </div>

                <p className="text-sm mb-6" style={{ color: 'var(--nm-badge-default-color)' }}>
                  You have unsaved changes. Would you like to save them before exiting edit mode?
                </p>

                <div className="flex flex-col gap-3">
                  <NeumorphicButton variant="primary" icon={Save} onClick={async () => {
                setShowUnsavedWarning(false);
                await handleSave();
              }} className="w-full">
                    Save & Continue
                  </NeumorphicButton>
                  <NeumorphicButton variant="default" onClick={() => {
                setIsEditing(false);
                setEditValues({});
                setShowUnsavedWarning(false);
              }} className="w-full">
                    Discard Changes
                  </NeumorphicButton>
                  <button
                onClick={() => setShowUnsavedWarning(false)}
                className="text-sm"
                style={{ color: 'var(--nm-badge-default-color)' }}>

                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
        }

          {/* Contact Type Change Warning Modal */}
          {showContactTypeWarning &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ background: 'var(--nm-modal-backdrop)' }}
          onClick={() => setShowContactTypeWarning(false)}>

              <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm p-6"
            style={{
              borderRadius: 'var(--nm-radius)',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-modal-shadow-main)'
            }}
            onClick={(e) => e.stopPropagation()}>

                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--nm-badge-warning-color)' }} />
                  <h3 className="text-base font-normal" style={{ color: 'var(--nm-text-color)' }}>Contact Type Changed</h3>
                </div>

                <p className="text-sm mb-6" style={{ color: 'var(--nm-badge-default-color)' }}>
                  Changing the contact type may affect the data and fields visible across the app. Are you sure you want to continue?
                </p>

                <div className="flex flex-col gap-3">
                  <NeumorphicButton variant="primary" icon={Save} onClick={performSave} className="w-full">
                    Save Changes
                  </NeumorphicButton>
                  <NeumorphicButton variant="default" onClick={() => {
                setShowContactTypeWarning(false);
                setEditValues({});
                setIsEditing(false);
                if (savePromiseResolve) {
                  savePromiseResolve();
                  setSavePromiseResolve(null);
                }
              }} className="w-full">
                    Cancel
                  </NeumorphicButton>
                </div>
              </motion.div>
            </motion.div>
        }
        </>
      }
    </AnimatePresence>);

}