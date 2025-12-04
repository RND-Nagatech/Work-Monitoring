import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Avoid redirect loop on login endpoint
      const url = error.config?.url || '';
      console.error('401 Unauthorized:', error);
      if (!url.includes('/auth/login')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { oldPassword: currentPassword, newPassword });
    return response.data;
  },
};

// Division APIs
export const divisionApi = {
  getAll: async () => {
    const response = await api.get('/divisi');
    return response.data;
  },
  create: async (data: { nama_divisi: string; kode_divisi: string }) => {
    const response = await api.post('/divisi', data);
    return response.data;
  },
  update: async (id: string, data: { nama_divisi: string; kode_divisi: string }) => {
    const response = await api.put(`/divisi/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/divisi/${id}`);
    return response.data;
  },
};

// Employee APIs
export const employeeApi = {
  getAll: async () => {
    const response = await api.get('/pegawai');
    return response.data;
  },
  create: async (data: { nama_pegawai: string; kode_pegawai: string; kode_divisi: string }) => {
    const response = await api.post('/pegawai', data);
    return response.data;
  },
  update: async (id: string, data: { nama_pegawai: string; kode_pegawai: string; kode_divisi: string }) => {
    const response = await api.put(`/pegawai/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/pegawai/${id}`);
    return response.data;
  },
};

// User APIs
export const userApi = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  create: async (data: { username: string; password: string; role: string; pegawai_id?: string }) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (id: string, data: { username: string; role: string; pegawai_id?: string }) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Task APIs
export interface TaskFilters {
  division?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const taskApi = {
  getAll: async (filters?: TaskFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  },
  getAvailable: async () => {
    const response = await api.get('/tasks/available');
    return response.data;
  },
  create: async (data: {
    kode_pekerjaan: string;
    kode_divisi: string;
    deskripsi: string;
    poin: number;
    deadline: string;
  }) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{
    kode_pekerjaan: string;
    kode_divisi: string;
    deskripsi: string;
    status_pekerjaan: string;
    poin: number;
    deadline: string;
    pic?: string;
  }>) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
  take: async (id: string) => {
    const response = await api.post(`/tasks/${id}/take`);
    return response.data;
  },
  finish: async (id: string) => {
    const response = await api.post(`/tasks/${id}/finish`);
    return response.data;
  },
};

// Dashboard APIs
export const dashboardApi = {
  getAdminDashboard: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
  getEmployeeDashboard: async () => {
    const response = await api.get('/dashboard/employee');
    return response.data;
  },
};

// Report APIs
export const reportApi = {
  getReport: async (filters?: { division?: string; start?: string; end?: string; filter?: 'top_points' | 'top_tasks' }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/report?${params.toString()}`);
    return response.data;
  },
};
