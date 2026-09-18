import {
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineXCircle,
} from 'react-icons/hi';

/*
 * Kingbolt-style inline Alert (adapted from public-charging-fe).
 * severity: info | success | warning | error
 */
const SEVERITY = {
  info: { icon: HiOutlineInformationCircle, wrap: 'bg-blue-50 border-blue-200 text-status-info' },
  success: { icon: HiOutlineCheckCircle, wrap: 'bg-green-50 border-green-200 text-status-success' },
  warning: { icon: HiOutlineExclamation, wrap: 'bg-amber-50 border-amber-200 text-status-warning' },
  error: { icon: HiOutlineXCircle, wrap: 'bg-red-50 border-red-200 text-status-error' },
};

export default function Alert({ severity = 'info', title, children, className = '' }) {
  const cfg = SEVERITY[severity] || SEVERITY.info;
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded border ${cfg.wrap} ${className}`}>
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm">{title}</p>}
        <div className="text-sm text-brand-ink/80">{children}</div>
      </div>
    </div>
  );
}
