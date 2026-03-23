import React, { useState } from 'react';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import NeumorphicCheckbox from '@/components/ui/NeumorphicCheckbox';
import NeumorphicDatePicker from '@/components/ui/NeumorphicDatePicker';
import NeumorphicSelect from '@/components/ui/NeumorphicSelect';
import { formatDate, parseTags } from '@/components/utils/entityHelpers';
import moment from 'moment';
import { Mail, MessageSquare, Phone, Share2, Target, BookOpen, Zap, Heart, Dumbbell, Activity, Moon, Brain } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+353', flag: '🇮🇪', label: 'IE' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
  { code: '+64', flag: '🇳🇿', label: 'NZ' },
  { code: '+33', flag: '🇫🇷', label: 'FR' },
  { code: '+49', flag: '🇩🇪', label: 'DE' },
  { code: '+34', flag: '🇪🇸', label: 'ES' },
  { code: '+39', flag: '🇮🇹', label: 'IT' },
  { code: '+31', flag: '🇳🇱', label: 'NL' },
  { code: '+27', flag: '🇿🇦', label: 'ZA' },
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+971', flag: '🇦🇪', label: 'AE' },
  { code: '+65', flag: '🇸🇬', label: 'SG' },
];

// Split a stored phone value into country code + number
function splitPhone(val) {
  if (!val) return { countryCode: '+44', number: '' };
  const match = COUNTRY_CODES.find(c => val.startsWith(c.code));
  if (match) return { countryCode: match.code, number: val.slice(match.code.length).trim() };
  return { countryCode: '+44', number: val };
}

const inputStyle = {
  background: 'var(--nm-background)',
  boxShadow: 'var(--nm-shadow-inset)',
  border: 'none',
  color: 'var(--nm-text-color)',
};

// Icon mappings for different badge types
const CONTACT_METHOD_ICONS = {
  'Email': Mail,
  'SMS': MessageSquare,
  'Phone Call': Phone,
  'Social': Share2,
};

const SUPPORT_TYPE_ICONS = {
  'Accountability': Target,
  'Education': BookOpen,
  'Motivation': Zap,
  'Structure': Activity,
  'Other': Heart,
};

const FOCUS_AREA_ICONS = {
  'Weight loss': Activity,
  'Strength': Dumbbell,
  'Hormones': Heart,
  'Gut health': Activity,
  'Sleep': Moon,
  'Stress': Brain,
  'Other': Target,
};

export default function ContactFieldRow({ label, field, value, editValues, setEditValues, isEditing, type = 'text', options, placeholder, methodField, methodValue, methodOptions, readOnly = false }) {
  const editVal = editValues[field];
  const currentVal = editVal !== undefined ? editVal : (value || '');

  if (type === 'checkboxes') {
    const selected = parseTags(value);
    const editSelected = editVal !== undefined ? parseTags(editVal) : selected;
    const displaySelected = editSelected.length > 0 ? editSelected : selected;

    const toggleOption = (opt) => {
      const current = editVal !== undefined ? parseTags(editVal) : parseTags(value);
      const updated = current.includes(opt)
        ? current.filter(v => v !== opt)
        : [...current, opt];
      setEditValues({ ...editValues, [field]: updated.join(', ') });
    };

    if (!isEditing && displaySelected.length === 0) return null;
    
    // Determine icon mapping based on field
    let iconMap = null;
    if (field === 'preferred_contact_method') iconMap = CONTACT_METHOD_ICONS;
    if (field === 'preferred_support_type') iconMap = SUPPORT_TYPE_ICONS;
    if (field === 'focus_areas') iconMap = FOCUS_AREA_ICONS;
    
    return (
      <div>
        <p className="text-sm font-normal mb-2">{label}</p>
        {isEditing ? (
          <div className="space-y-2">
            {(options || []).map(opt => (
              <NeumorphicCheckbox
                key={opt}
                label={opt}
                initialChecked={editSelected.includes(opt)}
                onCheckedChange={() => toggleOption(opt)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-start mt-2.5">
            {displaySelected.map((tag, i) => (
              <NeumorphicBadge 
                key={i} 
                variant="default" 
                size="sm"
                icon={iconMap ? iconMap[tag] : null}
              >
                {tag}
              </NeumorphicBadge>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'badges') {
    const tags = parseTags(value);
    if (!isEditing && tags.length === 0) return null;
    return (
      <div>
        <p className="text-sm font-normal mb-2">{label}</p>
        {isEditing ? (
          <input
            type="text"
            value={currentVal}
            onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
            placeholder={placeholder || 'Comma-separated values'}
            className="rounded-lg px-3 text-sm h-9 w-full"
            style={inputStyle}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <NeumorphicBadge key={i} variant="default" size="sm">{tag}</NeumorphicBadge>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'textarea') {
    if (!isEditing && !value) return null;
    return (
      <div>
        {isEditing ? (
          <>
            <p className="text-sm font-normal mb-2">{label}</p>
            <textarea
              value={currentVal}
              onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
              placeholder={placeholder}
              className="rounded-lg px-3 py-2 text-sm w-full"
              style={{ ...inputStyle, minHeight: '60px', resize: 'none' }}
            />
          </>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm font-normal flex-shrink-0">{label}</span>
            <span className="text-sm text-right" style={{ color: 'var(--nm-badge-default-color)' }}>{value}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'select') {
    const selectOptions = (options || []).map(opt => ({ value: opt, label: opt }));
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-normal flex-shrink-0">{label}</span>
        {isEditing ? (
          <div className="w-[62.5%]" style={{ minWidth: '120px' }}>
            <NeumorphicSelect
              options={selectOptions}
              value={currentVal}
              onValueChange={(val) => setEditValues({ ...editValues, [field]: val })}
              placeholder={placeholder || 'Select...'}
              size="sm"
              widthClass="w-full"
            />
          </div>
        ) : (
          <span className="text-sm text-right" style={{ color: 'var(--nm-badge-default-color)' }}>{value || '-'}</span>
        )}
      </div>
    );
  }

  if (type === 'date') {
    // registered_date is always read-only in the detail panel
    const isReadOnly = field === 'registered_date';
    const dateVal = currentVal ? new Date(currentVal) : null;
    return (
      <div className="flex items-start justify-between gap-4">
        <span className="text-sm font-normal flex-shrink-0 pt-2">{label}</span>
        {isEditing && !isReadOnly ? (
          <div className="w-[62.5%]">
            <NeumorphicDatePicker
              value={dateVal}
              onChange={(d) => setEditValues({ ...editValues, [field]: d ? d.toISOString().split('T')[0] : '' })}
              placeholder="Select date..."
            />
          </div>
        ) : (
          <span className="text-sm text-right" style={{ color: 'var(--nm-badge-default-color)' }}>{value ? formatDate(value) : '-'}</span>
        )}
      </div>
    );
  }

  if (type === 'datetime-local') {
    const currentMethod = methodField ? (editValues[methodField] !== undefined ? editValues[methodField] : (methodValue || '')) : '';
    const methodDisplay = currentMethod || '';
    const dateDisplay = value ? moment(value).format('DD MMM YYYY') : '';
    const displayVal = [methodDisplay, dateDisplay].filter(Boolean).join(' · ') || '-';

    // Always read-only display (system-populated fields)
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-normal flex-shrink-0">{label}</span>
        <span className="text-sm text-right" style={{ color: 'var(--nm-badge-default-color)' }}>{displayVal}</span>
      </div>
    );
  }

  if (type === 'number') {
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-normal flex-shrink-0">{label}</span>
        {isEditing ? (
          <input
            type="number"
            value={currentVal}
            onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value ? Number(e.target.value) : '' })}
            placeholder={placeholder}
            className="rounded-lg px-3 text-sm h-9 w-[62.5%]"
            style={inputStyle}
          />
        ) : (
          <span className="text-sm text-right" style={{ color: 'var(--nm-badge-default-color)' }}>{value || '-'}</span>
        )}
      </div>
    );
  }

  // URL: label on its own line, URL below
  if (type === 'url') {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-normal">{label}</span>
        {isEditing ? (
          <input
            type="url"
            value={currentVal}
            onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
            placeholder={placeholder}
            className="rounded-lg px-3 text-sm h-9 w-full"
            style={inputStyle}
          />
        ) : value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm break-all" style={{ color: 'var(--nm-badge-primary-color)', textDecoration: 'underline' }}>
            {value}
          </a>
        ) : (
          <span className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>-</span>
        )}
      </div>
    );
  }

  // Phone with country code picker
  if (type === 'tel') {
    const { countryCode, number } = splitPhone(currentVal);
    const handleCountryChange = (e) => {
      const { number: n } = splitPhone(editValues[field] !== undefined ? editValues[field] : (value || ''));
      setEditValues({ ...editValues, [field]: e.target.value + ' ' + n });
    };
    const handleNumberChange = (e) => {
      setEditValues({ ...editValues, [field]: countryCode + ' ' + e.target.value });
    };
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-normal flex-shrink-0">{label}</span>
        {isEditing ? (
          <div className="flex gap-1 w-[62.5%] min-w-0 overflow-hidden">
            <div className="relative flex-shrink-0" style={{ width: '58px' }}>
              <select
                value={countryCode}
                onChange={handleCountryChange}
                className="rounded-lg text-sm h-9 w-full appearance-none"
                style={{ ...inputStyle, cursor: 'pointer', paddingLeft: '6px', paddingRight: '18px' }}
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-[8px] top-1/2 -translate-y-1/2 text-[var(--nm-badge-default-color)]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
            <input
              type="tel"
              value={number}
              onChange={handleNumberChange}
              placeholder={placeholder || 'Phone number'}
              className="rounded-lg px-3 text-sm h-9 min-w-0 flex-1"
              style={inputStyle}
            />
          </div>
        ) : (
          <span className="text-sm text-right" style={{ color: 'var(--nm-badge-default-color)', maxWidth: '60%' }}>{value || '-'}</span>
        )}
      </div>
    );
  }

  // Default: text / email
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-normal flex-shrink-0">{label}</span>
      {isEditing ? (
        <input
        type={type}
        value={currentVal}
        onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
        placeholder={placeholder}
        className="rounded-lg px-3 text-sm h-9 w-[62.5%]"
        style={inputStyle}
        />
      ) : (
        <span className="text-sm text-right" style={{ color: 'var(--nm-badge-default-color)', maxWidth: '60%' }}>{value || '-'}</span>
      )}
    </div>
  );
}