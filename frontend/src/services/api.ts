import axios from 'axios';
import { supabase } from './supabase';
import type { DetectionResult, RecognitionResult, RegisteredFace } from '../types';

const api = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL });

// Adjunta JWT en cada request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
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
  getHistory: (limit = 20) => api.get('/api/v1/faces/history', { params: { limit } }),
};
