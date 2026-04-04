import React, { useEffect, useMemo, useState } from 'react';
import { acceptApplication, applyTask, createTask, fetchTaskApplications, fetchTaskMessages, fetchTasks, login, register, requestPasswordReset, resetPassword, sendTaskMessage, updateTaskProgress } from './api';

const STORAGE_KEYS = {
  token: 'token',
  role: 'role',
  email: 'email',
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
    'Client briefs live',
    'Freelancer proposals moving',
    'Progress updates synced',
    'Task chat connected',
    'Payments and delivery aligned'
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
          <div className="brand-mark brand-mark-orbit brand-mark-premium" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="brand-copy">
            <div className="brand-copy-row">
              <strong>Freelancer Marketplace</strong>
              <span className="brand-badge">Flow OS</span>
            </div>
            <p>Post tasks, manage applications, and track project delivery in one place.</p>
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
                  <span className="chip-label">Live network</span>
                  <strong>Clients and freelancers active</strong>
                </div>
              </div>

              <div className="topbar-chip subtle topbar-chip-signal">
                <span className="chip-label">Marketplace pulse</span>
                <strong>Briefs, bids, delivery</strong>
              </div>

              <div className="topbar-chip subtle topbar-chip-activity">
                <span className="chip-label">Now running</span>
                <strong>Real-time workflow sync</strong>
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
  const [taskForm, setTaskForm] = useState({ title: '', description: '', budget: '' });
  const [ownedTaskIds, setOwnedTaskIds] = useState(() => readJson(STORAGE_KEYS.ownedTaskIds, []));
  const [appliedTaskIds, setAppliedTaskIds] = useState(() => readJson(STORAGE_KEYS.appliedTaskIds, []));
  const [registerErrors, setRegisterErrors] = useState({});
  const [loginErrors, setLoginErrors] = useState({});
  const [resetErrors, setResetErrors] = useState({});
  const [taskApplications, setTaskApplications] = useState({});
  const [progressInputs, setProgressInputs] = useState({});
  const [updatingTaskIds, setUpdatingTaskIds] = useState({});
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

  useEffect(() => {
    refreshTasks(true);
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
      localStorage.setItem(STORAGE_KEYS.token, data.token);
      localStorage.setItem(STORAGE_KEYS.role, data.role);
      localStorage.setItem(STORAGE_KEYS.email, data.email);
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
      localStorage.setItem(STORAGE_KEYS.token, data.token);
      localStorage.setItem(STORAGE_KEYS.role, data.role);
      localStorage.setItem(STORAGE_KEYS.email, data.email);
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
    const payload = { ...taskForm, budget: Number(taskForm.budget) };
    const data = await createTask(token, payload);
    if (data.id) {
      setOwnedTaskIds((current) => (current.includes(data.id) ? current : [...current, data.id]));
      setMessage('Task created and added to your client board.');
      setTaskForm({ title: '', description: '', budget: '' });
      await refreshTasks(false);
    } else {
      setMessage(data.message || 'Task creation failed');
    }
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
    setMessage('You have been logged out.');
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.role);
    localStorage.removeItem(STORAGE_KEYS.email);
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
          <span className="eyebrow">Built for high-tempo freelance work</span>
          <h1>Run your freelance marketplace like a performance product, not a messy inbox.</h1>
          <p>
            A sharper workflow for clients and freelancers who want faster hiring, cleaner communication, and live delivery visibility from the first brief to the final handoff.
          </p>
          <div className="hero-kicker-stack">
            <div className="hero-kicker-card hero-kicker-primary">
              <span className="mini-eyebrow">Brand promise</span>
              <strong>One platform for posting, matching, tracking, and shipping work.</strong>
            </div>
            <div className="hero-kicker-card">
              <span className="mini-eyebrow">Experience</span>
              <strong>Bold, focused, and ready for real production teams.</strong>
            </div>
          </div>
          <div className="hero-motion-cluster" aria-hidden="true">
            <div className="motion-board">
              <div className="motion-board-glow" />
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
              <div className="signal-node node-one" />
              <div className="signal-node node-two" />
              <div className="signal-node node-three" />
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
            <div className="hero-metric-card">
              <span className="mini-eyebrow">Response speed</span>
              <strong>Under one board</strong>
              <p>Tasks, proposals, chat, and progress stay connected instead of scattered across tools.</p>
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
                <strong>Post and manage tasks</strong>
                <span>Create briefs, track budget, and keep your own task board organized.</span>
              </div>
              <div>
                <strong>Review freelancer interest</strong>
                <span>See who applied, compare proposals, and accept the right freelancer.</span>
              </div>
              <div>
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
            <strong>Professional by default. Dynamic when it matters.</strong>
            <p>Designed to feel like a premium workflow product with live movement, strong hierarchy, and cleaner operational focus.</p>
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
              <small>Create and manage only their own tasks and incoming applications.</small>
            </div>
            <div className="showcase-card">
              <span className="metric">Freelancers</span>
              <small>See all active opportunities, apply, and update exact delivery progress.</small>
            </div>
            <div className="showcase-card wide">
              <strong>Built around real task flow.</strong>
              <p>Everything here is connected to posting work, accepting applications, and tracking completion from start to finish.</p>
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
        <div>
          <span className="eyebrow">Freelancer workspace</span>
          <h1>Keep your client work moving with calm, visible progress.</h1>
          <p>
            Track accepted contracts, manage proposal momentum, and spot where your delivery energy should go next.
          </p>
          <p className="support-text">Every newly posted client task is pulled into this marketplace board automatically.</p>
        </div>
        <div className="identity-card">
          <span className="role-pill">{role}</span>
          <strong>{email || 'freelancer@workspace'}</strong>
          <p>{myActiveFreelancerProjects.length} active delivery lanes</p>
          <div className="signal-grid">
            <div className="signal-tile">
              <span>Pipeline</span>
              <strong>{proposalTasks.length}</strong>
            </div>
            <div className="signal-tile">
              <span>Completed</span>
              <strong>{myCompletedFreelancerProjects.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <DashboardStat label="Active contracts" value={myActiveFreelancerProjects.length} helper="Accepted work currently in delivery." />
        <DashboardStat label="Completed tasks" value={myCompletedFreelancerProjects.length} helper="Work you have already wrapped up and delivered." />
        <DashboardStat label="Proposal pipeline" value={proposalTasks.length} helper="Opportunities you have already raised your hand for." />
        <DashboardStat label="Avg. progress" value={`${freelancerAverageProgress}%`} helper="A quick pulse on how close your active work is to delivery." />
      </section>

      <section className="dashboard-grid">
        <article className="card panel-wide">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Accepted work</span>
              <h2>Current client engagements</h2>
            </div>
          </div>

          {myActiveFreelancerProjects.length ? (
            <div className="project-stack">
              {myActiveFreelancerProjects.map((task) => (
                <article key={task.id} className="project-card">
                  <div className="project-header">
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.clientLabel}</p>
                    </div>
                    <span className={`status-badge ${statusTone(task.status)}`}>{task.status.replace('_', ' ')}</span>
                  </div>
                  <p className="project-copy">{task.description}</p>
                  <div className="project-meta">
                    <span>{formatCurrency(task.budget)}</span>
                    <span>{task.progress}% complete</span>
                  </div>
                  <ProgressBar value={task.progress} />
                  <form
                    className="progress-editor"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitProgress(task.id);
                    }}
                  >
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
                    <button type="submit" disabled={!!updatingTaskIds[task.id]}>
                      {updatingTaskIds[task.id] ? 'Saving...' : 'Set Exact %'}
                    </button>
                  </form>
                  <div className="button-row">
                    <button type="button" className="ghost-button" disabled={!!updatingTaskIds[task.id]} onClick={() => adjustProgress(task.id, -5)}>
                      Lower
                    </button>
                    <button type="button" disabled={!!updatingTaskIds[task.id]} onClick={() => adjustProgress(task.id, 5)}>
                      {updatingTaskIds[task.id] ? 'Saving...' : 'Update Progress'}
                    </button>
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

        <article className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Delivered</span>
              <h2>Completed tasks</h2>
            </div>
          </div>
          {myCompletedFreelancerProjects.length ? (
            <div className="mini-stack">
              {myCompletedFreelancerProjects.map((task) => (
                <div key={task.id} className="mini-card accent">
                  <strong>{task.title}</strong>
                  <span>{formatCurrency(task.budget)}</span>
                  <small>{task.clientLabel} | Completed</small>
                  <p>{task.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <p>Completed work will move here once you finish an active task.</p>
            </div>
          )}
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Pipeline</span>
              <h2>Applied proposals</h2>
            </div>
          </div>
          {proposalTasks.length ? (
            <div className="mini-stack">
              {proposalTasks.map((task) => (
                <div key={task.id} className="mini-card">
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

        <article className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Opportunity board</span>
              <h2>All client tasks</h2>
            </div>
            <button className="ghost-button compact-button" onClick={() => refreshTasks(true)}>Refresh tasks</button>
          </div>
          <p className="support-text">Last synced: {lastUpdated || 'Just now'}</p>
          <div className="mini-stack">
            {openTasks.map((task) => (
              <div key={task.id} className="mini-card">
                <strong>{task.title}</strong>
                <span>{formatCurrency(task.budget)}</span>
                <small>{task.clientName || 'Client workspace'} | Posted {formatPostedAt(task.createdAt)}</small>
                <p>{task.description}</p>
                <button onClick={() => handleApply(task.id)}>Apply</button>
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
        <div>
          <span className="eyebrow">Client control room</span>
          <h1>See your freelance delivery pipeline at a glance.</h1>
          <p>
            Post tasks, watch active briefs move through execution, and keep a sharper handle on budget and delivery pace.
          </p>
        </div>
        <div className="identity-card">
          <span className="role-pill">{role}</span>
          <strong>{email || 'client@workspace'}</strong>
          <p>{clientPortfolio.length} briefs in your visible board</p>
          <div className="signal-grid">
            <div className="signal-tile">
              <span>Accepted</span>
              <strong>{acceptedClientTasks.length}</strong>
            </div>
            <div className="signal-tile">
              <span>Avg. progress</span>
              <strong>{clientAverageProgress}%</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <DashboardStat label="Visible briefs" value={clientPortfolio.length} helper="Tasks currently on your board or in the marketplace snapshot." />
        <DashboardStat label="In progress" value={clientLiveDeliveries.length} helper="Work already underway with freelancers." />
        <DashboardStat label="Completed" value={clientCompletedDeliveries.length} helper="Delivered tasks ready for review or closeout." />
        <DashboardStat label="Budget tracked" value={formatCurrency(clientPortfolio.reduce((sum, task) => sum + Number(task.budget || 0), 0))} helper="Combined value of the work currently visible on your board." />
      </section>

      {!!acceptedClientTasks.length && (
        <section className="card acceptance-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Client notifications</span>
              <h2>Accepted and active tasks</h2>
            </div>
          </div>
          <div className="mini-stack">
            {acceptedClientTasks.map((task) => (
              <div key={task.id} className="mini-card accent">
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
        <section className="card acceptance-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Client notifications</span>
              <h2>New freelancer responses</h2>
            </div>
          </div>
          <div className="mini-stack">
            {pendingClientApplications.map((application) => (
              <div key={application.id} className="mini-card">
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
        <section className="card acceptance-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Live progress</span>
              <h2>Freelancers currently working</h2>
            </div>
          </div>
          <div className="project-stack client-progress-stack">
            {clientLiveDeliveries.map((task) => (
              <article key={task.id} className="project-card client-progress-card">
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

      <section className="dashboard-grid">
        <form onSubmit={handleTaskCreate} className="card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Create</span>
              <h2>Post a new task</h2>
            </div>
          </div>
          <input placeholder="Project title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          <textarea placeholder="Describe the deliverable, context, and success criteria" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          <input placeholder="Budget" value={taskForm.budget} onChange={(e) => setTaskForm({ ...taskForm, budget: e.target.value })} />
          <button type="submit">Publish Task</button>
        </form>

        <article className="card panel-wide">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Portfolio</span>
              <h2>Your client task board</h2>
            </div>
            <button className="ghost-button compact-button" onClick={() => refreshTasks(true)}>Refresh board</button>
          </div>
          <div className="project-stack">
            {clientPortfolio.map((task) => (
              <article key={task.id} className="project-card">
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

        <article className="card">
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
