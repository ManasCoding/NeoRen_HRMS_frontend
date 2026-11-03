import axios from 'axios';

// const API_BASE_URL = 'http://localhost:7000/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:7000/api' : 'https://citicon-hrms-backend-03wr.onrender.com/api');


const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (loginId, password, isAdmin, employeeType) => {
  try {
    const payload = { loginId, password, isAdmin };
    if (employeeType) payload.employeeType = employeeType;
    const response = await api.post('/login', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Network error' };
  }
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
