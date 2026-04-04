import axios from 'axios';

// Base URL (Vite proxy → backend)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Axios instance
const api = axios.create({
  baseURL: BASE_URL,
});

// ---------------- GLOBAL 401 HANDLER ----------------
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // FIXED: Use the new keys
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---------------- ERROR HELPER ----------------
const getFriendlyError = (error, fallbackMessage) => {
  if (error?.response?.status >= 500) {
    return 'Something went wrong, please try again';
  }
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    fallbackMessage
  );
};

// ---------------- AUTH HEADER ----------------
export function getAuthHeader() {
  // FIXED: Look for 'token' instead of 'mcp_token'
  const token = sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------- CHAT ----------------
export const sendChatMessage = async (message, role, sessionId) => {
  try {
    const response = await api.post('/chat', {
      message,
      role,
      session_id: sessionId
    }, {
      headers: { ...getAuthHeader() }
    });
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyError(error, 'Chat request failed.'));
  }
};

export const getChatHistory = async (sessionId) => {
  try {
    const response = await api.get('/chat/history', {
      params: { session_id: sessionId },
      headers: { ...getAuthHeader() }
    });
    return response.data.history || [];
  } catch (error) {
    console.error("Failed to fetch history", error);
    return [];
  }
};

export const clearChat = async (sessionId) => {
  try {
    const response = await api.get('/clear_chat', {
      params: { session_id: sessionId },
      headers: { ...getAuthHeader() }
    });
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyError(error, 'Failed to clear chat.'));
  }
};

// ---------------- DASHBOARD ----------------
export const getDashboardData = async () => {
  try {
    const response = await api.get('/dashboard', {
      headers: { ...getAuthHeader() }
    });
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyError(error, 'Failed to fetch dashboard data.'));
  }
};

export const getPatientAppointments = async () => {
  try {
    const response = await api.get('/appointments/patient', {
      headers: { ...getAuthHeader() }
    });
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyError(error, 'Failed to fetch appointments.'));
  }
};

export const getDoctorAppointments = async () => {
  try {
    const response = await api.get('/appointments/doctor', {
      headers: { ...getAuthHeader() }
    });
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyError(error, 'Failed to fetch appointments.'));
  }
};

export const getDoctorAvailability = async () => {
  try {
    const response = await api.get('/doctor/availability', {
      headers: { ...getAuthHeader() }
    });
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyError(error, 'Failed to fetch schedule.'));
  }
};

export const updateDoctorAvailability = async (schedule) => {
  try {
    const response = await api.post('/doctor/availability', { schedule }, {
      headers: { ...getAuthHeader() }
    });
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyError(error, 'Failed to update schedule.'));
  }
};

export const updateDoctorProfile = async (bio) => {
  try {
    // We mock this endpoint since it doesn't exist yet, but we structure it 
    // consistently with other API contracts. 
    // In reality, this would be: await api.post('/doctor/profile', { bio }, { headers: getAuthHeader() });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, bio });
      }, 500);
    });
  } catch (error) {
    throw new Error(getFriendlyError(error, 'Failed to update bio.'));
  }
};