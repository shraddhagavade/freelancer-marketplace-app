import React, { useEffect, useMemo, useState } from 'react';
import { acceptApplication, applyTask, confirmPayment, createPayment, createTask, fetchPayments, fetchTaskApplications, fetchTaskMessages, fetchTasks, login, register, requestPasswordReset, resetPassword, sendTaskMessage, updateMilestoneStatus, updateTaskProgress } from './api';

const STORAGE_KEYS = {
  token: 'token',
  role: 'role',
  email: 'email',
  fullName: 'full-name',
  ownedTaskIds: 'owned-task-ids',
  appliedTaskIds: 'applied-task-ids',
  progressMap: 'freelancer-progress-map'
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return currency.format(Number.isNaN(amount) ? 0 : amount);
}

function formatPostedAt(value) {
  if (!value) return 'Just posted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just posted';
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatMessageTime(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDueDate(value) {
  if (!value) return 'No due date';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return date.toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function statusTone(status) {
  const tones = {
    OPEN: 'neutral',
    IN_PROGRESS: 'warm',
    COMPLETED: 'success',
    CANCELLED: 'muted'
  };
  return tones[status] || 'neutral';
}

function roleLabel(value) {
  return value === 'FREELANCER' ? 'Freelancer Studio' : value === 'CLIENT' ? 'Client Control' : 'Guest View';
}

function describeClientDelivery(task) {
  if (!task.acceptedFreelancerName) {
    return 'Waiting for a freelancer to be approved.';
  }

  const progress = task.progressPercent ?? 0;
  if (task.status === 'COMPLETED') {
    return `${task.acceptedFreelancerName} finished this task and marked it 100% complete.`;
  }

  if (progress > 0) {
    return `${task.acceptedFreelancerName} has started work and completed ${progress}% so far.`;
  }

  return `${task.acceptedFreelancerName} accepted this task and can now start updating progress.`;
}

function paymentTone(status) {
  if (status === 'COMPLETED') return 'success';
  if (status === 'INITIATED') return 'warm';
  return 'neutral';
}

function describePaymentStatus(payment) {
  if (!payment) return 'No payout prepared yet.';
  if (payment.status === 'COMPLETED') {
    return `${payment.paymentMethod.replace('_', ' ')} released securely under ${payment.transactionReference}.`;
  }
  if (payment.status === 'INITIATED') {
    return `Prepared via ${payment.paymentMethod.replace('_', ' ')} and waiting for client verification.`;
  }
  return 'Payment status unavailable.';
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' }
];

function DashboardStat({ label, value, helper }) {
  return (
    <article className="stat-card">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="progress-track" aria-hidden="true">
      <span className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="field-error">{message}</p>;
}

function createEmptyMilestoneDraft() {
  return { title: '', dueDate: '' };
}

function MilestonePlanner({ milestones, onChange, onAdd, onRemove }) {
  return (
    <div className="milestone-planner">
      <div className="milestone-planner-head">
        <div>
          <span className="mini-eyebrow">Milestones</span>
          <strong>Plan the delivery steps</strong>
        </div>
        <button type="button" className="ghost-button compact-button" onClick={onAdd}>
          Add step
        </button>
      </div>
      <div className="milestone-draft-list">
        {milestones.map((milestone, index) => (
          <div key={`draft-${index}`} className="milestone-draft-row">
            <span className="milestone-draft-index">{String(index + 1).padStart(2, '0')}</span>
            <input
              placeholder="Milestone title"
              value={milestone.title}
              onChange={(event) => onChange(index, 'title', event.target.value)}
            />
            <input
              type="date"
              value={milestone.dueDate}
              onChange={(event) => onChange(index, 'dueDate', event.target.value)}
            />
            <button
              type="button"
              className="ghost-button compact-button"
              onClick={() => onRemove(index)}
              disabled={milestones.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskMilestones({ milestones, mode = 'client', updatingMilestoneIds = {}, onToggle }) {
  if (!Array.isArray(milestones) || !milestones.length) return null;

  const completedCount = milestones.filter((milestone) => milestone.status === 'COMPLETED').length;

  return (
    <div className={`task-milestones ${mode === 'freelancer' ? 'interactive' : ''}`}>
      <div className="task-milestones-head">
        <div>
          <span className="mini-eyebrow">Milestone flow</span>
          <strong>{completedCount}/{milestones.length} complete</strong>
        </div>
        <span className="task-milestones-summary">
          {completedCount === milestones.length ? 'Ready to wrap' : 'Delivery in motion'}
        </span>
      </div>
      <div className="task-milestones-list">
        {milestones.map((milestone) => {
          const completed = milestone.status === 'COMPLETED';
          return (
            <article key={milestone.id} className={`task-milestone-card ${completed ? 'complete' : ''}`}>
              <div className="task-milestone-copy">
                <span className="task-milestone-step">Step {milestone.sortOrder}</span>
                <strong>{milestone.title}</strong>
                <small>{formatDueDate(milestone.dueDate)}</small>
              </div>
              <div className="task-milestone-side">
                <span className={`task-milestone-status ${completed ? 'complete' : 'pending'}`}>
                  {completed ? 'Completed' : 'Pending'}
                </span>
                {mode === 'freelancer' && onToggle && (
                  <button
                    type="button"
                    className={completed ? 'ghost-button compact-button' : 'compact-button'}
                    disabled={!!updatingMilestoneIds[milestone.id]}
                    onClick={() => onToggle(milestone.id, !completed)}
                  >
                    {updatingMilestoneIds[milestone.id]
                      ? 'Saving...'
                      : completed
                        ? 'Mark Pending'
                        : 'Mark Complete'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function normalizeFullName(value) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function isStrongPassword(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
}

function validateRegisterForm(form) {
  const errors = {};
  const normalizedName = normalizeFullName(form.fullName || '');
  const normalizedEmail = (form.email || '').trim().toLowerCase();

  if (!normalizedName) {
    errors.fullName = 'Full name cannot be blank.';
  } else if (normalizedName.split(' ').length < 2) {
    errors.fullName = 'Enter first name and last name.';
  }

  if (!normalizedEmail) {
    errors.email = 'Email cannot be blank.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!form.password) {
    errors.password = 'Password cannot be blank.';
  } else if (!isStrongPassword(form.password)) {
    errors.password = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirm password cannot be blank.';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!form.role) {
    errors.role = 'Please choose a role.';
  }

  return { errors, normalizedName, normalizedEmail };
}

function validateLoginForm(form) {
  const errors = {};
  if (!form.email.trim()) {
    errors.email = 'Email cannot be blank.';
  }
  if (!form.password) {
    errors.password = 'Password cannot be blank.';
  }
  return errors;
}

function validateResetForm(form) {
  const errors = {};
  if (!form.newPassword) {
    errors.newPassword = 'Password cannot be blank.';
  } else if (!isStrongPassword(form.newPassword)) {
    errors.newPassword = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirm password cannot be blank.';
  } else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

function TaskConversation({ task, currentUserEmail, messages, draft, loading, sending, onDraftChange, onSend }) {
  const items = Array.isArray(messages) ? messages : [];

  return (
    <div className="conversation-panel">
      <div className="conversation-header">
        <div>
          <span className="mini-eyebrow">Task chat</span>
          <strong>{task.acceptedFreelancerName ? `${task.clientName} and ${task.acceptedFreelancerName}` : 'Accepted task conversation'}</strong>
        </div>
        <span className="conversation-status">{loading ? 'Syncing...' : `${items.length} messages`}</span>
      </div>

      <div className="message-thread">
        {items.length ? (
          items.map((message) => {
            const mine = message.senderName && currentUserEmail && task.acceptedFreelancerEmail
              ? (message.senderName === task.acceptedFreelancerName && currentUserEmail === task.acceptedFreelancerEmail) ||
                (message.senderName === task.clientName && currentUserEmail !== task.acceptedFreelancerEmail)
              : false;

            return (
              <div key={message.id} className={`message-bubble ${mine ? 'mine' : 'theirs'}`}>
                <span className="message-author">{message.senderName}</span>
                <p>{message.content}</p>
                <small>{formatMessageTime(message.createdAt)}</small>
              </div>
            );
          })
        ) : (
          <div className="empty-state compact">
            <p>Start the conversation here so the client and freelancer can coordinate on this task.</p>
          </div>
        )}
      </div>

      <form
        className="message-composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSend(task);
        }}
      >
        <textarea
          placeholder="Write an update, ask a question, or coordinate next steps..."
          value={draft}
          onChange={(event) => onDraftChange(task.id, event.target.value)}
        />
        <button type="submit" disabled={sending || !draft.trim()}>
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

function getResetTokenFromUrl() {
  return new URLSearchParams(window.location.search).get('resetToken') || '';
}

function AppHeader({ token, role, email, onLogout }) {
  const brandStream = [
    'Ink wash interface',
    'Verified delivery flow',
    'Client and talent sync',
    'Secure release workflow',
    'FreelanceX preview mode'
  ];

  return (
    <header className="topbar-shell">
      {!token && (
        <div className="brand-ticker" aria-hidden="true">
          <div className="brand-ticker-track">
            {[...brandStream, ...brandStream].map((item, index) => (
              <span key={`${item}-${index}`} className="brand-ticker-item">
                <span className="brand-ticker-dot" />
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark brand-mark-freelancex" aria-hidden="true">
            <span className="fx-stroke fx-stroke-left" />
            <span className="fx-stroke fx-stroke-right" />
            <span className="fx-core fx-core-one" />
            <span className="fx-core fx-core-two" />
            <span className="fx-orbit fx-orbit-one" />
            <span className="fx-orbit fx-orbit-two" />
          </div>
          <div className="brand-copy">
            <div className="brand-copy-row">
              <strong>FreelanceX</strong>
              <span className="brand-badge">Ink Wash Preview</span>
            </div>
            <p>Calmer interface, sharper trust cues, and one premium workspace for freelance delivery.</p>
          </div>
        </div>

        <div className="topbar-actions">
          {token ? (
            <>
              <div className="topbar-chip">
                <span className="chip-label">Workspace</span>
                <strong>{roleLabel(role)}</strong>
              </div>
              <div className="topbar-chip subtle">
                <span className="chip-label">Signed in as</span>
                <strong>{email || 'workspace@marketplace'}</strong>
              </div>
              <button type="button" className="ghost-button topbar-button" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <div className="brand-live-panel" aria-hidden="true">
              <div className="brand-live-cluster">
                <div className="brand-mini-logo">
                  <span className="mini-logo-ring" />
                  <span className="mini-logo-core" />
                  <span className="mini-logo-core mini-logo-core-two" />
                </div>
                <div className="brand-live-copy">
                  <span className="chip-label">Brand mood</span>
                  <strong>Quiet, premium, professional</strong>
                </div>
              </div>

              <div className="topbar-chip subtle topbar-chip-signal">
                <span className="chip-label">Wordmark</span>
                <strong>FreelanceX in motion</strong>
              </div>

              <div className="topbar-chip subtle topbar-chip-activity">
                <span className="chip-label">Palette</span>
                <strong>Charcoal, cool gray, ivory, steel blue</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.token) || '');
  const [role, setRole] = useState(localStorage.getItem(STORAGE_KEYS.role) || '');
  const [email, setEmail] = useState(localStorage.getItem(STORAGE_KEYS.email) || '');
  const [fullName, setFullName] = useState(localStorage.getItem(STORAGE_KEYS.fullName) || '');
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [resetToken, setResetToken] = useState(() => getResetTokenFromUrl());

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CLIENT'
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    budget: '',
    milestones: [createEmptyMilestoneDraft()]
  });
  const [ownedTaskIds, setOwnedTaskIds] = useState(() => readJson(STORAGE_KEYS.ownedTaskIds, []));
  const [appliedTaskIds, setAppliedTaskIds] = useState(() => readJson(STORAGE_KEYS.appliedTaskIds, []));
  const [registerErrors, setRegisterErrors] = useState({});
  const [loginErrors, setLoginErrors] = useState({});
  const [resetErrors, setResetErrors] = useState({});
  const [taskApplications, setTaskApplications] = useState({});
  const [progressInputs, setProgressInputs] = useState({});
  const [updatingTaskIds, setUpdatingTaskIds] = useState({});
  const [payments, setPayments] = useState([]);
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [creatingPaymentTaskIds, setCreatingPaymentTaskIds] = useState({});
  const [confirmingPaymentIds, setConfirmingPaymentIds] = useState({});
  const [updatingMilestoneIds, setUpdatingMilestoneIds] = useState({});
  const [taskMessages, setTaskMessages] = useState({});
  const [messageDrafts, setMessageDrafts] = useState({});
  const [loadingMessageTaskIds, setLoadingMessageTaskIds] = useState({});
  const [sendingMessageTaskIds, setSendingMessageTaskIds] = useState({});

  const normalizeEmail = (value) => value.trim().toLowerCase();
  const selectedAudience = registerForm.role;
  const audienceHighlights = selectedAudience === 'CLIENT'
    ? [
        'Publish a task and keep it visible only on your own client board.',
        'Review freelancer applications and accept the right person.',
        'Track delivery progress and completion without leaving the dashboard.'
      ]
    : [
        'See all active tasks posted by clients across the marketplace.',
        'Apply quickly and keep your proposal pipeline in one place.',
        'Update exact task progress once a client accepts your application.'
      ];

  function clearAuthFeedback() {
    setAuthNotice('');
    setRegisterErrors({});
    setLoginErrors({});
    setResetErrors({});
  }

  function applyTaskUpdateLocally(updatedTask) {
    setTasks((current) =>
      current.map((task) => (task.id === updatedTask.id ? { ...task, ...updatedTask } : task))
    );
    setProgressInputs((current) => ({
      ...current,
      [updatedTask.id]: updatedTask.progressPercent ?? 0
    }));
  }

  function mapAuthError(message, fallbackField = 'password') {
    const text = (message || '').toLowerCase();
    if (text.includes('full name') || text.includes('name')) return { fullName: message };
    if (text.includes('already exists') || text.includes('already registered')) return { email: message };
    if (text.includes('email')) return { email: message };
    if (text.includes('confirm password')) return { confirmPassword: message };
    if (text.includes('password')) return { [fallbackField]: message };
    return { [fallbackField]: message || 'Something went wrong. Please try again.' };
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ownedTaskIds, JSON.stringify(ownedTaskIds));
  }, [ownedTaskIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.appliedTaskIds, JSON.stringify(appliedTaskIds));
  }, [appliedTaskIds]);

  useEffect(() => {
    const syncResetToken = () => setResetToken(getResetTokenFromUrl());
    window.addEventListener('popstate', syncResetToken);
    return () => window.removeEventListener('popstate', syncResetToken);
  }, []);

  async function refreshTasks(showFailureMessage = false) {
    setLoadingTasks(true);
    try {
      const data = await fetchTasks(token);
      setTasks(Array.isArray(data) ? data : data.content || []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setTasks([]);
      if (showFailureMessage) {
        setMessage('We could not load marketplace tasks just now.');
      }
    } finally {
      setLoadingTasks(false);
    }
  }

  async function refreshPayments(showFailureMessage = false) {
    if (!token) {
      setPayments([]);
      return;
    }

    try {
      const data = await fetchPayments(token);
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      if (showFailureMessage) {
        setMessage('We could not load payment status just now.');
      }
    }
  }

  useEffect(() => {
    refreshTasks(true);
  }, [token]);

  useEffect(() => {
    refreshPayments(false);
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const interval = window.setInterval(() => {
      refreshTasks(false);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [token]);

  const marketplaceTasks = useMemo(() => tasks, [tasks]);
  const ownedTasks = useMemo(
    () => marketplaceTasks.filter((task) => ownedTaskIds.includes(task.id)),
    [marketplaceTasks, ownedTaskIds]
  );
  const openTasks = useMemo(
    () => marketplaceTasks.filter((task) => task.status === 'OPEN' && !appliedTaskIds.includes(task.id)),
    [marketplaceTasks, appliedTaskIds]
  );
  const activeTasks = useMemo(
    () => marketplaceTasks.filter((task) => task.status === 'IN_PROGRESS'),
    [marketplaceTasks]
  );
  const completedTasks = useMemo(
    () => marketplaceTasks.filter((task) => task.status === 'COMPLETED'),
    [marketplaceTasks]
  );
  const proposalTasks = useMemo(
    () => marketplaceTasks.filter((task) => appliedTaskIds.includes(task.id)),
    [marketplaceTasks, appliedTaskIds]
  );

  const activeFreelancerProjects = useMemo(
    () =>
      activeTasks.map((task) => ({
        ...task,
        clientLabel: task.clientName || (task.clientId ? `Client ${String(task.clientId).slice(0, 8)}` : 'Client workspace'),
        progress: task.progressPercent ?? 0
      })),
    [activeTasks]
  );
  const completedFreelancerProjects = useMemo(
    () =>
      completedTasks.map((task) => ({
        ...task,
        clientLabel: task.clientName || (task.clientId ? `Client ${String(task.clientId).slice(0, 8)}` : 'Client workspace'),
        progress: task.progressPercent ?? 100
      })),
    [completedTasks]
  );
  const myActiveFreelancerProjects = useMemo(
    () => activeFreelancerProjects.filter((task) => task.acceptedFreelancerEmail === email),
    [activeFreelancerProjects, email]
  );
  const myCompletedFreelancerProjects = useMemo(
    () => completedFreelancerProjects.filter((task) => task.acceptedFreelancerEmail === email),
    [completedFreelancerProjects, email]
  );

  const freelancerAverageProgress = myActiveFreelancerProjects.length
    ? Math.round(myActiveFreelancerProjects.reduce((total, task) => total + task.progress, 0) / myActiveFreelancerProjects.length)
    : 0;
  const freelancerDisplayName = fullName || 'Freelancer workspace';

  const clientPortfolio = useMemo(() => marketplaceTasks, [marketplaceTasks]);
  const acceptedClientTasks = useMemo(
    () => clientPortfolio.filter((task) => task.acceptedFreelancerName),
    [clientPortfolio]
  );
  const clientLiveDeliveries = useMemo(
    () => clientPortfolio.filter((task) => task.acceptedFreelancerName && task.status === 'IN_PROGRESS'),
    [clientPortfolio]
  );
  const clientCompletedDeliveries = useMemo(
    () => clientPortfolio.filter((task) => task.acceptedFreelancerName && task.status === 'COMPLETED'),
    [clientPortfolio]
  );
  const clientAverageProgress = clientLiveDeliveries.length
    ? Math.round(clientLiveDeliveries.reduce((sum, task) => sum + Number(task.progressPercent ?? 0), 0) / clientLiveDeliveries.length)
    : 0;
  const connectedFreelancerTasks = useMemo(
    () => [...myActiveFreelancerProjects, ...myCompletedFreelancerProjects],
    [myActiveFreelancerProjects, myCompletedFreelancerProjects]
  );
  const connectedClientTasks = useMemo(
    () => acceptedClientTasks,
    [acceptedClientTasks]
  );
  const pendingClientApplications = useMemo(
    () =>
      clientPortfolio.flatMap((task) =>
        (taskApplications[task.id] || [])
          .filter((application) => application.status === 'PENDING')
          .map((application) => ({ ...application, taskTitle: task.title }))
      ),
    [clientPortfolio, taskApplications]
  );
  const paymentsByTaskId = useMemo(
    () => Object.fromEntries(payments.map((payment) => [payment.taskId, payment])),
    [payments]
  );
  const releasedPaymentCount = useMemo(
    () => payments.filter((payment) => payment.status === 'COMPLETED').length,
    [payments]
  );

  useEffect(() => {
    if (!token || role !== 'CLIENT' || !marketplaceTasks.length) {
      if (role !== 'CLIENT') setTaskApplications({});
      return undefined;
    }

    let ignore = false;
    Promise.all(
      marketplaceTasks.map(async (task) => {
        const applications = await fetchTaskApplications(token, task.id);
        return [task.id, Array.isArray(applications) ? applications : []];
      })
    ).then((entries) => {
      if (!ignore) {
        setTaskApplications(Object.fromEntries(entries));
      }
    });

    return () => {
      ignore = true;
    };
  }, [token, role, marketplaceTasks]);

  useEffect(() => {
    if (!token) return undefined;

    const connectedTasks = role === 'FREELANCER' ? connectedFreelancerTasks : role === 'CLIENT' ? connectedClientTasks : [];
    if (!connectedTasks.length) return undefined;

    let ignore = false;
    Promise.all(
      connectedTasks.map(async (task) => {
        const messages = await fetchTaskMessages(token, task.id);
        return [task.id, Array.isArray(messages) ? messages : []];
      })
    ).then((entries) => {
      if (!ignore) {
        setTaskMessages((current) => ({ ...current, ...Object.fromEntries(entries) }));
      }
    });

    return () => {
      ignore = true;
    };
  }, [token, role, connectedFreelancerTasks, connectedClientTasks]);

  async function handleRegister(event) {
    event.preventDefault();
    clearAuthFeedback();

    const { errors, normalizedName, normalizedEmail } = validateRegisterForm(registerForm);
    if (Object.keys(errors).length) {
      setRegisterErrors(errors);
      return;
    }

    const response = await register({
      fullName: normalizedName,
      email: normalizedEmail,
      password: registerForm.password,
      role: registerForm.role
    });

    if (response.ok && response.data.token) {
      const data = response.data;
      setToken(data.token);
      setRole(data.role);
      setEmail(data.email);
      setFullName(data.fullName || '');
      localStorage.setItem(STORAGE_KEYS.token, data.token);
      localStorage.setItem(STORAGE_KEYS.role, data.role);
      localStorage.setItem(STORAGE_KEYS.email, data.email);
      localStorage.setItem(STORAGE_KEYS.fullName, data.fullName || '');
      setMessage(`Welcome aboard, ${data.role === 'FREELANCER' ? 'your studio is ready.' : 'your client desk is ready.'}`);
      setRegisterForm({ fullName: '', email: '', password: '', confirmPassword: '', role: 'CLIENT' });
      return;
    }

    setRegisterErrors(mapAuthError(response.data.message || 'Register failed', 'password'));
  }

  async function handleLogin(event) {
    event.preventDefault();
    clearAuthFeedback();

    const errors = validateLoginForm(loginForm);
    if (Object.keys(errors).length) {
      setLoginErrors(errors);
      return;
    }

    const response = await login({ ...loginForm, email: normalizeEmail(loginForm.email) });

    if (response.ok && response.data.token) {
      const data = response.data;
      setToken(data.token);
      setRole(data.role);
      setEmail(data.email);
      setFullName(data.fullName || '');
      localStorage.setItem(STORAGE_KEYS.token, data.token);
      localStorage.setItem(STORAGE_KEYS.role, data.role);
      localStorage.setItem(STORAGE_KEYS.email, data.email);
      localStorage.setItem(STORAGE_KEYS.fullName, data.fullName || '');
      setMessage(`Welcome back. Your ${data.role === 'FREELANCER' ? 'freelancer workspace' : 'client command desk'} is ready.`);
      return;
    }

    setLoginErrors(mapAuthError(response.data.message || 'Login failed', 'password'));
  }

  async function handleForgotPassword() {
    clearAuthFeedback();

    const normalizedEmail = normalizeEmail(loginForm.email);
    if (!normalizedEmail) {
      setLoginErrors({ email: 'Enter your email first so we know where to send the reset link.' });
      return;
    }

    const response = await requestPasswordReset({ email: normalizedEmail });
    if (response.ok) {
      setAuthNotice(response.data.message || 'If your account exists, we sent a reset link to your email.');
      return;
    }

    setLoginErrors(mapAuthError(response.data.message || 'Could not send reset email right now.', 'email'));
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    clearAuthFeedback();

    const errors = validateResetForm(resetForm);
    if (Object.keys(errors).length) {
      setResetErrors(errors);
      return;
    }

    const response = await resetPassword({
      token: resetToken,
      newPassword: resetForm.newPassword
    });

    if (response.ok) {
      setAuthNotice(response.data.message || 'Password reset successful. You can log in now.');
      setResetForm({ newPassword: '', confirmPassword: '' });
      window.history.replaceState({}, '', '/');
      setResetToken('');
      return;
    }

    setResetErrors(mapAuthError(response.data.message || 'Reset password failed', 'newPassword'));
  }

  async function handleTaskCreate(event) {
    event.preventDefault();
    const milestones = (taskForm.milestones || [])
      .map((milestone) => ({
        title: milestone.title.trim(),
        dueDate: milestone.dueDate || null
      }))
      .filter((milestone) => milestone.title);
    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      budget: Number(taskForm.budget),
      milestones
    };
    const data = await createTask(token, payload);
    if (data.id) {
      setOwnedTaskIds((current) => (current.includes(data.id) ? current : [...current, data.id]));
      setMessage('Task created and added to your client board.');
      setTaskForm({
        title: '',
        description: '',
        budget: '',
        milestones: [createEmptyMilestoneDraft()]
      });
      await refreshTasks(false);
    } else {
      setMessage(data.message || 'Task creation failed');
    }
  }

  function updateMilestoneDraft(index, field, value) {
    setTaskForm((current) => ({
      ...current,
      milestones: current.milestones.map((milestone, milestoneIndex) =>
        milestoneIndex === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  }

  function addMilestoneDraft() {
    setTaskForm((current) => ({
      ...current,
      milestones: [...current.milestones, createEmptyMilestoneDraft()]
    }));
  }

  function removeMilestoneDraft(index) {
    setTaskForm((current) => ({
      ...current,
      milestones: current.milestones.length === 1
        ? current.milestones
        : current.milestones.filter((_, milestoneIndex) => milestoneIndex !== index)
    }));
  }

  async function handleApply(taskId) {
    const data = await applyTask(token, taskId, {
      proposal: 'I can take this on with clear milestones, quick updates, and reliable delivery.',
      bidAmount: 100
    });
    if (data.id) {
      setAppliedTaskIds((current) => (current.includes(taskId) ? current : [...current, taskId]));
      setMessage('Proposal sent. It now appears in your freelancer pipeline.');
    } else {
      setMessage(data.message || 'Apply failed');
    }
  }

  async function handleAcceptApplication(applicationId) {
    const data = await acceptApplication(token, applicationId);
    if (data.id) {
      setMessage(`${data.freelancerName} is now handling this task.`);
      await refreshTasks(false);
    } else {
      setMessage(data.message || 'Could not accept this freelancer yet.');
    }
  }

  function handleLogout() {
    setToken('');
    setRole('');
    setEmail('');
    setFullName('');
    setMessage('You have been logged out.');
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.role);
    localStorage.removeItem(STORAGE_KEYS.email);
    localStorage.removeItem(STORAGE_KEYS.fullName);
  }

  async function adjustProgress(taskId, delta) {
    const currentTask = myActiveFreelancerProjects.find((task) => task.id === taskId);
    const next = Math.min(100, Math.max(0, (currentTask?.progress ?? 0) + delta));
    setUpdatingTaskIds((current) => ({ ...current, [taskId]: true }));
    try {
      const data = await updateTaskProgress(token, taskId, next);
      if (data.id) {
        applyTaskUpdateLocally(data);
        setMessage(next >= 100 ? 'Task marked completed and moved to your completed flow.' : `Task progress updated to ${next}%.`);
        await refreshTasks(false);
      } else {
        setMessage(data.message || 'Could not update task progress.');
      }
    } finally {
      setUpdatingTaskIds((current) => ({ ...current, [taskId]: false }));
    }
  }

  async function submitProgress(taskId) {
    const currentTask = myActiveFreelancerProjects.find((task) => task.id === taskId);
    const rawValue = progressInputs[taskId] ?? currentTask?.progress ?? 0;
    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) {
      setMessage('Please enter a valid progress number between 0 and 100.');
      return;
    }
    const next = Math.min(100, Math.max(0, parsed));
    setUpdatingTaskIds((current) => ({ ...current, [taskId]: true }));
    try {
      const data = await updateTaskProgress(token, taskId, next);
      if (data.id) {
        applyTaskUpdateLocally(data);
        setMessage(next >= 100 ? 'Task marked completed and moved to your completed flow.' : `Exact task progress updated to ${next}%.`);
        await refreshTasks(false);
      } else {
        setMessage(data.message || 'Could not update task progress.');
      }
    } finally {
      setUpdatingTaskIds((current) => ({ ...current, [taskId]: false }));
    }
  }

  async function handleMilestoneToggle(taskId, milestoneId, completed) {
    setUpdatingMilestoneIds((current) => ({ ...current, [milestoneId]: true }));
    try {
      const data = await updateMilestoneStatus(token, taskId, milestoneId, completed);
      if (data.id) {
        applyTaskUpdateLocally(data);
        setMessage(completed ? 'Milestone marked complete and client progress updated live.' : 'Milestone moved back to pending.');
        await refreshTasks(false);
      } else {
        setMessage(data.message || 'Could not update this milestone yet.');
      }
    } finally {
      setUpdatingMilestoneIds((current) => ({ ...current, [milestoneId]: false }));
    }
  }

  function updatePaymentDraft(taskId, field, value) {
    setPaymentDrafts((current) => ({
      ...current,
      [taskId]: {
        amount: String(current[taskId]?.amount ?? ''),
        paymentMethod: current[taskId]?.paymentMethod || 'UPI',
        ...current[taskId],
        [field]: value
      }
    }));
  }

  async function handleCreatePayment(task) {
    const draft = paymentDrafts[task.id] || {
      amount: String(task.budget ?? ''),
      paymentMethod: 'UPI'
    };
    const amount = Number(draft.amount || task.budget || 0);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      setMessage('Enter a valid payment amount before preparing the release.');
      return;
    }

    setCreatingPaymentTaskIds((current) => ({ ...current, [task.id]: true }));
    try {
      const data = await createPayment(token, {
        taskId: task.id,
        amount,
        paymentMethod: draft.paymentMethod || 'UPI'
      });

      if (data.id) {
        setMessage(`Secure payout prepared for ${task.acceptedFreelancerName}. Verify once to release the funds.`);
        await refreshPayments(false);
      } else {
        setMessage(data.message || 'Could not prepare payment right now.');
      }
    } finally {
      setCreatingPaymentTaskIds((current) => ({ ...current, [task.id]: false }));
    }
  }

  async function handleConfirmPayment(paymentId) {
    setConfirmingPaymentIds((current) => ({ ...current, [paymentId]: true }));
    try {
      const data = await confirmPayment(token, paymentId);
      if (data.id) {
        setMessage(`Payment ${data.transactionReference} was verified and released successfully.`);
        await refreshPayments(false);
      } else {
        setMessage(data.message || 'Could not release payment right now.');
      }
    } finally {
      setConfirmingPaymentIds((current) => ({ ...current, [paymentId]: false }));
    }
  }

  function updateMessageDraft(taskId, value) {
    setMessageDrafts((current) => ({
      ...current,
      [taskId]: value
    }));
  }

  async function loadMessages(taskId) {
    setLoadingMessageTaskIds((current) => ({ ...current, [taskId]: true }));
    try {
      const data = await fetchTaskMessages(token, taskId);
      setTaskMessages((current) => ({
        ...current,
        [taskId]: Array.isArray(data) ? data : []
      }));
    } finally {
      setLoadingMessageTaskIds((current) => ({ ...current, [taskId]: false }));
    }
  }

  async function handleSendMessage(task) {
    const content = messageDrafts[task.id]?.trim();
    if (!content) return;

    const receiverId = role === 'CLIENT' ? task.acceptedFreelancerId : task.clientId;
    if (!receiverId) {
      setMessage('This task is not connected to a messaging partner yet.');
      return;
    }

    setSendingMessageTaskIds((current) => ({ ...current, [task.id]: true }));
    try {
      const data = await sendTaskMessage(token, {
        taskId: task.id,
        receiverId,
        content
      });

      if (data.id) {
        setTaskMessages((current) => ({
          ...current,
          [task.id]: [...(current[task.id] || []), data]
        }));
        setMessageDrafts((current) => ({ ...current, [task.id]: '' }));
        setMessage('Message sent successfully.');
        await loadMessages(task.id);
      } else {
        setMessage(data.message || 'Could not send the message.');
      }
    } finally {
      setSendingMessageTaskIds((current) => ({ ...current, [task.id]: false }));
    }
  }

  const authForms = resetToken ? (
    <div className="auth-grid auth-grid-single">
      <form onSubmit={handleResetPassword} className="card auth-card auth-card-dark">
        <span className="eyebrow">Secure password reset</span>
        <h2>Create a new password</h2>
        <p className="support-text">This secure page came from your email reset link. Choose a strong new password to continue.</p>
        <input placeholder="New password" type="password" value={resetForm.newPassword} onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })} />
        <FieldError message={resetErrors.newPassword} />
        <input placeholder="Confirm new password" type="password" value={resetForm.confirmPassword} onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })} />
        <FieldError message={resetErrors.confirmPassword} />
        <button type="submit">Save New Password</button>
        {authNotice && <p className="auth-success">{authNotice}</p>}
      </form>
    </div>
  ) : (
    <div className="auth-grid">
      <form onSubmit={handleRegister} className="card auth-card">
        <span className="eyebrow">Create account</span>
        <h2>Start as client or freelancer</h2>
        <input
          placeholder="Full name"
          value={registerForm.fullName}
          onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
          onBlur={() => setRegisterForm((current) => ({ ...current, fullName: normalizeFullName(current.fullName) }))}
        />
        <FieldError message={registerErrors.fullName} />
        <input placeholder="Email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
        <FieldError message={registerErrors.email} />
        <input placeholder="Password" type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
        <FieldError message={registerErrors.password} />
        <input placeholder="Confirm password" type="password" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} />
        <FieldError message={registerErrors.confirmPassword} />
        <select value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}>
          <option value="CLIENT">CLIENT</option>
          <option value="FREELANCER">FREELANCER</option>
        </select>
        <FieldError message={registerErrors.role} />
        <button type="submit">Create Workspace</button>
        <p className="support-text">Already registered? Use the login form on the right with your email as the primary account ID.</p>
      </form>

      <form onSubmit={handleLogin} className="card auth-card auth-card-dark">
        <span className="eyebrow">Welcome back</span>
        <h2>Enter your dashboard</h2>
        <input placeholder="Email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
        <FieldError message={loginErrors.email} />
        <input placeholder="Password" type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
        <FieldError message={loginErrors.password} />
        <button type="submit">Login</button>
        <button type="button" className="text-button" onClick={handleForgotPassword}>
          Forgot password?
        </button>
        {authNotice && <p className="auth-success">{authNotice}</p>}
        <p className="support-text">Enter your email, click forgot password, and we will send a secure reset link to that inbox.</p>
      </form>
    </div>
  );

  const authView = (
    <section className="auth-shell">
      {authForms}

      <div className="hero-panel">
        <div className="hero-copy">
          <div className="auth-marquee" aria-hidden="true">
            <span>Launch faster</span>
            <span>Track every handoff</span>
            <span>Hire with clarity</span>
            <span>Deliver with proof</span>
          </div>
          <div className="hero-heading-stack">
            <span className="eyebrow">FreelanceX brand preview</span>
            <h1>Try a quieter, more premium identity for your freelance product before you deploy it.</h1>
            <p>
              This concept leans into a softer ink-wash palette, calmer spacing, and a cleaner logo-first presence so the product feels more professional and brand-led.
            </p>
          </div>
          <div className="hero-intelligence-strip" aria-hidden="true">
            <div className="hero-intelligence-item">
              <span className="intelligence-dot" />
              <div>
                <small>Client control</small>
                <strong>Private task boards</strong>
              </div>
            </div>
            <div className="hero-intelligence-item">
              <span className="intelligence-dot warm" />
              <div>
                <small>Live sync</small>
                <strong>Progress and chat linked</strong>
              </div>
            </div>
            <div className="hero-intelligence-item">
              <span className="intelligence-dot lime" />
              <div>
                <small>Delivery proof</small>
                <strong>Accepted work stays visible</strong>
              </div>
            </div>
          </div>
          <div className="hero-kicker-stack">
            <div className="hero-kicker-card hero-kicker-primary">
              <span className="mini-eyebrow">Brand promise</span>
              <strong>FreelanceX feels less noisy, more trusted, and more ready for serious client work.</strong>
            </div>
            <div className="hero-kicker-card">
              <span className="mini-eyebrow">Experience</span>
              <strong>A wordmark-led identity with calmer color energy and subtler motion.</strong>
            </div>
          </div>
          <div className="hero-motion-cluster" aria-hidden="true">
            <div className="motion-board">
              <div className="motion-board-glow" />
              <div className="motion-grid-overlay" />
              <div className="motion-badge badge-top">
                <span className="badge-dot" />
                <strong>3 live applications</strong>
              </div>
              <div className="motion-badge badge-bottom">
                <span className="badge-dot success" />
                <strong>Delivery lane active</strong>
              </div>
              <div className="motion-card queue-card">
                <span className="mini-eyebrow">Task queue</span>
                <strong>UI polish sprint</strong>
                <div className="queue-lines">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="motion-card progress-card">
                <span className="mini-eyebrow">Progress sync</span>
                <strong>72% completed</strong>
                <div className="mini-progress">
                  <span />
                </div>
              </div>
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="luxury-orbit orbit-three" />
              <div className="signal-node node-one" />
              <div className="signal-node node-two" />
              <div className="signal-node node-three" />
              <div className="signal-node node-four" />
            </div>
            <div className="hero-status-strip">
              <div>
                <span className="mini-eyebrow">Client side</span>
                <strong>Post, review, accept</strong>
              </div>
              <div>
                <span className="mini-eyebrow">Freelancer side</span>
                <strong>Apply, deliver, update</strong>
              </div>
            </div>
          </div>
          <div className="audience-banner">
            <span className="audience-badge">{selectedAudience === 'CLIENT' ? 'Client flow selected' : 'Freelancer flow selected'}</span>
            <p>{selectedAudience === 'CLIENT' ? 'The content below is highlighting the client-side workflow.' : 'The content below is highlighting the freelancer-side workflow.'}</p>
          </div>
          <div className="hero-metrics-grid">
            <div className="hero-metric-card hero-metric-wide">
              <span className="mini-eyebrow">Response speed</span>
              <strong>Everything under one premium board</strong>
              <p>Tasks, proposals, chat, and progress stay connected instead of scattered across separate tools and tabs.</p>
            </div>
            <div className="hero-metric-card">
              <span className="mini-eyebrow">Visibility</span>
              <strong>Live status flow</strong>
              <p>Clients see movement. Freelancers show momentum. Both sides stay aligned without chasing updates.</p>
            </div>
          </div>
          <div className="hero-lower-stage">
            <div className="stage-grid" aria-hidden="true">
              <span className="stage-line line-one" />
              <span className="stage-line line-two" />
              <span className="stage-node stage-node-one" />
              <span className="stage-node stage-node-two" />
              <span className="stage-node stage-node-three" />
              <div className="stage-bubble bubble-client">Client brief</div>
              <div className="stage-bubble bubble-match">Best match</div>
              <div className="stage-bubble bubble-progress">Live 48%</div>
            </div>
            <div className="hero-points">
              <div>
                <span className="hero-point-icon">01</span>
                <strong>Post and manage tasks</strong>
                <span>Create briefs, track budget, and keep your own task board organized.</span>
              </div>
              <div>
                <span className="hero-point-icon">02</span>
                <strong>Review freelancer interest</strong>
                <span>See who applied, compare proposals, and accept the right freelancer.</span>
              </div>
              <div>
                <span className="hero-point-icon">03</span>
                <strong>Track delivery progress</strong>
                <span>Watch accepted tasks move from active work into completed delivery.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-showcase">
          <div className="illustration-card">
            <div className="hero-illustration" aria-hidden="true">
              <div className="scene-glow" />
              <div className="scene-ring scene-ring-one" />
              <div className="scene-ring scene-ring-two" />
              <div className="task-cloud task-cloud-one">
                <span>New task</span>
                <strong>Landing page redesign</strong>
              </div>
              <div className="task-cloud task-cloud-two">
                <span>Accepted</span>
                <strong>Progress 72%</strong>
              </div>
              <div className="workspace-blob" />
              <div className="desk-lamp">
                <span className="lamp-head" />
                <span className="lamp-beam" />
              </div>
              <div className="desk-surface" />
              <div className="laptop">
                <span className="laptop-screen" />
                <span className="laptop-base" />
              </div>
              <div className="chair" />
              <div className="avatar">
                <span className="avatar-head" />
                <span className="avatar-body" />
                <span className="avatar-arm" />
              </div>
              <div className="plant">
                <span className="plant-pot" />
                <span className="plant-leaf leaf-one" />
                <span className="plant-leaf leaf-two" />
              </div>
              <div className="paper-stack paper-one" />
              <div className="paper-stack paper-two" />
              <div className="cat-shape" />
            </div>
          </div>
          <div className="showcase-card showcase-premium-banner">
            <span className="eyebrow">Marketplace identity</span>
            <strong>Professional by default. Dynamic when it matters. Premium when it opens.</strong>
            <p>Designed to feel like a polished workflow product with richer motion, stronger hierarchy, and a more intentional operating rhythm.</p>
          </div>
          <div className="showcase-card showcase-primary">
            <span className="eyebrow">Workflow</span>
            <strong>One flow for the full task lifecycle</strong>
            <div className="workflow-list">
              <div className="workflow-step">
                <span className="workflow-dot" />
                <div>
                  <strong>Client posts a task</strong>
                  <p>The brief appears in the marketplace for every freelancer.</p>
                </div>
              </div>
              <div className="workflow-step">
                <span className="workflow-dot" />
                <div>
                  <strong>Freelancers apply</strong>
                  <p>Applications stay attached to the correct client task for review.</p>
                </div>
              </div>
              <div className="workflow-step">
                <span className="workflow-dot" />
                <div>
                  <strong>Progress updates sync live</strong>
                  <p>Both client and freelancer see the same delivery status and completion state.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="showcase-grid">
            <div className="showcase-card">
              <span className="metric">Clients</span>
              <small>Create, review, and control only their own workstream with total clarity.</small>
            </div>
            <div className="showcase-card">
              <span className="metric">Freelancers</span>
              <small>See open opportunities, apply with confidence, and show exact delivery momentum.</small>
            </div>
            <div className="showcase-card wide">
              <strong>Built around the full execution journey.</strong>
              <p>Everything here is connected to posting work, accepting applications, live collaboration, and tracking completion from start to finish.</p>
            </div>
          </div>
          <div className="floating-objects" aria-hidden="true">
            <span className="pill-connector connector-one" />
            <span className="pill-connector connector-two" />
            <div className="floating-pill pill-posted">Task posted</div>
            <div className="floating-pill pill-applied">Proposal sent</div>
            <div className="floating-pill pill-accepted">Accepted by client</div>
            <div className="floating-pill pill-progress">Progress 72%</div>
          </div>
          <div className="related-feed">
            {audienceHighlights.map((item) => (
              <div key={item} className="related-feed-item">
                <span className="feed-dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const freelancerView = (
    <>
      <section className="dashboard-hero freelancer">
        <div className="freelancer-hero-copy">
          <div className="freelancer-hero-marquee" aria-hidden="true">
            <span>Delivery studio</span>
            <span>Proposal radar</span>
            <span>Client sync active</span>
          </div>
          <div className="freelancer-visual-stage" aria-hidden="true">
            <div className="freelancer-stage-glow" />
            <div className="freelancer-stage-grid" />
            <div className="freelancer-stage-card stage-card-primary">
              <span className="mini-eyebrow">Active brief</span>
              <strong>Dashboard polish sprint</strong>
              <div className="stage-card-bars">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="freelancer-stage-card stage-card-secondary">
              <span className="mini-eyebrow">Delivery pace</span>
              <strong>{freelancerAverageProgress}% synced</strong>
            </div>
            <div className="freelancer-stage-chip chip-one">Client updates linked</div>
            <div className="freelancer-stage-chip chip-two">Proposal lane open</div>
            <div className="freelancer-stage-chip chip-three">Progress visible</div>
            <span className="freelancer-stage-node node-a" />
            <span className="freelancer-stage-node node-b" />
            <span className="freelancer-stage-node node-c" />
          </div>
          <div className="freelancer-hero-caption">
            <span className="eyebrow">Freelancer workspace</span>
            <p>Track accepted contracts, manage proposal momentum, and keep delivery visibility polished without a cluttered board.</p>
            <p className="support-text">Every newly posted client task is pulled into this marketplace board automatically.</p>
          </div>
          <div className="freelancer-hero-ribbon">
            <div className="freelancer-ribbon-card">
              <small>Active lanes</small>
              <strong>{myActiveFreelancerProjects.length} in delivery</strong>
            </div>
            <div className="freelancer-ribbon-card">
              <small>Pipeline</small>
              <strong>{proposalTasks.length} proposals live</strong>
            </div>
            <div className="freelancer-ribbon-card">
              <small>Average pace</small>
              <strong>{freelancerAverageProgress}% completion</strong>
            </div>
          </div>
        </div>
        <div className="identity-card freelancer-identity-card">
          <div className="freelancer-identity-top">
            <div>
              <span className="role-pill">{role}</span>
              <strong>{freelancerDisplayName}</strong>
              <strong>{email || 'freelancer@workspace'}</strong>
              <p>{myActiveFreelancerProjects.length} active delivery lanes</p>
            </div>
            <div className="freelancer-hero-radar" aria-hidden="true">
              <span className="freelancer-radar-ring ring-one" />
              <span className="freelancer-radar-ring ring-two" />
              <span className="freelancer-radar-ring ring-three" />
              <span className="freelancer-radar-core" />
              <span className="freelancer-radar-ping ping-one" />
              <span className="freelancer-radar-ping ping-two" />
            </div>
          </div>
          <div className="signal-grid freelancer-signal-grid">
            <div className="signal-tile">
              <span>Pipeline</span>
              <strong>{proposalTasks.length}</strong>
            </div>
            <div className="signal-tile">
              <span>Completed</span>
              <strong>{myCompletedFreelancerProjects.length}</strong>
            </div>
          </div>
          <div className="freelancer-command-rail" aria-hidden="true">
            <div className="freelancer-command-node">
              <span className="freelancer-command-dot" />
              <div>
                <small>Focus lane</small>
                <strong>Accepted work prioritized</strong>
              </div>
            </div>
            <div className="freelancer-command-node">
              <span className="freelancer-command-dot warm" />
              <div>
                <small>Progress console</small>
                <strong>Exact delivery updates</strong>
              </div>
            </div>
            <div className="freelancer-command-node">
              <span className="freelancer-command-dot lime" />
              <div>
                <small>Client channel</small>
                <strong>Task chat always attached</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stat-grid freelancer-stat-grid">
        <DashboardStat label="Active contracts" value={myActiveFreelancerProjects.length} helper="Accepted work currently in delivery." />
        <DashboardStat label="Completed tasks" value={myCompletedFreelancerProjects.length} helper="Work you have already wrapped up and delivered." />
        <DashboardStat label="Proposal pipeline" value={proposalTasks.length} helper="Opportunities you have already raised your hand for." />
        <DashboardStat label="Avg. progress" value={`${freelancerAverageProgress}%`} helper="A quick pulse on how close your active work is to delivery." />
      </section>

      <section className="dashboard-grid">
        <article className="card panel-wide freelancer-studio-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Accepted work</span>
              <h2>Current client engagements</h2>
            </div>
          </div>

          {myActiveFreelancerProjects.length ? (
            <div className="project-stack freelancer-project-stack">
              {myActiveFreelancerProjects.map((task) => (
                <article key={task.id} className="project-card freelancer-project-card">
                  <div className="project-header">
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.clientLabel}</p>
                    </div>
                    <span className={`status-badge ${statusTone(task.status)}`}>{task.status.replace('_', ' ')}</span>
                  </div>
                  <div className="freelancer-project-layout">
                    <div className="freelancer-project-main">
                      <p className="project-copy">{task.description}</p>
                      <div className="project-meta">
                        <span>{formatCurrency(task.budget)}</span>
                        <span>{task.progress}% complete</span>
                      </div>
                      <ProgressBar value={task.progress} />
                      <TaskMilestones
                        milestones={task.milestones}
                        mode="freelancer"
                        updatingMilestoneIds={updatingMilestoneIds}
                        onToggle={(milestoneId, completed) => handleMilestoneToggle(task.id, milestoneId, completed)}
                      />
                    </div>
                    <aside className="freelancer-control-dock">
                      <div className="freelancer-control-gauge" aria-hidden="true">
                        <div className="freelancer-gauge-ring" style={{ '--gauge-progress': `${task.progress}%` }} />
                        <strong>{task.progress}%</strong>
                        <span>Delivery pace</span>
                      </div>
                      {task.milestones?.length ? (
                        <div className="freelancer-milestone-console">
                          <span className="mini-eyebrow">Milestone-driven delivery</span>
                          <strong>Complete steps to keep client progress synced.</strong>
                          <p>Each finished milestone updates the task percentage automatically.</p>
                        </div>
                      ) : (
                        <>
                          <form
                            className="progress-editor freelancer-progress-editor"
                            onSubmit={(event) => {
                              event.preventDefault();
                              submitProgress(task.id);
                            }}
                          >
                            <label>
                              <span className="mini-eyebrow">Exact progress</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={progressInputs[task.id] ?? task.progress}
                                onChange={(event) =>
                                  setProgressInputs((current) => ({
                                    ...current,
                                    [task.id]: event.target.value
                                  }))
                                }
                              />
                            </label>
                            <button type="submit" disabled={!!updatingTaskIds[task.id]}>
                              {updatingTaskIds[task.id] ? 'Saving...' : 'Set Exact %'}
                            </button>
                          </form>
                          <div className="button-row freelancer-button-row">
                            <button type="button" className="ghost-button" disabled={!!updatingTaskIds[task.id]} onClick={() => adjustProgress(task.id, -5)}>
                              Lower
                            </button>
                            <button type="button" disabled={!!updatingTaskIds[task.id]} onClick={() => adjustProgress(task.id, 5)}>
                              {updatingTaskIds[task.id] ? 'Saving...' : 'Update Progress'}
                            </button>
                          </div>
                        </>
                      )}
                    </aside>
                  </div>
                  <TaskConversation
                    task={task}
                    currentUserEmail={email}
                    messages={taskMessages[task.id]}
                    draft={messageDrafts[task.id] || ''}
                    loading={!!loadingMessageTaskIds[task.id]}
                    sending={!!sendingMessageTaskIds[task.id]}
                    onDraftChange={updateMessageDraft}
                    onSend={handleSendMessage}
                  />
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No accepted contracts yet</h3>
              <p>When a client accepts your application or moves a task into delivery, it will show up here with progress tracking.</p>
            </div>
          )}
        </article>

        <article className="card freelancer-delivered-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Delivered</span>
              <h2>Completed tasks</h2>
            </div>
          </div>
          {myCompletedFreelancerProjects.length ? (
            <div className="mini-stack freelancer-lane-grid">
              {myCompletedFreelancerProjects.map((task) => (
                <div key={task.id} className="mini-card accent freelancer-mini-card freelancer-mini-card-success">
                  <strong>{task.title}</strong>
                  <span>{formatCurrency(task.budget)}</span>
                  <small>{task.clientLabel} | Completed</small>
                  <p>{task.description}</p>
                  <span className={`status-badge ${paymentTone(paymentsByTaskId[task.id]?.status)}`}>
                    {paymentsByTaskId[task.id]
                      ? paymentsByTaskId[task.id].status === 'COMPLETED'
                        ? 'Payment released'
                        : 'Awaiting verification'
                      : 'Awaiting client payout'}
                  </span>
                  {paymentsByTaskId[task.id]?.transactionReference && (
                    <small>Reference {paymentsByTaskId[task.id].transactionReference}</small>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <p>Completed work will move here once you finish an active task.</p>
            </div>
          )}
        </article>

        <article className="card freelancer-pipeline-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Pipeline</span>
              <h2>Applied proposals</h2>
            </div>
          </div>
          {proposalTasks.length ? (
            <div className="mini-stack freelancer-lane-grid">
              {proposalTasks.map((task) => (
                <div key={task.id} className="mini-card freelancer-mini-card">
                  <strong>{task.title}</strong>
                  <span>{formatCurrency(task.budget)}</span>
                  <small>{task.clientName || 'Client workspace'} | Posted {formatPostedAt(task.createdAt)}</small>
                  <p>{task.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <p>Your submitted proposals will appear here once you apply to open tasks.</p>
            </div>
          )}
        </article>

        <article className="card freelancer-opportunity-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Opportunity board</span>
              <h2>All client tasks</h2>
            </div>
            <button className="ghost-button compact-button" onClick={() => refreshTasks(true)}>Refresh tasks</button>
          </div>
          <p className="support-text">Last synced: {lastUpdated || 'Just now'}</p>
          <div className="mini-stack freelancer-opportunity-grid">
            {openTasks.map((task) => (
              <div key={task.id} className="mini-card freelancer-mini-card freelancer-opportunity-tile">
                <div className="freelancer-opportunity-top">
                  <strong>{task.title}</strong>
                  <span>{formatCurrency(task.budget)}</span>
                </div>
                <small>{task.clientName || 'Client workspace'} | Posted {formatPostedAt(task.createdAt)}</small>
                <p>{task.description}</p>
                <div className="freelancer-opportunity-footer">
                  <div className="freelancer-opportunity-signal" aria-hidden="true">
                    <span className="opportunity-dot" />
                    Open for proposals
                  </div>
                  <button onClick={() => handleApply(task.id)}>Apply</button>
                </div>
              </div>
            ))}
            {!openTasks.length && (
              <div className="empty-state compact">
                <p>No open tasks are available right now. Check back after clients publish new briefs.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </>
  );

  const clientView = (
    <>
      <section className="dashboard-hero client">
        <div className="client-hero-copy">
          <div className="client-hero-marquee" aria-hidden="true">
            <span>Board intelligence</span>
            <span>Live freelancer sync</span>
            <span>Premium delivery visibility</span>
          </div>
          <div className="client-visual-stage" aria-hidden="true">
            <div className="client-stage-glow" />
            <div className="client-stage-grid" />
            <div className="client-stage-card client-stage-card-main">
              <span className="mini-eyebrow">Client board</span>
              <strong>Approved design sprint</strong>
              <div className="client-stage-bars">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="client-stage-card client-stage-card-side">
              <span className="mini-eyebrow">Review lane</span>
              <strong>{pendingClientApplications.length} waiting</strong>
            </div>
            <div className="client-stage-chip client-chip-one">Freelancer sync active</div>
            <div className="client-stage-chip client-chip-two">Progress visible</div>
            <div className="client-stage-chip client-chip-three">Brief accepted</div>
            <span className="client-stage-node client-node-a" />
            <span className="client-stage-node client-node-b" />
            <span className="client-stage-node client-node-c" />
          </div>
          <div className="client-hero-caption">
            <span className="eyebrow">Client control room</span>
            <p>
              Post tasks, monitor accepted work, and keep your budget, approvals, and delivery movement aligned inside one sharper client cockpit.
            </p>
          </div>
          <div className="client-hero-ribbon">
            <div className="client-ribbon-card">
              <small>Execution lane</small>
              <strong>{clientLiveDeliveries.length} active deliveries</strong>
            </div>
            <div className="client-ribbon-card">
              <small>Response lane</small>
              <strong>{pendingClientApplications.length} pending approvals</strong>
            </div>
            <div className="client-ribbon-card">
              <small>Budget view</small>
              <strong>{formatCurrency(clientPortfolio.reduce((sum, task) => sum + Number(task.budget || 0), 0))}</strong>
            </div>
          </div>
        </div>
        <div className="identity-card client-identity-card">
          <div className="client-identity-top">
            <div>
              <span className="role-pill">{role}</span>
              <strong>{fullName || 'Client workspace'}</strong>
              <strong>{email || 'client@workspace'}</strong>
              <p>{clientPortfolio.length} briefs in your visible board</p>
            </div>
            <div className="client-hero-orbit" aria-hidden="true">
              <span className="client-orbit-ring ring-one" />
              <span className="client-orbit-ring ring-two" />
              <span className="client-orbit-core" />
            </div>
          </div>
          <div className="signal-grid client-signal-grid">
            <div className="signal-tile">
              <span>Accepted</span>
              <strong>{acceptedClientTasks.length}</strong>
            </div>
            <div className="signal-tile">
              <span>Avg. progress</span>
              <strong>{clientAverageProgress}%</strong>
            </div>
          </div>
          <div className="client-command-rail" aria-hidden="true">
            <div className="command-node">
              <span className="command-dot" />
              <div>
                <small>Brief posted</small>
                <strong>Client-side private board</strong>
              </div>
            </div>
            <div className="command-node">
              <span className="command-dot warm" />
              <div>
                <small>Accepted talent</small>
                <strong>Freelancer updates linked</strong>
              </div>
            </div>
            <div className="command-node">
              <span className="command-dot lime" />
              <div>
                <small>Completion pace</small>
                <strong>Progress visible in real time</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stat-grid client-stat-grid">
        <DashboardStat label="Visible briefs" value={clientPortfolio.length} helper="Tasks currently on your board or in the marketplace snapshot." />
        <DashboardStat label="In progress" value={clientLiveDeliveries.length} helper="Work already underway with freelancers." />
        <DashboardStat label="Completed" value={clientCompletedDeliveries.length} helper="Delivered tasks ready for review or closeout." />
        <DashboardStat label="Payments released" value={releasedPaymentCount} helper="Secure payout releases completed from your client desk." />
        <DashboardStat label="Budget tracked" value={formatCurrency(clientPortfolio.reduce((sum, task) => sum + Number(task.budget || 0), 0))} helper="Combined value of the work currently visible on your board." />
      </section>

      {!!acceptedClientTasks.length && (
        <section className="card acceptance-panel client-premium-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Client notifications</span>
              <h2>Accepted and active tasks</h2>
            </div>
          </div>
          <div className="mini-stack client-notification-stack">
            {acceptedClientTasks.map((task) => (
              <div key={task.id} className="mini-card accent client-mini-card">
                <strong>{task.title}</strong>
                <p>{describeClientDelivery(task)}</p>
                <span>{task.progressPercent ?? 0}% complete</span>
                <ProgressBar value={task.progressPercent ?? 0} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!!pendingClientApplications.length && (
        <section className="card acceptance-panel client-premium-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Client notifications</span>
              <h2>New freelancer responses</h2>
            </div>
          </div>
          <div className="mini-stack client-notification-stack">
            {pendingClientApplications.map((application) => (
              <div key={application.id} className="mini-card client-mini-card">
                <strong>{application.taskTitle}</strong>
                <p>
                  <strong>{application.freelancerName}</strong> has accepted interest in this task and is waiting for your approval.
                </p>
                <span>{formatCurrency(application.bidAmount)}</span>
                <p>{application.proposal}</p>
                <button onClick={() => handleAcceptApplication(application.id)}>Accept Freelancer</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!clientLiveDeliveries.length && (
        <section className="card acceptance-panel client-premium-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Live progress</span>
              <h2>Freelancers currently working</h2>
            </div>
          </div>
          <div className="project-stack client-progress-stack">
            {clientLiveDeliveries.map((task) => (
              <article key={task.id} className="project-card client-progress-card client-premium-project">
                <div className="project-header">
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.acceptedFreelancerName} is actively working on this brief.</p>
                  </div>
                  <span className={`status-badge ${statusTone(task.status)}`}>{task.progressPercent ?? 0}% done</span>
                </div>
                <div className="project-meta">
                  <span>{formatCurrency(task.budget)}</span>
                  <span>{describeClientDelivery(task)}</span>
                </div>
                <ProgressBar value={task.progressPercent ?? 0} />
                <TaskConversation
                  task={task}
                  currentUserEmail={email}
                  messages={taskMessages[task.id]}
                  draft={messageDrafts[task.id] || ''}
                  loading={!!loadingMessageTaskIds[task.id]}
                  sending={!!sendingMessageTaskIds[task.id]}
                  onDraftChange={updateMessageDraft}
                  onSend={handleSendMessage}
                />
              </article>
            ))}
          </div>
        </section>
      )}

      {!!clientCompletedDeliveries.length && (
        <section className="card acceptance-panel client-premium-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Payment release</span>
              <h2>Delivered work ready for payout</h2>
            </div>
          </div>
          <div className="project-stack payment-release-stack">
            {clientCompletedDeliveries.map((task) => {
              const payment = paymentsByTaskId[task.id];
              const paymentDraft = paymentDrafts[task.id] || {
                amount: String(task.budget ?? ''),
                paymentMethod: 'UPI'
              };

              return (
                <article key={task.id} className="project-card payment-release-card">
                  <div className="project-header">
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.acceptedFreelancerName} delivered this brief and is ready for payout.</p>
                    </div>
                    <span className={`status-badge ${paymentTone(payment?.status)}`}>
                      {payment ? payment.status.replace('_', ' ') : 'UNPAID'}
                    </span>
                  </div>
                  <div className="project-meta">
                    <span>{formatCurrency(task.budget)}</span>
                    <span>{describePaymentStatus(payment)}</span>
                  </div>
                  <div className="payment-release-layout">
                    <div className="payment-release-details">
                      <div className="payment-detail-chip">
                        <small>Freelancer</small>
                        <strong>{task.acceptedFreelancerName}</strong>
                      </div>
                      <div className="payment-detail-chip">
                        <small>Budget</small>
                        <strong>{formatCurrency(task.budget)}</strong>
                      </div>
                      {payment?.transactionReference && (
                        <div className="payment-detail-chip">
                          <small>Reference</small>
                          <strong>{payment.transactionReference}</strong>
                        </div>
                      )}
                    </div>
                    {payment ? (
                      <div className="payment-verify-panel">
                        <span className="mini-eyebrow">Secure release</span>
                        <strong>{payment.status === 'COMPLETED' ? 'Funds released and verified' : 'One verification step left'}</strong>
                        <p>{describePaymentStatus(payment)}</p>
                        {payment.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            disabled={!!confirmingPaymentIds[payment.id]}
                            onClick={() => handleConfirmPayment(payment.id)}
                          >
                            {confirmingPaymentIds[payment.id] ? 'Verifying...' : 'Verify & Release Payment'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="payment-setup-panel">
                        <label>
                          <span className="mini-eyebrow">Release amount</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={paymentDraft.amount}
                            onChange={(event) => updatePaymentDraft(task.id, 'amount', event.target.value)}
                          />
                        </label>
                        <label>
                          <span className="mini-eyebrow">Method</span>
                          <select
                            value={paymentDraft.paymentMethod}
                            onChange={(event) => updatePaymentDraft(task.id, 'paymentMethod', event.target.value)}
                          >
                            {PAYMENT_METHOD_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          disabled={!!creatingPaymentTaskIds[task.id]}
                          onClick={() => handleCreatePayment(task)}
                        >
                          {creatingPaymentTaskIds[task.id] ? 'Preparing...' : 'Prepare Secure Payment'}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="dashboard-grid">
        <form onSubmit={handleTaskCreate} className="card client-create-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Create</span>
              <h2>Post a new task</h2>
            </div>
          </div>
          <input placeholder="Project title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          <textarea placeholder="Describe the deliverable, context, and success criteria" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          <input placeholder="Budget" value={taskForm.budget} onChange={(e) => setTaskForm({ ...taskForm, budget: e.target.value })} />
          <MilestonePlanner
            milestones={taskForm.milestones}
            onChange={updateMilestoneDraft}
            onAdd={addMilestoneDraft}
            onRemove={removeMilestoneDraft}
          />
          <button type="submit">Publish Task</button>
        </form>

        <article className="card panel-wide client-board-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Portfolio</span>
              <h2>Your client task board</h2>
            </div>
            <button className="ghost-button compact-button" onClick={() => refreshTasks(true)}>Refresh board</button>
          </div>
          <div className="project-stack">
            {clientPortfolio.map((task) => (
              <article key={task.id} className="project-card client-project-card">
                <div className="project-header">
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.acceptedFreelancerName ? `Accepted by ${task.acceptedFreelancerName}` : 'Waiting for a freelancer'}</p>
                  </div>
                  <span className={`status-badge ${statusTone(task.status)}`}>{task.status.replace('_', ' ')}</span>
                </div>
                <p className="project-copy">{task.description}</p>
                <div className="project-meta">
                  <span>{formatCurrency(task.budget)}</span>
                  <span>
                    {task.acceptedFreelancerName
                      ? describeClientDelivery(task)
                      : task.status === 'OPEN'
                        ? 'Awaiting applications'
                        : task.status === 'IN_PROGRESS'
                          ? 'Freelancer engaged'
                          : 'Ready for review'}
                  </span>
                </div>
                <div className="project-meta">
                  <span>{task.progressPercent ?? 0}% complete</span>
                  <span>{task.status === 'COMPLETED' ? 'Finished' : (task.progressPercent ?? 0) > 0 ? 'Started by freelancer and updating live' : 'Accepted and waiting for the first progress update'}</span>
                </div>
                <TaskMilestones milestones={task.milestones} />
                <ProgressBar value={task.progressPercent ?? 0} />
                {!!taskApplications[task.id]?.length && (
                  <div className="mini-stack embedded-stack">
                    {taskApplications[task.id].map((application) => (
                      <div key={application.id} className="mini-card">
                        <strong>{application.freelancerName}</strong>
                        <span>{application.status}</span>
                        <p>{application.proposal}</p>
                        {application.status === 'PENDING' && (
                          <button onClick={() => handleAcceptApplication(application.id)}>Accept Freelancer</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {!clientPortfolio.length && (
              <div className="empty-state">
                <h3>No tasks yet</h3>
                <p>Publish your first brief to start building a client delivery board.</p>
              </div>
            )}
          </div>
        </article>

        <article className="card client-notes-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Live snapshot</span>
              <h2>Delivery notes</h2>
            </div>
          </div>
          <div className="mini-stack">
            <div className="mini-card accent">
              <strong>Freelancer alignment</strong>
              <p>Once applications are accepted, active jobs move into your in-progress lane automatically.</p>
            </div>
            <div className="mini-card">
              <strong>Budget confidence</strong>
              <p>Keep tighter control by comparing posted budgets against active briefs before approving payment.</p>
            </div>
            <div className="mini-card">
              <strong>Communication flow</strong>
              <p>This layout is ready for future message, review, and milestone widgets as the app grows.</p>
            </div>
          </div>
        </article>
      </section>
    </>
  );

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <div className="container">
        <AppHeader token={token} role={role} email={email} onLogout={handleLogout} />
        {token && message && <p className="flash-banner">{message}</p>}
        {!token ? authView : role === 'FREELANCER' ? freelancerView : clientView}
        {loadingTasks && token && <p className="support-text">Refreshing the latest marketplace tasks...</p>}
      </div>
    </main>
  );
}
