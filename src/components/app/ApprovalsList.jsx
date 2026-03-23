import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import NeumorphicAvatar from '@/components/ui/NeumorphicAvatar';
import { CheckSquare, Clock, AlertCircle, Check, X } from 'lucide-react';

// Dummy approval data
const DUMMY_APPROVALS = [
  {
    id: 1,
    type: 'recommendation',
    title: 'Supplement Recommendation',
    practitioner: 'Dr. Michael Chen',
    practitionerSpecialty: 'Nutritionist',
    client: 'Sarah Mitchell',
    description: 'Vitamin D3 supplementation (2000 IU daily) for client with documented deficiency. Awaiting practitioner approval.',
    priority: 'high',
    status: 'pending',
    requestedAt: '2026-02-15T14:30:00',
  },
  {
    id: 2,
    type: 'intervention',
    title: 'Dietary Intervention Plan',
    practitioner: 'Dr. Michael Chen',
    practitionerSpecialty: 'Nutritionist',
    client: 'James Peterson',
    description: 'High-protein meal plan adjustment for muscle building phase. Requesting registered dietitian approval.',
    priority: 'medium',
    status: 'pending',
    requestedAt: '2026-02-14T10:15:00',
  },
];

export default function ApprovalsList() {
  const [approvals, setApprovals] = useState(DUMMY_APPROVALS);

  const handleApprove = (id) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
  };

  const handleReject = (id) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const processedApprovals = approvals.filter(a => a.status !== 'pending');

  const priorityColors = {
    high: 'error',
    medium: 'warning',
    low: 'default',
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <NeumorphicCard>
        <div className="flex items-center gap-3">
          <div className="neumorphic-icon-badge md" style={{ position: 'relative' }}>
            <CheckSquare className="w-5 h-5" style={{ color: 'var(--nm-badge-primary-color)' }} />
            {pendingApprovals.length > 0 && (
              <div className="neumorphic-avatar-badge" style={{ background: '#2f949d', color: '#fff' }}>
                {pendingApprovals.length}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-normal">Approval Requests</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--nm-badge-default-color)' }}>
              {pendingApprovals.length > 0 
                ? `${pendingApprovals.length} pending approval${pendingApprovals.length > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
        </div>
      </NeumorphicCard>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-normal px-1" style={{ color: 'var(--nm-badge-default-color)' }}>
            Pending
          </h4>
          {pendingApprovals.map((approval) => (
            <NeumorphicCard key={approval.id}>
              <div className="flex items-start gap-4 mb-4">
                <div className="neumorphic-icon-badge md flex-shrink-0">
                  <Clock className="w-5 h-5" style={{ color: 'var(--nm-badge-warning-color)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-normal">{approval.title}</h4>
                    <NeumorphicBadge variant={priorityColors[approval.priority]} size="sm">
                      {approval.priority}
                    </NeumorphicBadge>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--nm-badge-default-color)' }}>
                    {approval.description}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <NeumorphicAvatar size="sm" initials={getInitials(approval.practitioner)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-normal">{approval.practitioner}</p>
                      <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>
                        {approval.practitionerSpecialty} • {approval.client}
                      </p>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }}>
                      {formatDate(approval.requestedAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <NeumorphicButton
                  variant="primary"
                  size="sm"
                  icon={Check}
                  onClick={() => handleApprove(approval.id)}
                  className="flex-1"
                >
                  Approve
                </NeumorphicButton>
                <NeumorphicButton
                  variant="default"
                  size="sm"
                  icon={X}
                  onClick={() => handleReject(approval.id)}
                  className="flex-1"
                >
                  Reject
                </NeumorphicButton>
              </div>
            </NeumorphicCard>
          ))}
        </div>
      )}

      {/* Processed Approvals */}
      {processedApprovals.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-normal px-1" style={{ color: 'var(--nm-badge-default-color)' }}>
            Processed
          </h4>
          {processedApprovals.map((approval) => (
            <NeumorphicCard key={approval.id} className="opacity-60">
              <div className="flex items-start gap-4">
                <div className="neumorphic-icon-badge md flex-shrink-0">
                  {approval.status === 'approved' ? (
                    <Check className="w-5 h-5" style={{ color: 'var(--nm-badge-success-color)' }} />
                  ) : (
                    <X className="w-5 h-5" style={{ color: 'var(--nm-badge-error-color)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-normal">{approval.title}</h4>
                    <NeumorphicBadge 
                      variant={approval.status === 'approved' ? 'success' : 'error'} 
                      size="sm"
                    >
                      {approval.status}
                    </NeumorphicBadge>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--nm-badge-default-color)' }}>
                    {approval.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>
                      {approval.practitioner} • {approval.client}
                    </span>
                  </div>
                </div>
              </div>
            </NeumorphicCard>
          ))}
        </div>
      )}

      {/* Empty State */}
      {approvals.length === 0 && (
        <NeumorphicCard>
          <div className="text-center py-8">
            <CheckSquare className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--nm-badge-default-color)', opacity: 0.5 }} />
            <p style={{ color: 'var(--nm-badge-default-color)' }}>No approval requests</p>
          </div>
        </NeumorphicCard>
      )}
    </div>
  );
}