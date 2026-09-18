/*
 * Kingbolt-style status indicator for project/proposal statuses.
 */
const MAP = {
  OPEN: 'status-open',
  IN_PROGRESS: 'status-progress',
  COMPLETED: 'status-completed',
  CANCELLED: 'status-cancelled',
  SUBMITTED: 'status-open',
  SHORTLISTED: 'status-progress',
  ACCEPTED: 'status-completed',
  REJECTED: 'status-cancelled',
  WITHDRAWN: 'status-cancelled',
};

const LABELS = {
  IN_PROGRESS: 'In Progress',
};

export default function StatusPill({ status }) {
  if (!status) return null;
  const cls = MAP[status] || 'status-open';
  const label = LABELS[status] || status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={`status-pill ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
