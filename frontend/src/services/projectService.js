import api from './api';

export async function getProjects(page = 0, size = 10) {
  const response = await api.get('/projects', { params: { page, size } });
  return response.data;
}

export async function searchProjects({ keyword, categoryId, minBudget, maxBudget, page = 0, size = 10 }) {
  const response = await api.get('/projects/search', {
    params: { keyword, categoryId, minBudget, maxBudget, page, size },
  });
  return response.data;
}

export async function getProject(id) {
  const response = await api.get(`/projects/${id}`);
  return response.data;
}

export async function createProject(data) {
  const response = await api.post('/projects', data);
  return response.data;
}

export async function getMyProjects() {
  const response = await api.get('/projects/my');
  return response.data;
}

export async function updateProjectStatus(id, status) {
  const response = await api.patch(`/projects/${id}/status`, { status });
  return response.data;
}
