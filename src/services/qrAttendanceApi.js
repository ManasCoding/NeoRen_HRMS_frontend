import api from './api';

// Public / Mobile Scanning Endpoints
export const getOfficeQr = async (baseUrl) => {
  const params = baseUrl ? { baseUrl } : {};
  const response = await api.get('/qr-attendance/office-qr', { params });
  return response.data;
};

export const verifyQrToken = async (qrToken) => {
  const response = await api.post('/qr-attendance/verify-token', { qrToken });
  return response.data;
};

export const scanQrAttendance = async (qrToken, deviceCredential, clientInfo = {}) => {
  const response = await api.post('/qr-attendance/scan', {
    qrToken,
    deviceCredential,
    clientInfo
  });
  return response.data;
};

export const registerDeviceAndCheckIn = async ({ qrToken, loginId, password, clientInfo = {} }) => {
  const response = await api.post('/qr-attendance/register-and-checkin', {
    qrToken,
    loginId,
    password,
    clientInfo
  });
  return response.data;
};

// Admin Endpoints
export const getAdminDevices = async (params = {}) => {
  const response = await api.get('/qr-attendance/admin/devices', { params });
  return response.data;
};

export const getAdminDeviceById = async (id) => {
  const response = await api.get(`/qr-attendance/admin/devices/${id}`);
  return response.data;
};

export const blockDevice = async (id) => {
  const response = await api.put(`/qr-attendance/admin/devices/${id}/block`);
  return response.data;
};

export const unblockDevice = async (id) => {
  const response = await api.put(`/qr-attendance/admin/devices/${id}/unblock`);
  return response.data;
};

export const resetDevice = async (id) => {
  const response = await api.post(`/qr-attendance/admin/devices/${id}/reset`);
  return response.data;
};

export const removeDevice = async (id) => {
  const response = await api.delete(`/qr-attendance/admin/devices/${id}`);
  return response.data;
};

export const getQrStats = async () => {
  const response = await api.get('/qr-attendance/admin/stats');
  return response.data;
};

export const getQrSettings = async () => {
  const response = await api.get('/qr-attendance/admin/settings');
  return response.data;
};

export const updateQrSettings = async (data) => {
  const response = await api.put('/qr-attendance/admin/settings', data);
  return response.data;
};
