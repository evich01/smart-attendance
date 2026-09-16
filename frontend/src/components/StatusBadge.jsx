import React from 'react';

const STATUS_MAP = {
  present: { cls: 'badge-good', label: 'Present' },
  late: { cls: 'badge-warning', label: 'Late' },
  absent: { cls: 'badge-risk', label: 'Absent' },
  missing_checkout: { cls: 'badge-warning', label: 'Missing Check-Out' },
  not_checked_in: { cls: 'badge-risk', label: 'Not Checked In' },
  Good: { cls: 'badge-good', label: 'Good' },
  Warning: { cls: 'badge-warning', label: 'Warning' },
  'At Risk': { cls: 'badge-risk', label: 'At Risk' }
};

const LEAVE_STATUS_MAP = {
  pending: { cls: 'badge-warning', label: 'Pending' },
  approved: { cls: 'badge-good', label: 'Approved' },
  rejected: { cls: 'badge-risk', label: 'Rejected' }
};

export default function StatusBadge({ status, type = 'attendance' }) {
  const map = type === 'leave' ? LEAVE_STATUS_MAP : STATUS_MAP;
  const entry = map[status] || { cls: 'badge-risk', label: status };
  return <span className={entry.cls}>{entry.label}</span>;
}

