import React, { useState } from 'react';
import { Activity, User, BarChart3, Map, Calendar, ChevronDown, Briefcase, SlidersVertical, Magnet, ChevronRight, Clock, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicLifescoreGauge from '@/components/ui/NeumorphicLifescoreGauge';
import JourneyCard from '@/components/app/JourneyCard';
import ContactFieldRow from '@/components/app/ContactFieldRow';
import ContactActivityTimeline from '@/components/app/ContactActivityTimeline';
import { ContactJourney, Journey, Session } from '@/components/api/entities';
const sectionColors = {
  'Latest Activity': '#2f949d',
  'Personal Information': '#4299e1',
  'Professional Details': '#ed8936',
  'Contact Preferences': '#ec4899',
  'Other Details': '#8b5cf6',
  'Lifescores™': '#48bb78',
  Journeys: '#f56565',
  Sessions: '#f6d55c'
};

export default function ContactDetailSections({ contact, onJourneyClick, onSessionsClick, isEditing, onEditChange, editValues, setEditValues, onDataUpdate, onAddJourneyOpen, onAddSessionOpen }) {
  const [openSection, setOpenSection] = useState('Latest Activity');
  const navigate = useNavigate();

  const { data: activeJourneys = [] } = useQuery({
    queryKey: ['contactJourneys', contact?.id],
    queryFn: async () => {
      if (!contact?.id) return [];
      const contactJourneys = await ContactJourney.filter({ contact_id: contact.id, status: 'Active' });
      const journeys = await Promise.all(
        contactJourneys.map(async (cj) => {
          try {
            const journey = await Journey.get(cj.journey_id);
            return journey?.title || 'Unknown Journey';
          } catch {
            return 'Unknown Journey';
          }
        })
      );
      return journeys;
    },
    enabled: !!contact?.id,
    staleTime: 0,
    cacheTime: 0
  });

  const { data: sessionDetails = null } = useQuery({
    queryKey: ['contactSessions', contact?.id],
    queryFn: async () => {
      if (!contact?.id) return null;
      const sessions = await Session.filter({ contact_id: contact.id });
      if (!sessions || sessions.length === 0) return null;

      const now = new Date();
      const upcomingSessions = sessions.filter((s) => new Date(s.date_time) > now).sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
      const pastSessions = sessions.filter((s) => new Date(s.date_time) <= now).sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

      const session = upcomingSessions[0] || pastSessions[0];
      if (!session) return null;

      const dateObj = new Date(session.date_time);
      const fullDateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const duration = session.duration ? `${session.duration}m` : null;

      return {
        status: session.status || 'scheduled',
        title: session.title || 'Session',
        dateFullStr: fullDateStr,
        time: timeStr,
        duration: duration
      };
    },
    enabled: !!contact?.id,
    staleTime: 0,
    cacheTime: 0
  });

  // Auto-expand Personal Information when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setOpenSection('Personal Information');
    }
  }, [isEditing]);



  const c = contact || {};
  const isPractitioner = c.contact_type === 'Practitioner';
  const fieldProps = { editValues: editValues || {}, setEditValues, isEditing };

  const preferencesTitle =
  c.contact_type === 'Client' ? 'Client Preferences' :
  c.contact_type === 'Practitioner' ? 'Practitioner Preferences' :
  c.contact_type === 'Prospect' ? 'Client Preferences' :
  'Contact Preferences';

  const sections = [
  { title: 'Journeys', icon: Map, description: activeJourneys.length > 0 ? activeJourneys.join(', ') : 'No journeys assigned yet', isNavigable: activeJourneys.length > 0, hasAddButton: activeJourneys.length === 0 },
  { title: 'Sessions', icon: Calendar, description: sessionDetails ? sessionDetails.title : 'No upcoming or recent sessions', dateTime: sessionDetails ? `${sessionDetails.dateFullStr} ${sessionDetails.time}${sessionDetails.duration ? ` • ${sessionDetails.duration}` : ''}` : null, isNavigable: !!sessionDetails, hasAddButton: !sessionDetails, statusBadge: sessionDetails?.status },
  { title: 'Lifescores™', icon: BarChart3, description: `Last snapshot ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` },
  { title: 'Personal Information', icon: User, description: 'Contact & personal details' },
  ...(isPractitioner ? [{ title: 'Professional Details', icon: Briefcase, description: 'Credentials & experience' }] : []),
  { title: preferencesTitle, icon: SlidersVertical, description: 'Contact, support & focus' },
  { title: 'Other Details', icon: Magnet, description: 'Additional contact information' }];


  const editableSections = ['Personal Information', 'Professional Details', preferencesTitle, 'Other Details'];

  const renderSectionContent = (title) => {
    switch (title) {
      case 'Personal Information':
        return (
          <div className="space-y-4">
            <ContactFieldRow label="Email" field="email" value={c.email} type="email" {...fieldProps} />
            <ContactFieldRow label="Phone" field="phone" value={c.phone} type="tel" {...fieldProps} />
            <ContactFieldRow label="Date of Birth" field="date_of_birth" value={c.date_of_birth} type="date" {...fieldProps} />
            <ContactFieldRow label="Gender" field="gender" value={c.gender} type="select" options={['Male', 'Female', 'Prefer not to say']} {...fieldProps} />
            <ContactFieldRow label="Pronouns" field="pronouns" value={c.pronouns} type="select" options={['He/Him', 'She/Her', 'They/Them', 'He/They', 'She/They', 'Prefer not to say']} {...fieldProps} />
            <ContactFieldRow label="Address" field="address" value={c.address} type="textarea" {...fieldProps} />
            <p className="text-sm font-normal pt-2" style={{ color: 'var(--nm-text-color)' }}>Emergency Contact</p>
            <ContactFieldRow label="Contact Name" field="emergency_contact" value={c.emergency_contact} type="text" {...fieldProps} />
            <ContactFieldRow label="Contact Phone" field="emergency_phone" value={c.emergency_phone} type="tel" {...fieldProps} />
            <ContactFieldRow label="Registered Date" field="registered_date" value={c.registered_date} type="date" {...fieldProps} />
          </div>);


      case 'Professional Details':
        return (
          <div className="space-y-4">
            <ContactFieldRow label="Specialty" field="specialty" value={c.specialty} type="select" options={['Dietitian', 'Nutritionist', 'Personal Trainer', 'Life Coach', 'Therapist', 'Psychologist', 'Counselor', 'Physiotherapist', 'Osteopath', 'Chiropractor', 'Doctor', 'Nurse Practitioner', 'Health Coach', 'Sleep Coach', 'Yoga Instructor', 'Pilates Instructor', 'Sports Coach', 'Occupational Therapist', 'Social Worker', 'Wellness Coach']} {...fieldProps} />
            <ContactFieldRow label="Credentials" field="credentials" value={c.credentials} type="text" {...fieldProps} />
            <ContactFieldRow label="Specialization" field="specialization" value={c.specialization} type="text" {...fieldProps} />
            <ContactFieldRow label="Years of Experience" field="years_of_experience" value={c.years_of_experience} type="number" {...fieldProps} />
            <ContactFieldRow label="Website" field="website" value={c.website} type="url" {...fieldProps} />
          </div>);


      case 'Client Preferences':
      case 'Practitioner Preferences':
      case 'Contact Preferences':
        return (
          <div className="space-y-4">
            <ContactFieldRow label="Preferred Contact Methods" field="preferred_contact_method" value={c.preferred_contact_method} type="checkboxes" options={['Email', 'SMS', 'Phone Call', 'Social']} {...fieldProps} />
            {(() => {
              const pcm = fieldProps.editValues.preferred_contact_method !== undefined ? fieldProps.editValues.preferred_contact_method : c.preferred_contact_method || '';
              const methods = pcm.split(',').map((s) => s.trim()).filter(Boolean);
              return methods.includes('Social') ?
              <ContactFieldRow label="Social Media Platforms" field="social_media_platforms" value={c.social_media_platforms} type="checkboxes" options={['Instagram', 'Facebook', 'LinkedIn', 'Twitter']} {...fieldProps} /> :
              null;
            })()}
            {isPractitioner === false &&
            <>
                <ContactFieldRow label="Preferred Support Type" field="preferred_support_type" value={c.preferred_support_type} type="checkboxes" options={['Accountability', 'Education', 'Motivation', 'Structure', 'Other']} {...fieldProps} />
                <ContactFieldRow label="Focus Areas" field="focus_areas" value={c.focus_areas} type="checkboxes" options={['Weight loss', 'Strength', 'Hormones', 'Gut health', 'Sleep', 'Stress', 'Other']} {...fieldProps} />
              </>
            }
          </div>);


      case 'Other Details':
        return (
          <div className="space-y-4 pb-32">
            <ContactFieldRow label="Acquired By" field="contact_source" value={c.contact_source} type="select" options={['Referral', 'Search Engine', 'Social Media', 'Website']} {...fieldProps} />
            {(isEditing && (editValues.contact_source !== undefined ? editValues.contact_source : c.contact_source) === 'Referral' || !isEditing && c.contact_source === 'Referral') &&
            <ContactFieldRow label="Referral Detail" field="referred_by" value={c.referred_by} type="text" placeholder="Who referred them..." {...fieldProps} />
            }
            {(isEditing && (editValues.contact_source !== undefined ? editValues.contact_source : c.contact_source) === 'Social Media' || !isEditing && c.contact_source === 'Social Media') &&
            <ContactFieldRow label="Social Media Detail" field="source_social_media_platform" value={c.source_social_media_platform} type="text" placeholder="Which platform..." {...fieldProps} />
            }
            {(isEditing && (editValues.contact_source !== undefined ? editValues.contact_source : c.contact_source) === 'Search Engine' || !isEditing && c.contact_source === 'Search Engine') &&
            <ContactFieldRow label="Search Engine Detail" field="source_organic_search_engine" value={c.source_organic_search_engine} type="text" placeholder="Which search engine..." {...fieldProps} />
            }
          </div>);


      case 'Lifescores™':
        return <p className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>Lifescores™ data for {contact.name}.</p>;
      case 'Journeys':
        return <JourneyCard onClick={onJourneyClick} />;
      case 'Sessions':
        return <p className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>Sessions for {contact.name}.</p>;
      default:
        return null;
    }
  };

  const sectionRefs = React.useRef({});

  const toggleSection = (title, isNavigable, hasAddButton) => {
    if (isNavigable) {
      if (title === 'Sessions') {
        onSessionsClick?.(contact);
      } else {
        onJourneyClick?.(null, contact);
      }
      return;
    }
    if (hasAddButton) return; // clicking row when no journeys/sessions does nothing; use the + button
    if (isEditing && !editableSections.includes(title)) return;
    const isClosing = openSection === title;
    setOpenSection((prev) => prev === title ? null : title);
    if (!isClosing) {
      setTimeout(() => {
        sectionRefs.current[title]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 280);
    }
  };

  const mainSections = sections.filter((s) => !['Journeys', 'Sessions', 'Lifescores™'].includes(s.title));
  const specialSections = sections.filter((s) => ['Journeys', 'Sessions', 'Lifescores™'].includes(s.title));

  return (
    <>
    <motion.div className={isEditing ? "space-y-1" : "space-y-6"} layout>
      {/* Latest Activity - animates out when editing */}
      <motion.div
        initial={false}
        animate={isEditing ?
        { height: 0, opacity: 0, marginBottom: 0 } :
        { height: 'auto', opacity: 1, marginBottom: 0 }
        }
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        style={{ overflow: isEditing ? 'hidden' : 'visible' }}>

        <NeumorphicCard className="!p-0 overflow-visible">
            <div
            className="flex items-center gap-4 px-6 py-4 cursor-pointer"
            onClick={() => setOpenSection(openSection === 'Latest Activity' ? null : 'Latest Activity')}>

              <div
              className="neumorphic-avatar md flex-shrink-0"
              style={{ backgroundColor: sectionColors['Latest Activity'], color: '#fff' }}>

                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-base font-normal">Latest Activity</span>
                <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>Recent activity timeline</p>
              </div>
              <ChevronDown
              className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
              style={{
                color: 'var(--nm-badge-default-color)',
                transform: openSection === 'Latest Activity' ? 'rotate(180deg)' : 'rotate(0deg)'
              }} />

            </div>
            <AnimatePresence initial={false}>
              {openSection === 'Latest Activity' &&
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}>

                  <div className="px-6 pb-6 pt-2 max-h-[160px] overflow-y-auto">
                    <ContactActivityTimeline
                  activities={[
                  { id: 1, type: 'session', title: 'Session completed', description: 'Initial consultation session', date: '2026-02-20T14:30:00', created_date: '2026-02-20T14:30:00' },
                  { id: 2, type: 'note', title: 'Note added', description: 'Follow-up notes from session', date: '2026-02-20T15:00:00', created_date: '2026-02-20T15:00:00' },
                  { id: 3, type: 'email', title: 'Email sent', description: 'Welcome email with resources', date: '2026-02-19T10:00:00', created_date: '2026-02-19T10:00:00' },
                  { id: 4, type: 'contact', title: 'Contact created', description: 'New client onboarded', date: '2026-02-18T09:00:00', created_date: '2026-02-18T09:00:00' }]
                  } />

                  </div>
                </motion.div>
            }
            </AnimatePresence>
          </NeumorphicCard>
      </motion.div>

      {/* Journeys, Sessions, Lifescores Card - animates in/out when editing */}
      <AnimatePresence initial={false} mode="wait">
        {!isEditing &&
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}>

            <NeumorphicCard className="!p-0 overflow-visible">
              <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                {specialSections.map((section) => {
                const Icon = section.icon;
                const isOpen = openSection === section.title;
                return (
                  <div key={section.title} ref={(el) => sectionRefs.current[section.title] = el}>
                      <div
                      className="flex items-center gap-4 px-6 py-4 transition-all duration-200 cursor-pointer"
                      onClick={() => toggleSection(section.title, section.isNavigable, section.hasAddButton)}>

                         <div className="relative flex-shrink-0">
                           {section.title === 'Lifescores™' ?
                        <NeumorphicLifescoreGauge score={72} label="" size="xs" /> :

                        <div
                          className="neumorphic-avatar md"
                          style={{ backgroundColor: sectionColors[section.title], color: '#fff' }}>

                               <Icon className="w-4 h-4" />
                             </div>
                        }
                           {section.title === 'Journeys' && activeJourneys.length > 0 &&
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[--nm-background]" />
                        }
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                             <span className="text-lg font-normal">{section.title}</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <p className="text-xs truncate" style={{ color: 'var(--nm-badge-default-color)' }}>{section.description}</p>
                             {section.statusBadge &&
                          <span
                            className="flex-shrink-0"
                            style={{
                              fontSize: '0.65rem',
                              padding: '2px 6px',
                              borderRadius: '9999px',
                              backgroundColor:
                              section.statusBadge === 'scheduled' || section.statusBadge === 'upcoming' ? '#2f949d' :
                              section.statusBadge === 'live' ? '#48bb78' :
                              section.statusBadge === 'completed' ? '#4299e1' :
                              section.statusBadge === 'processing' || section.statusBadge === 'summary_ready' ? '#ed8936' :
                              section.statusBadge === 'failed' || section.statusBadge === 'cancelled' ? '#f56565' :
                              '#718096',
                              color: '#fff',
                              fontWeight: '500'
                            }}>

                                 {section.statusBadge.charAt(0).toUpperCase() + section.statusBadge.slice(1).replace('_', ' ')}
                               </span>
                          }
                           </div>
                           {section.dateTime &&
                        <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: 'var(--nm-badge-default-color)' }}>
                               <Clock className="w-3 h-3" />
                               <span>{section.dateTime}</span>
                             </div>
                        }
                         </div>
                         {section.hasAddButton ?
                      <button
                        onClick={(e) => { e.stopPropagation(); section.title === 'Sessions' ? onAddSessionOpen?.() : onAddJourneyOpen?.(); }}
                        className="flex-shrink-0 flex items-center justify-center transition-all duration-200 hover:scale-105"
                        style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: 'var(--nm-background)',
                          boxShadow: 'var(--nm-shadow-main)',
                          border: 'none', cursor: 'pointer'
                        }}>
                        <Plus className="w-3.5 h-3.5" style={{ color: 'var(--nm-badge-primary-color)' }} />
                      </button> :
                      section.isNavigable ?
                      <ChevronRight
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: 'var(--nm-badge-default-color)' }} /> :
                      <ChevronDown
                        className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                        style={{
                          color: 'var(--nm-badge-default-color)',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                        }} />
                      }
                      </div>
                      <AnimatePresence initial={false}>
                        {isOpen &&
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        style={{ overflow: 'hidden' }}>

                            <div className="px-6 pb-6 pt-4">
                              {renderSectionContent(section.title)}
                            </div>
                          </motion.div>
                      }
                      </AnimatePresence>
                    </div>);

              })}
              </div>
            </NeumorphicCard>
          </motion.div>
        }
      </AnimatePresence>

      {/* Main Sections Card */}
      <motion.div layout>
        <NeumorphicCard className="!p-0 overflow-visible">
          <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
            {mainSections.map((section) => {
              const Icon = section.icon;
              const isOpen = openSection === section.title;
              const isEditableSection = editableSections.includes(section.title);
              return (
                <div key={section.title} ref={(el) => sectionRefs.current[section.title] = el}>
                <div
                    className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 ${isEditing && !isEditableSection ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                    onClick={() => toggleSection(section.title, section.isNavigable)}>

                   <div className="relative">
                     <div
                        className="neumorphic-avatar md flex-shrink-0"
                        style={{ backgroundColor: sectionColors[section.title], color: '#fff' }}>

                       <Icon className="w-4 h-4" />
                     </div>
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <span className="text-base font-normal">{section.title}</span>
                     </div>
                     <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>{section.description}</p>
                   </div>
                   <ChevronDown
                      className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                      style={{
                        color: 'var(--nm-badge-default-color)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                      }} />

                </div>
                <AnimatePresence initial={false}>
                  {isOpen &&
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}>

                      <div className="px-6 pb-6 pt-4">
                        {renderSectionContent(section.title)}
                      </div>
                    </motion.div>
                    }
                </AnimatePresence>
              </div>);

            })}
          </div>
          </NeumorphicCard>
          </motion.div>
          </motion.div>

          </>);

}