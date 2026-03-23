import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, SlidersVertical, Magnet, Save, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Contact } from '@/components/api/entities';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicAvatar from '@/components/ui/NeumorphicAvatar';
import NeumorphicTabs from '@/components/ui/NeumorphicTabs';
import RotatableBadge from '@/components/ui/RotatableBadge';
import EditableBadge from '@/components/ui/EditableBadge';
import ContactFieldRow from '@/components/app/ContactFieldRow';
import ViewHeader from '@/components/ui/ViewHeader';
import ContactDetailSections from '@/components/app/ContactDetailSections';
import { parseTags, getInitials } from '@/components/utils/entityHelpers';

const CONTACT_TYPES = ['Client', 'Practitioner', 'Prospect', 'Other'];
const CONTACT_TYPE_COLORS = ['primary', 'info', 'warning', 'default'];

export default function ContactFormPanel({ 
  open, 
  onClose, 
  onSuccess,
  editContact = null,
  onUnsavedChange,
  onSaveRequest
}) {
  const queryClient = useQueryClient();
  const isEditMode = !!editContact;

  const [editValues, setEditValues] = useState({
    contact_type: 'Client',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  const hasUnsavedChanges = open && (Object.keys(editValues).length > 2 || !!editValues.full_name || !!editValues.email || !!editValues.phone || !!editValues.tags || editValues.contact_type !== 'Client' || editValues.status !== 'active');

  useEffect(() => {
    if (onUnsavedChange) {
      onUnsavedChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChange]);

  useEffect(() => {
    if (open) {
      if (editContact) {
        setEditValues({
          full_name: editContact.full_name || '',
          email: editContact.email || '',
          phone: editContact.phone || '',
          contact_type: editContact.contact_type || 'Client',
          status: editContact.status || 'active',
          health_goals: editContact.health_goals || '',
          notes: editContact.notes || '',
          date_of_birth: editContact.date_of_birth || '',
          emergency_contact: editContact.emergency_contact || '',
          specialty: editContact.specialty || '',
          credentials: editContact.credentials || '',
          website: editContact.website || '',
          ai_references: editContact.ai_references || '',
          ai_recommendations: editContact.ai_recommendations || '',
          profile_image: editContact.profile_image || '',
          gender: editContact.gender || '',
          registered_date: editContact.registered_date || '',
          specialization: editContact.specialization || '',
          years_of_experience: editContact.years_of_experience || '',
          preferred_contact_method: editContact.preferred_contact_method || '',
          social_media_platforms: editContact.social_media_platforms || '',
          preferred_support_type: editContact.preferred_support_type || '',
          focus_areas: editContact.focus_areas || '',
          tags: editContact.tags || '',
          contact_source: editContact.contact_source || '',
          referred_by: editContact.referred_by || '',
          source_social_media_platform: editContact.source_social_media_platform || '',
          source_organic_search_engine: editContact.source_organic_search_engine || ''
        });
      } else {
        setEditValues({
          contact_type: 'Client',
          status: 'active'
        });
      }
      setErrors({});
    }
  }, [open, editContact]);

  const createMutation = useMutation({
    mutationFn: (data) => Contact.create(data),
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); onSuccess?.(data); onClose(); },
    onError: (error) => { console.error('Error creating contact:', error); setErrors({ submit: 'Failed to create contact. Please try again.' }); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => Contact.update(editContact.id, data),
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); onSuccess?.(data); onClose(); },
    onError: (error) => { console.error('Error updating contact:', error); setErrors({ submit: 'Failed to update contact. Please try again.' }); },
  });

  const validate = () => {
    const newErrors = {};
    const fullName = editValues.full_name || '';
    const email = editValues.email || '';
    
    if (!fullName.trim()) newErrors.fullName = 'Name is required';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setErrors(prev => ({ ...prev, submit: 'Please fix the errors below before saving.' }));
      throw new Error('Validation failed');
    }
    
    // Clean up data
    const contactData = { ...editValues };
    
    // Default registered date if new
    if (!isEditMode && !contactData.registered_date) {
      contactData.registered_date = new Date().toISOString().split('T')[0];
    }
    
    // Format numbers
    if (contactData.years_of_experience) {
      contactData.years_of_experience = Number(contactData.years_of_experience);
    }
    
    // Lowercase email
    if (contactData.email) {
      contactData.email = contactData.email.trim().toLowerCase();
    }
    
    if (isEditMode) {
      await updateMutation.mutateAsync(contactData);
    } else {
      await createMutation.mutateAsync(contactData);
    }
  };

  const handleSubmitRef = React.useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (onSaveRequest) {
      onSaveRequest(() => handleSubmitRef.current());
    }
  }, [onSaveRequest]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const currentTags = parseTags(editValues.tags || '');

  const handleAddTag = (newTag) => {
    const updated = [...currentTags, newTag].join(', ');
    setEditValues((prev) => ({ ...prev, tags: updated }));
  };

  const handleRemoveTag = (index) => {
    const updated = currentTags.filter((_, i) => i !== index).join(', ');
    setEditValues((prev) => ({ ...prev, tags: updated }));
  };

  const isPractitioner = editValues.contact_type === 'Practitioner';

  const desktopTabs = [
    {
      label: 'Personal Information',
      icon: User,
      content: (
        <div className="space-y-4">
          <ContactFieldRow label="Email" field="email" value={editValues.email} type="email" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          {errors.email && <div className="text-right text-xs" style={{ color: '#ef4444', marginTop: '-12px' }}>{errors.email}</div>}
          <ContactFieldRow label="Phone" field="phone" value={editValues.phone} type="tel" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          <ContactFieldRow label="Date of Birth" field="date_of_birth" value={editValues.date_of_birth} type="date" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          <ContactFieldRow label="Gender" field="gender" value={editValues.gender} type="select" options={['Male', 'Female', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          <ContactFieldRow label="Pronouns" field="pronouns" value={editValues.pronouns} type="text" placeholder="e.g., he/him, she/her, they/them" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          <ContactFieldRow label="Address" field="address" value={editValues.address} type="textarea" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          <ContactFieldRow label="Emergency Contact" field="emergency_contact" value={editValues.emergency_contact} type="text" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
        </div>
      )
    },
    ...(isPractitioner ? [{
      label: 'Professional Details',
      icon: Briefcase,
      content: (
        <div className="space-y-4">
          <ContactFieldRow label="Specialty" field="specialty" value={editValues.specialty} type="text" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          <ContactFieldRow label="Credentials" field="credentials" value={editValues.credentials} type="text" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          <ContactFieldRow label="Specialization" field="specialization" value={editValues.specialization} type="text" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          <ContactFieldRow label="Years of Experience" field="years_of_experience" value={editValues.years_of_experience} type="number" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          <ContactFieldRow label="Website" field="website" value={editValues.website} type="url" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
        </div>
      )
    }] : []),
    {
      label: 'Preferences',
      icon: SlidersVertical,
      content: (
        <div className="space-y-4">
          <ContactFieldRow label="Preferred Contact Methods" field="preferred_contact_method" value={editValues.preferred_contact_method} type="checkboxes" options={['Email', 'SMS', 'Phone Call', 'Social']} editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          {(() => {
            const pcm = editValues.preferred_contact_method || '';
            const methods = pcm.split(',').map((s) => s.trim()).filter(Boolean);
            return methods.includes('Social') ? (
              <ContactFieldRow label="Social Media Platforms" field="social_media_platforms" value={editValues.social_media_platforms} type="checkboxes" options={['Instagram', 'Facebook', 'LinkedIn', 'Twitter']} editValues={editValues} setEditValues={setEditValues} isEditing={true} />
            ) : null;
          })()}
          {editValues.contact_type === 'Client' && (
            <>
              <ContactFieldRow label="Preferred Support Type" field="preferred_support_type" value={editValues.preferred_support_type} type="checkboxes" options={['Accountability', 'Education', 'Motivation', 'Structure', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={true} />
              <ContactFieldRow label="Focus Areas" field="focus_areas" value={editValues.focus_areas} type="checkboxes" options={['Weight loss', 'Strength', 'Hormones', 'Gut health', 'Sleep', 'Stress', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={true} />
            </>
          )}
        </div>
      )
    },
    {
      label: 'Other Details',
      icon: Magnet,
      content: (
        <div className="space-y-4">
          <ContactFieldRow label="Referred By" field="contact_source" value={editValues.contact_source} type="select" options={['Person', 'Social Media', 'Search Engine', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          {editValues.contact_source === 'Person' && (
            <ContactFieldRow label="Person's Name" field="referred_by" value={editValues.referred_by} type="text" placeholder="Name of person" editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          )}
          {editValues.contact_source === 'Social Media' && (
            <ContactFieldRow label="Social Media Platform" field="source_social_media_platform" value={editValues.source_social_media_platform} type="select" options={['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          )}
          {editValues.contact_source === 'Search Engine' && (
            <ContactFieldRow label="Search Engine" field="source_organic_search_engine" value={editValues.source_organic_search_engine} type="select" options={['Google', 'Bing', 'DuckDuckGo', 'Other']} editValues={editValues} setEditValues={setEditValues} isEditing={true} />
          )}
        </div>
      )
    }
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[90]" onClick={onClose} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed left-0 right-0 bottom-0 z-[100] flex flex-col md:absolute"
            style={{
              top: '65px',
              borderRadius: '0',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
            }}
          >
            <div 
              className="flex-1 overflow-y-auto px-4 md:px-8 pb-24 md:pb-8 pt-6" 
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              <h2 className="text-2xl font-normal mb-6">{isEditMode ? 'Edit Contact' : 'Add Contact'}</h2>

              {errors.submit && (
                <div className="p-3 rounded-lg text-sm mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  {errors.submit}
                </div>
              )}

              <div className="space-y-6">
                <NeumorphicCard className="pt-4 pr-6 pb-4 pl-6 neumorphic-card transition-all duration-300">
                  <div className="flex gap-4">
                    <NeumorphicAvatar
                      initials={getInitials(editValues.full_name || 'New Contact')}
                      src={editValues.profile_image}
                      size="md"
                      icon={(!isEditMode && !editValues.profile_image) ? <User className="w-5 h-5 text-gray-400" /> : null}
                    />

                    <div className="flex-1">
                      <div className="mb-4">
                        <input
                          type="text"
                          value={editValues.full_name || ''}
                          onChange={(e) => setEditValues({ ...editValues, full_name: e.target.value })}
                          className="rounded-lg px-3 text-sm h-9"
                          style={{
                            background: 'var(--nm-background)',
                            boxShadow: 'var(--nm-shadow-inset)',
                            border: 'none',
                            color: 'var(--nm-text-color)',
                            width: '200px'
                          }}
                          placeholder="Contact name *"
                        />
                        {errors.fullName && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.fullName}</p>}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <RotatableBadge
                          states={CONTACT_TYPES}
                          colors={CONTACT_TYPE_COLORS}
                          onRotate={(newType) => setEditValues({ ...editValues, contact_type: newType })}
                          initialState={editValues.contact_type || 'Client'}
                          alwaysShowIcon={true}
                        />
                        <EditableBadge
                          badges={currentTags.slice(0, 2)}
                          onAdd={currentTags.length < 2 ? handleAddTag : undefined}
                          onRemove={handleRemoveTag}
                          variant="category"
                          size="sm"
                          placeholder="add tag..."
                        />
                      </div>
                    </div>
                  </div>
                </NeumorphicCard>

                <div className="hidden md:block">
                  <div className="pt-[10px]" />
                  <NeumorphicTabs variant="sub" tabs={desktopTabs} />
                </div>
                
                <div className="block md:hidden">
                  <ContactDetailSections
                    contact={{ ...editValues, id: 'temp' }} 
                    isEditing={true}
                    onEditChange={() => {}}
                    editValues={editValues}
                    setEditValues={setEditValues}
                  />
                </div>
                
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}