import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

export interface NextDocumentNumberData {
  documentType: string;
  nextNumber: string;
  prefix: string;
  suffix?: string;
  dateFormat: string;
  nextSequence: number;
}

export function useDocumentNumber(documentType: string, propertyId: number = 1) {
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [data, setData] = useState<NextDocumentNumberData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    if (!documentType) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<NextDocumentNumberData>(
        `/documents/next-preview?documentType=${encodeURIComponent(documentType)}&propertyId=${propertyId}`
      );
      if (res.success && res.data) {
        const raw = res.data as any;
        const num = raw.documentNumber || raw.nextNumber || '';
        setData(res.data);
        setDocumentNumber(num);
      }
    } catch (err: any) {
      console.warn(`[useDocumentNumber] Failed to load preview for ${documentType}:`, err?.message);
      setError(err?.message || 'Failed to fetch document number');
      // Fallback preview while backend initialises
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      setDocumentNumber(`${documentType.slice(0, 3)}-${today}-0001`);
    } finally {
      setIsLoading(false);
    }
  }, [documentType, propertyId]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const generateNumber = useCallback(async (): Promise<string> => {
    try {
      const res = await api.post<NextDocumentNumberData>(
        `/documents/generate?documentType=${encodeURIComponent(documentType)}&propertyId=${propertyId}`
      );
      if (res.success && res.data) {
        const raw = res.data as any;
        const num = raw.documentNumber || raw.nextNumber || '';
        setDocumentNumber(num);
        return num;
      }
      return documentNumber;
    } catch (err) {
      return documentNumber;
    }
  }, [documentType, propertyId, documentNumber]);

  return {
    documentNumber,
    data,
    isLoading,
    error,
    refetch: fetchPreview,
    generateNumber,
  };
}
