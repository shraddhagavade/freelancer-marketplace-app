import api from './api';

export async function sendMessage(recipientId, content) {
  const response = await api.post('/messages', { recipientId, content });
  return response.data;
}

export async function getConversations() {
  const response = await api.get('/messages/conversations');
  return response.data;
}

export async function getThread(otherUserId) {
  const response = await api.get(`/messages/thread/${otherUserId}`);
  return response.data;
}

export async function getUnreadMessageCount() {
  const response = await api.get('/messages/unread-count');
  return response.data?.count ?? 0;
}
