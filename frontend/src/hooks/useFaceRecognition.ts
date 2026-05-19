import { useState } from 'react';
import { facesApi } from '../services/api';
import type { RecognitionResult } from '../types';

export function useFaceRecognition() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognize = async (imageUri: string) => {
    setLoading(true); setError(null);
    try {
      const data = await facesApi.recognize(imageUri);
      setResult(data); return data;
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Error al reconocer rostro';
      setError(msg); throw e;
    } finally {
      setLoading(false);
    }
  };

  const registerFace = async (imageUri: string, name: string) => {
    setLoading(true); setError(null);
    try {
      return await facesApi.register(imageUri, name);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Error al registrar rostro';
      setError(msg); throw e;
    } finally {
      setLoading(false);
    }
  };

  return { recognize, registerFace, loading, result, error, reset: () => { setResult(null); setError(null); } };
}
