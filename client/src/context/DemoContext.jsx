import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ownerToken, setUnauthorizedHandler } from '../api';
import { startTracking } from '../lib/track';

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

  const [owner, setOwner] = useState(false);
  const [offer, setOffer] = useState(null);
  const [authEnabled, setAuthEnabled] = useState(false);

  const refreshProspects = useCallback(async () => {
    const data = await api.prospects();
    setProspects(data.prospects);
    return data.prospects;
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setOwner(false);
      setProspects([]);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(
    async (password) => {
      const res = await api.login(password);
      ownerToken.set(res.token);
      setOwner(true);
      await refreshProspects().catch(() => {});
      return true;
    },
    [refreshProspects]
  );

  const logout = useCallback(() => {
    ownerToken.set('');
    setOwner(false);
    setProspects([]);
    window.sessionStorage.removeItem('pl_active_prospect');
  }, []);

  const selectProspect = useCallback((id) => {
    setActiveProspectId(id);
    if (id) window.sessionStorage.setItem('pl_active_prospect', id);
    else window.sessionStorage.removeItem('pl_active_prospect');
  }, []);

  useEffect(() => {
    if (owner) refreshProspects().catch(() => {});
  }, [owner, refreshProspects]);

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
          rating: String(next.business.rating),
          owner: next.business.ownerFirstName
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
        const [meta, who, offerData] = await Promise.all([
          api.niches(),
          api.me().catch(() => ({ owner: false, authEnabled: true })),
          api.offer().catch(() => null)
        ]);
        if (cancelled) return;
        setOffer(offerData);
        setNiches(meta.niches);
        setCurrencies(meta.currencies);
        setOwner(Boolean(who.owner));
        setAuthEnabled(Boolean(who.authEnabled));
        if (!who.owner && ownerToken.get()) ownerToken.set('');
        startTracking({ owner: Boolean(who.owner), urlRef: searchParams.get('ref') });

        const biz = searchParams.get('biz') || searchParams.get('business');
        const niche = searchParams.get('niche');
        const city = searchParams.get('city');
        const currency = searchParams.get('currency');
        const rating = searchParams.get('rating');
        const ownerName = searchParams.get('owner');

        if (biz || niche || city || currency || rating) {
          const next = await api.personalize({
            businessName: biz || undefined,
            nicheId: niche || undefined,
            city: city || undefined,
            currencyCode: currency || undefined,
            rating: rating || undefined,
            ownerFirstName: ownerName || undefined
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

  const activeProspect = prospects.find((p) => p.id === activeProspectId) || null;

  useEffect(() => {
    if (!owner) return undefined;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshProspects().catch(() => {});
    }, 60000);
    return () => window.clearInterval(id);
  }, [owner, refreshProspects]);

  const demoLink = useMemo(() => {
    if (!state?.business) return window.location.origin;
    const b = state.business;
    const tracked = activeProspect && activeProspect.businessName === b.name && activeProspect.trackId;
    const params = new URLSearchParams({
      biz: b.name,
      niche: b.nicheId,
      city: b.city,
      currency: b.currencyCode,
      rating: String(b.rating),
      owner: b.ownerFirstName
    });
    if (tracked) params.set('ref', activeProspect.trackId);
    return `${window.location.origin}/?${params.toString()}`;
  }, [state, activeProspect]);

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
    activeProspect,
    selectProspect,
    brandForProspect,
    owner,
    authEnabled,
    offer,
    setOffer,
    login,
    logout
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
