import api from './api';

// Client leaves a review for a completed project
export async function createReview(projectId, { rating, comment }) {
  const response = await api.post(`/projects/${projectId}/reviews`, { rating, comment });
  return response.data;
}

// All reviews for a freelancer (by user id)
export async function getFreelancerReviews(freelancerId) {
  const response = await api.get(`/freelancers/${freelancerId}/reviews`);
  return response.data;
}

// The review for a specific project (null if none yet)
export async function getProjectReview(projectId) {
  const response = await api.get(`/projects/${projectId}/review`);
  return response.data;
}
