// Avatar helpers
export const getInitials = (fullName) => {
  if (!fullName) return '?';
  return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getAvatarColor = (fullName, customColor = null) => {
  if (customColor) return customColor;
  const colors = ['#ec4899', '#f6d55c', '#48bb78', '#2f949d', '#8b5cf6', '#ed8936', '#4299e1'];
  const hash = (fullName || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Badge variant helpers
export const getContactTypeVariant = (contactType) => {
  const variants = {
    'Client': 'success',
    'Practitioner': 'default',
    'Prospect': 'warning',
    'Other': 'default'
  };
  return variants[contactType] || 'default';
};

export const getStatusVariant = (status) => {
  const variants = {
    'Active': 'success',
    'Paused': 'warning',
    'Completed': 'primary',
    'Cancelled': 'danger',
    'active': 'success',
    'inactive': 'default'
  };
  return variants[status] || 'default';
};

export const getSessionStatusVariant = (status) => {
  const variants = {
    'scheduled': 'default',
    'upcoming': 'primary',
    'live': 'success',
    'processing': 'warning',
    'summary_ready': 'success',
    'completed': 'success',
    'cancelled': 'danger',
    'failed': 'danger'
  };
  return variants[status] || 'default';
};

export const getTaskStatusVariant = (status) => {
  const variants = {
    'open': 'default',
    'in_progress': 'warning',
    'done': 'success'
  };
  return variants[status] || 'default';
};

export const getPriorityVariant = (priority) => {
  const variants = {
    'high': 'danger',
    'High': 'danger',
    'medium': 'warning',
    'Medium': 'warning',
    'low': 'default',
    'Low': 'default'
  };
  return variants[priority] || 'default';
};

// Date formatting
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-GB', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatRelativeDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  
  return formatDate(dateString);
};

// Duration formatting
export const formatDuration = (weeks) => {
  if (!weeks) return '';
  if (weeks >= 52) {
    const years = Math.round(weeks / 52);
    return `${years} Year${years > 1 ? 's' : ''}`;
  }
  if (weeks >= 4) {
    const months = Math.round(weeks / 4);
    return `${months} Month${months > 1 ? 's' : ''}`;
  }
  return `${weeks} Week${weeks > 1 ? 's' : ''}`;
};

export const formatMinutes = (minutes) => {
  if (!minutes) return '';
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

// Tags/health goals parsing
export const parseTags = (tagsString) => {
  if (!tagsString) return [];
  return tagsString.split(',').map(t => t.trim()).filter(Boolean);
};

export const tagsToString = (tagsArray) => {
  if (!tagsArray || !Array.isArray(tagsArray)) return '';
  return tagsArray.join(', ');
};

// Progress calculation
export const calculateProgress = (current, total) => {
  if (!total || total === 0) return 0;
  return Math.round((current / total) * 100);
};

// Session display name
export const getSessionDisplayName = (session) => {
  if (session.title && session.title !== 'Session') {
    return session.title;
  }
  if (session.date_time) {
    return `Session – ${formatDate(session.date_time)}`;
  }
  return 'Session';
};

// Journey display helpers
export const getJourneyStatusColor = (status) => {
  const colors = {
    'Active': '#48bb78',
    'Paused': '#ed8936',
    'Completed': '#2f949d',
    'Cancelled': '#e53e3e'
  };
  return colors[status] || '#a0aec0';
};

// Note type derivation
export const deriveNoteType = (linkedContact, linkedSession, linkedJourney, linkedTask) => {
  if (linkedTask) return 'Task Note';
  if (linkedSession) return 'Session Note';
  if (linkedJourney) return 'Journey Note';
  if (linkedContact) return 'Contact Note';
  return 'My Note';
};