import React from 'react';

const getStatusConfig = (status) => {
  const s = status.toLowerCase();
  
  if (['active', 'completed', 'resolved', 'verified', 'success'].includes(s)) {
    return 'badge-success';
  }
  if (['pending', 'processing', 'in progress', 'waiting'].includes(s)) {
    return 'badge-warning';
  }
  if (['rejected', 'failed', 'error', 'cancelled', 'high'].includes(s)) {
    return 'badge-error';
  }
  if (['new', 'open', 'info', 'medium'].includes(s)) {
    return 'badge-info';
  }
  return 'badge-neutral';
};

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const badgeClass = getStatusConfig(status);

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
