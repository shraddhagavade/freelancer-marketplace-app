import api from './api';

export async function submitProposal(projectId, data) {
  const response = await api.post(`/projects/${projectId}/proposals`, data);
  return response.data;
}

export async function getProjectProposals(projectId) {
  const response = await api.get(`/projects/${projectId}/proposals`);
  return response.data;
}

export async function getMyProposals() {
  const response = await api.get('/proposals/my');
  return response.data;
}

export async function acceptProposal(id) {
  const response = await api.post(`/proposals/${id}/accept`);
  return response.data;
}

export async function rejectProposal(id) {
  const response = await api.post(`/proposals/${id}/reject`);
  return response.data;
}

export async function withdrawProposal(id) {
  const response = await api.post(`/proposals/${id}/withdraw`);
  return response.data;
}
