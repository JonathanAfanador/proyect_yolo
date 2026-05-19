import axios from 'axios';
import { supabase } from './supabase';
import type { DetectionResult, RecognitionResult, RegisteredFace } from '../types';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 60000, // 60 segundos de timeout
  headers: {
    'Bypass-Tunnel-Reminder': 'true',
  }
});

// Adjunta JWT en cada request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// 🔍 Debug Logs Interceptor: Registra peticiones en la consola de Metro
api.interceptors.request.use((config) => {
  console.log(`📡 [API REQ] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, (error) => {
  console.log(`❌ [API REQ ERROR]`, error);
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  console.log(`✅ [API RES] ${response.config.method?.toUpperCase()} ${response.config.url} - Status ${response.status}`);
  return response;
}, (error) => {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail || error?.message;
  console.log(`❌ [API ERR] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status ${status || 'No Response'} - Detalle:`, detail);
  return Promise.reject(error);
});

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),
  register: (email: string, password: string, full_name: string) =>
    api.post('/api/v1/auth/register', { email, password, full_name }),
};

// ── YOLO Object Detection ────────────────────────────────────
export const detectionApi = {
  detect: async (imageUri: string, confidence = 0.5, classes?: string[]) => {
    const form = new FormData();
    form.append('file', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
    form.append('confidence', String(confidence));
    if (classes?.length) form.append('classes_filter', JSON.stringify(classes));
    const { data } = await api.post<DetectionResult>('/api/v1/detect/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  getHistory: (limit = 20, offset = 0) =>
    api.get('/api/v1/detect/history', { params: { limit, offset } }),
  getClasses: () => api.get('/api/v1/detect/classes'),
  getDetail: (id: string) => api.get(`/api/v1/detect/${id}`),
};

// ── Facial Recognition ────────────────────────────────────────
export const facesApi = {
  register: async (imageUri: string, personName: string) => {
    const form = new FormData();
    form.append('file', { uri: imageUri, name: 'face.jpg', type: 'image/jpeg' } as any);
    form.append('person_name', personName);
    const { data } = await api.post('/api/v1/faces/register', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  recognize: async (imageUri: string) => {
    const form = new FormData();
    form.append('file', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
    const { data } = await api.post<RecognitionResult>('/api/v1/faces/recognize', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  listRegistered: () => api.get<RegisteredFace[]>('/api/v1/faces/registered'),
  deleteFace: (id: string) => api.delete(`/api/v1/faces/registered/${id}`),
  getHistory: (limit = 20, offset = 0) => api.get('/api/v1/faces/history', { params: { limit, offset } }),
};
