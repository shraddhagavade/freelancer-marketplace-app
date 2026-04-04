const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');
const DEFAULT_TASK_PAGE_SIZE = 100;

async function requestJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function register(payload) {
  return requestJson(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function login(payload) {
  return requestJson(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function requestPasswordReset(payload) {
  return requestJson(`${API}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function resetPassword(payload) {
  return requestJson(`${API}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function fetchTasks(token, size = DEFAULT_TASK_PAGE_SIZE) {
  const res = await fetch(`${API}/tasks?page=0&size=${size}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.json();
}

export async function createTask(token, payload) {
  const res = await requestJson(`${API}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return res.data;
}

export async function applyTask(token, taskId, payload) {
  const res = await requestJson(`${API}/tasks/${taskId}/apply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return res.data;
}

export async function fetchTaskApplications(token, taskId) {
  const res = await requestJson(`${API}/tasks/${taskId}/applications`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}

export async function acceptApplication(token, applicationId) {
  const res = await requestJson(`${API}/applications/${applicationId}/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}

export async function updateTaskProgress(token, taskId, progressPercent) {
  const res = await requestJson(`${API}/tasks/${taskId}/progress`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ progressPercent })
  });
  return res.data;
}

export async function updateMilestoneStatus(token, taskId, milestoneId, completed) {
  const res = await requestJson(`${API}/tasks/${taskId}/milestones/${milestoneId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ completed })
  });
  return res.data;
}

export async function fetchTaskMessages(token, taskId) {
  const res = await requestJson(`${API}/messages/task/${taskId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}

export async function sendTaskMessage(token, payload) {
  const res = await requestJson(`${API}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return res.data;
}

export async function fetchPayments(token) {
  const res = await requestJson(`${API}/payments`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}

export async function createPayment(token, payload) {
  const res = await requestJson(`${API}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return res.data;
}

export async function confirmPayment(token, paymentId) {
  const res = await requestJson(`${API}/payments/${paymentId}/confirm`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ confirmRelease: true })
  });
  return res.data;
}
