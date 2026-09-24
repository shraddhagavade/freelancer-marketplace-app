import api from './api';

// Escrow summary totals for the current user (both roles)
export async function getPaymentSummary() {
  const response = await api.get('/payments/summary');
  return response.data;
}

// Payments where the current user is the paying client
export async function getClientPayments() {
  const response = await api.get('/payments/client');
  return response.data;
}

// Payments where the current user is the receiving freelancer
export async function getFreelancerPayments() {
  const response = await api.get('/payments/freelancer');
  return response.data;
}

// Escrow status for a single project (may be null if none yet)
export async function getProjectPayment(projectId) {
  const response = await api.get(`/payments/project/${projectId}`);
  return response.data;
}

// Whether real PayPal checkout is enabled on the backend
export async function isPayPalEnabled() {
  const response = await api.get('/payments/paypal/enabled');
  return response.data?.enabled === true;
}

// Start PayPal checkout for a project; returns the approval URL to redirect to
export async function createPayPalOrder(projectId) {
  const response = await api.post(`/payments/paypal/create/${projectId}`);
  return response.data?.approvalUrl;
}

// Capture the PayPal payment after returning from approval
export async function capturePayPalOrder(projectId) {
  const response = await api.post(`/payments/paypal/capture/${projectId}`);
  return response.data;
}
