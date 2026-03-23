import React from 'react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';

const defaultJourneyData = {
  title: '12 Week Transformation',
  contact: { name: 'Miriam Santori', initials: 'M', avatarColor: '#ec4899', role: 'Client' },
  duration: '12 Weeks',
  status: 'Active',
  startDate: 'Jan 13, 2026',
  progress: 50,
  milestones: [
    { label: 'Initial Assessment', completed: true },
    { label: 'Nutrition Plan', completed: true },
    { label: 'Mid-Point Review', completed: false },
    { label: 'Final Assessment', completed: false },
  ],
};

export default function JourneyCard({ title = '12 Week Transformation', duration = '12 Weeks', status = 'Active', progress = 50, milestones = [1, 2], onClick }) {
  const handleClick = () => {
    if (onClick) onClick(defaultJourneyData);
  };

  return (
    <NeumorphicCard className={onClick ? 'cursor-pointer' : ''} onClick={handleClick}>
      <h4 className="text-lg font-semibold" style={{ color: 'var(--nm-text-color)' }}>{title}</h4>
      <p className="text-sm mt-1" style={{ color: 'var(--nm-badge-default-color)' }}>
        {duration} • {status}
      </p>

      <div className="mt-4">
        <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--nm-badge-primary-color)' }}>
          PROGRESS
        </span>
        <div className="mt-1.5 w-full h-2.5 rounded-full" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--nm-badge-primary-color)' }}
          />
        </div>
      </div>

      {milestones.length > 0 && (
        <div className="flex gap-1.5 mt-3">
          {milestones.map((m) => (
            <div
              key={m}
              className="w-7 h-7 rounded-full flex items-center justify-content text-xs font-medium flex items-center justify-center"
              style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-main)', color: 'var(--nm-badge-default-color)' }}
            >
              {m}
            </div>
          ))}
        </div>
      )}
    </NeumorphicCard>
  );
}