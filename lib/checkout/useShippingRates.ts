'use client';

import { useState, useRef, useCallback } from 'react';

export interface ShippingQuote {
  serviceCode: string;
  serviceName: string;
  priceTotalCents: number;
  expectedTransitDays: string | number | null;
  freeShipping?: boolean;
}

interface CartItem {
  product_key: string;
  quantity: number;
  price: number;
}

const FALLBACK_QUOTE: ShippingQuote = {
  serviceCode: 'FALLBACK',
  serviceName: 'Standard Shipping (estimated)',
  priceTotalCents: 1499,
  expectedTransitDays: '7-12',
  freeShipping: false,
};

export function useShippingRates() {
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [source, setSource] = useState<'canada-post' | 'fallback' | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRates = useCallback(async (
    postalCode: string,
    province: string,
    items: CartItem[],
    retryCount = 0,
  ) => {
    const clean = postalCode.replace(/\s/g, '');
    if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/i.test(clean) || items.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ product_key: i.product_key, quantity: i.quantity, price: i.price })),
          postalCode: clean,
          province,
        }),
        signal: controller.signal,
      });
      const data = await res.json();

      if (controller.signal.aborted) return;

      if (data.quotes?.length > 0) {
        setQuotes(data.quotes);
        setSource(data.source || 'canada-post');
        setSelectedService(data.quotes[0].serviceCode);
      } else if (retryCount < 1) {
        await new Promise(r => setTimeout(r, 1000));
        if (!controller.signal.aborted) {
          return fetchRates(postalCode, province, items, retryCount + 1);
        }
      } else {
        setQuotes([FALLBACK_QUOTE]);
        setSource('fallback');
        setSelectedService('FALLBACK');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (retryCount < 1) {
        await new Promise(r => setTimeout(r, 1000));
        if (!controller.signal.aborted) {
          return fetchRates(postalCode, province, items, retryCount + 1);
        }
      } else {
        console.error('Shipping rates error:', err);
        setQuotes([FALLBACK_QUOTE]);
        setSource('fallback');
        setSelectedService('FALLBACK');
        setError('Could not load shipping rates');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setQuotes([]);
    setSource(null);
    setSelectedService('');
    setLoading(false);
    setError(null);
  }, []);

  return { quotes, source, selectedService, setSelectedService, loading, error, fetchRates, reset };
}
