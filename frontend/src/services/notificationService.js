import api from './api';

export async function getNotifications(limit = 20) {
  const response = await api.get(`/notifications?limit=${limit}`);
  return response.data;
}

export async function getUnreadCount() {
  const response = await api.get('/notifications/unread-count');
  return response.data?.count ?? 0;
}

export async function markNotificationRead(id) {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.post('/notifications/read-all');
}
