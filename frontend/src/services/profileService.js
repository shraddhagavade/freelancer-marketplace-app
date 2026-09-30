import api from './api';

export async function getMyProfile() {
  const response = await api.get('/users/me');
  return response.data;
}

export async function getFreelancerProfile() {
  const response = await api.get('/freelancers/me');
  return response.data;
}

export async function updateFreelancerProfile(data) {
  const response = await api.put('/freelancers/me', data);
  return response.data;
}

export async function getClientProfile() {
  const response = await api.get('/clients/me');
  return response.data;
}

export async function updateClientProfile(data) {
  const response = await api.put('/clients/me', data);
  return response.data;
}

export async function getFreelancerById(id) {
  const response = await api.get(`/freelancers/${id}`);
  return response.data;
}

export async function browseFreelancers({ keyword, experienceLevel, availability, maxRate, page = 0, size = 12 } = {}) {
  const response = await api.get('/freelancers', {
    params: { keyword, experienceLevel, availability, maxRate, page, size },
  });
  return response.data;
}

export async function getPublicClientProfile(userId) {
  const response = await api.get(`/clients/${userId}/public`);
  return response.data;
}

export async function getCategories() {
  const response = await api.get('/categories');
  return response.data;
}

export async function getSkills() {
  const response = await api.get('/skills');
  return response.data;
}

// ===== Portfolio / work samples =====

export async function getFreelancerPortfolio(userId) {
  const response = await api.get(`/freelancers/${userId}/portfolio`);
  return response.data;
}

export async function addPortfolioItem(data) {
  const response = await api.post('/portfolio', data);
  return response.data;
}

export async function updatePortfolioItem(id, data) {
  const response = await api.put(`/portfolio/${id}`, data);
  return response.data;
}

export async function deletePortfolioItem(id) {
  await api.delete(`/portfolio/${id}`);
}
