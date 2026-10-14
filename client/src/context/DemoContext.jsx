import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState(null);
  const [niches, setNiches] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [activeProspectId, setActiveProspectId] = useState(() => window.sessionStorage.getItem('pl_active_prospect'));

  const showToast = useCallback((msg, tone = 'ok') => {
    setToast({ msg, tone });
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const refreshProspects = useCallback(async () => {
    const data = await api.prospects();
    setProspects(data.prospects);
    return data.prospects;
  }, []);

  const selectProspect = useCallback((id) => {
    setActiveProspectId(id);
    if (id) window.sessionStorage.setItem('pl_active_prospect', id);
    else window.sessionStorage.removeItem('pl_active_prospect');
  }, []);

  useEffect(() => {
    refreshProspects().catch(() => {});
  }, [refreshProspects]);

  const refresh = useCallback(async () => {
    const data = await api.state();
    setState(data);
    return data;
  }, []);

  const applyPersonalize = useCallback(
    async (payload, { syncUrl } = { syncUrl: true }) => {
      const next = await api.personalize(payload);
      setState(next);
      if (syncUrl) {
        const params = {
          biz: next.business.name,
          niche: next.business.nicheId,
          city: next.business.city,
          currency: next.business.currencyCode,
          rating: String(next.business.rating)
        };
        setSearchParams(params, { replace: true });
      }
      return next;
    },
    [setSearchParams]
  );

  const brandForProspect = useCallback(
    async (p) => {
      await applyPersonalize(
        {
          nicheId: p.nicheId,
          businessName: p.businessName,
          city: p.city,
          currencyCode: p.currencyCode,
          rating: p.rating && p.rating >= 3 ? p.rating : undefined,
          ownerFirstName: p.ownerName ? p.ownerName.split(' ')[0] : undefined
        },
        { syncUrl: false }
      );
      const res = await api.prospectActivity(p.id, { type: 'branded', text: '' });
      setProspects(res.prospects);
      selectProspect(p.id);
      return res.prospect;
    },
    [applyPersonalize, selectProspect]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta = await api.niches();
        if (cancelled) return;
        setNiches(meta.niches);
        setCurrencies(meta.currencies);

        const biz = searchParams.get('biz') || searchParams.get('business');
        const niche = searchParams.get('niche');
        const city = searchParams.get('city');
        const currency = searchParams.get('currency');
        const rating = searchParams.get('rating');

        if (biz || niche || city || currency || rating) {
          const next = await api.personalize({
            businessName: biz || undefined,
            nicheId: niche || undefined,
            city: city || undefined,
            currencyCode: currency || undefined,
            rating: rating || undefined
          });
          if (!cancelled) setState(next);
        } else {
          const data = await api.state();
          if (!cancelled) setState(data);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not reach the PulseLocal API.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Run once on mount so URL personalization is applied for outreach links.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const demoLink = useMemo(() => {
    if (!state?.business) return window.location.origin;
    const b = state.business;
    const params = new URLSearchParams({
      biz: b.name,
      niche: b.nicheId,
      city: b.city,
      currency: b.currencyCode,
      rating: String(b.rating)
    });
    return `${window.location.origin}/?${params.toString()}`;
  }, [state]);

  const value = {
    state,
    setState,
    niches,
    currencies,
    loading,
    error,
    toast,
    showToast,
    refresh,
    applyPersonalize,
    demoLink,
    prospects,
    setProspects,
    refreshProspects,
    activeProspect: prospects.find((p) => p.id === activeProspectId) || null,
    selectProspect,
    brandForProspect
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
