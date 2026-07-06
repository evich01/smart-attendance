import React from 'react';

export default function StatusBadge({ status }) {
  const cls = status === 'Good' ? 'badge-good' : status === 'Warning' ? 'badge-warning' : 'badge-risk';
  return <span className={cls}>{status}</span>;
}
