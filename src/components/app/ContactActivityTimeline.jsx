import React, { useState } from 'react';
import { Circle, CheckCircle2, FileText, Calendar, UserCheck, MessageSquare, Phone, Mail, Video } from 'lucide-react';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import { formatDate } from '@/components/utils/entityHelpers';

const activityIcons = {
  session: Calendar,
  note: FileText,
  task: CheckCircle2,
  contact: Phone,
  email: Mail,
  message: MessageSquare,
  meeting: Video,
  update: UserCheck,
};

const activityColors = {
  session: 'primary',
  note: 'info',
  task: 'success',
  contact: 'warning',
  email: 'accent',
  message: 'checkin',
  meeting: 'learning',
  update: 'default',
};

export default function ContactActivityTimeline({ activities = [] }) {
  // Sort activities by date, newest first
  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = new Date(a.date || a.created_date);
    const dateB = new Date(b.date || b.created_date);
    return dateB - dateA;
  });

  return (
    <div className="relative">
      {sortedActivities.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>
            No activity yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedActivities.map((activity, index) => {
            const Icon = activityIcons[activity.type] || Circle;
            const color = activityColors[activity.type] || 'default';
            const isLast = index === sortedActivities.length - 1;

            return (
              <div key={activity.id || index} className="flex gap-3 relative">
                {/* Timeline line */}
                {!isLast && (
                  <div
                    className="absolute left-[11px] top-[28px] w-[2px] h-[calc(100%+12px)]"
                    style={{
                      background: 'linear-gradient(180deg, var(--nm-badge-default-color) 0%, transparent 100%)',
                      opacity: 0.3,
                    }}
                  />
                )}

                {/* Icon badge */}
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center relative z-10"
                  style={{
                    background: 'var(--nm-background)',
                    boxShadow: 'var(--nm-shadow-main)',
                  }}
                >
                  <Icon className="w-3 h-3" style={{ color: `var(--nm-badge-${color}-color)` }} />
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-normal" style={{ color: 'var(--nm-text-color)' }}>
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--nm-badge-default-color)' }}>
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <div style={{ marginLeft: '-5px' }}>
                      <NeumorphicBadge variant={color} size="sm">
                        {activity.type}
                      </NeumorphicBadge>
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--nm-badge-default-color)' }}>
                    {formatDate(activity.date || activity.created_date)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}