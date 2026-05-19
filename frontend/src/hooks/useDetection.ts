import { useState } from 'react';
import { detectionApi } from '../services/api';
import type { DetectionResult } from '../types';

export function useDetection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detect = async (imageUri: string, confidence = 0.5) => {
    setLoading(true); setError(null);
    try {
      const data = await detectionApi.detect(imageUri, confidence);
      setResult(data);
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Error al detectar objetos';
      setError(msg); throw e;
    } finally {
      setLoading(false);
    }
  };

  return { detect, loading, result, error, reset: () => { setResult(null); setError(null); } };
}
