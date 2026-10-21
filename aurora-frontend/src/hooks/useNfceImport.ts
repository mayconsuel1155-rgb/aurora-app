import { useCallback, useEffect, useState } from 'react';
import { findNfceByAccessKey, getApiErrorMessage, getNfceRateLimit, importNfce, previewNfce } from '../api/client';
import type { NfceAccessKeyResult, NfceImportResult, NfcePreview, NfceRateLimit, NfceReviewItem } from '../types/nfce';

export function useNfceImport() {
  const [preview, setPreview] = useState<NfcePreview | null>(null);
  const [keyResult, setKeyResult] = useState<NfceAccessKeyResult | null>(null);
  const [items, setItems] = useState<NfceReviewItem[]>([]);
  const [result, setResult] = useState<NfceImportResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [rateLimit, setRateLimit] = useState<NfceRateLimit | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [lastQrCode, setLastQrCode] = useState('');

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds(current => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remainingSeconds]);

  const loadPreview = async (value: string) => {
    setError('');
    setPreview(null);
    setKeyResult(null);
    setRateLimit(null);
    setRemainingSeconds(0);
    setLastQrCode(value);
    setIsLoading(true);
    try {
      const normalizedKey = value.replace(/[\s.-]/g, '');
      const isUrl = /^https?:\/\//i.test(value);
      if (!isUrl) {
        if (!/^\d{44}$/.test(normalizedKey)) {
          throw new Error('Digite uma chave de acesso com 44 números ou cole o link completo do QR Code.');
        }
        const found = await findNfceByAccessKey(normalizedKey);
        setKeyResult(found);
        return;
      }

      const data = await previewNfce(value);
      setPreview(data);
      setItems(data.itens.map(item => ({ ...item, selecionado: true, categoria: 'Outros' })));
    } catch (requestError) {
      const blockedPortal = getNfceRateLimit(requestError);
      if (blockedPortal) {
        setRateLimit(blockedPortal);
        setRemainingSeconds(blockedPortal.retry_after_seconds);
      }
      setError(getApiErrorMessage(requestError, 'Não foi possível consultar esta nota.'));
    } finally {
      setIsLoading(false);
    }
  };

  const retryPreview = () => {
    if (!lastQrCode || remainingSeconds > 0) return;
    void loadPreview(lastQrCode);
  };

  const confirmImport = async () => {
    if (!preview) return null;
    const selectedItems = items.filter(item => item.selecionado);
    if (!selectedItems.length) {
      setError('Selecione pelo menos um item para importar.');
      return null;
    }

    setError('');
    setIsImporting(true);
    try {
      const imported = await importNfce(preview, selectedItems, items);
      setResult(imported);
      return imported;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível atualizar o estoque.'));
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  const updateItem = (index: number, changes: Partial<NfceReviewItem>) => {
    setItems(current => current.map(item => item.indice === index ? { ...item, ...changes } : item));
  };

  const reset = useCallback(() => {
    setPreview(null);
    setKeyResult(null);
    setItems([]);
    setResult(null);
    setError('');
    setIsLoading(false);
    setIsImporting(false);
    setRateLimit(null);
    setRemainingSeconds(0);
    setLastQrCode('');
  }, []);

  return {
    preview,
    keyResult,
    items,
    result,
    error,
    isLoading,
    isImporting,
    rateLimit,
    remainingSeconds,
    loadPreview,
    retryPreview,
    confirmImport,
    updateItem,
    reset,
  };
}
