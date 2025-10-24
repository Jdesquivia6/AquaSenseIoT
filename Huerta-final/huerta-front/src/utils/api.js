import axios from 'axios';

const BACKEND_URL = 'http://localhost:4000';
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) =>
    api.post('/register', {
      usuario: data.username,
      password: data.password,
      rol_id: 1, 
    }),
  login: (data) =>
    api.post('/login', {
      usuario: data.username,
      password: data.password,
    }),
  //getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  // update: (id, data) => api.put(`/users/${id}`, data),
  // delete: (id) => api.delete(`/users/${id}`),
  updateRole: (id, role_id) => api.put(`/users/${id}/role`, { role_id }),
};

// Devices API
export const devicesAPI = {
  // getAll: () => api.get('/devices'),
  // create: (data) => api.post('/devices', data),
  // update: (id, data) => api.put(`/devices/${id}`, data),
  // delete: (id) => api.delete(`/devices/${id}`),
};

// Humidity API
export const humidityAPI = {
  // create: (data) => api.post('/humidity', data),
  // getByDevice: (deviceId, limit = 50) => api.get(`/humidity/${deviceId}`, { params: { limit } }),
};

export const alertsAPI = {
  getAll: async () => {
    return { data: [] }; // inicia vacío
  },
  resolve: async (id) => {
    console.log(`✅ Alerta ${id} marcada como resuelta`);
    return { data: { success: true } };
  },
};

// Stats API
export const statsAPI = {
  // getDashboard: () => api.get('/stats/dashboard'),
  // getHistory: (deviceId = null, days = 7) => api.get('/stats/history', { params: { device_id: deviceId, days } }),
};

export const humedadAPI = {
  // create: (data) => api.post('/humedad', data),
  // getByDevice: (deviceId) => api.get(`/humedad/${deviceId}`),
};

export const reportsAPI = {
  getReport: async (type, filter) => {
    try {
      let url = '/reports/humedad';

      if (type === '1') url = '/reports/humedad';
      else if (type === '2') url = '/reports/otra';

      const response = await api.get(url, { params: { filter } });

      // Si la respuesta es un objeto, lo convertimos a array
      const data = Array.isArray(response.data.data)
        ? response.data.data
        : [response.data.data];

      // Aplicar filtro simple (si filter tiene texto)
      const filtered = filter
        ? data.filter((item) =>
            Object.values(item).some((val) =>
              String(val).toLowerCase().includes(filter.toLowerCase())
            )
          )
        : data;

      return { data: filtered };
    } catch (error) {
      console.error("Error en reportsAPI:", error.message);
      return { data: [] };
    }
  },
};



