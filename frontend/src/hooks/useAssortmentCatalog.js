import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { ASSORTMENT, HOME_TOP_14, ASSORTMENT_TABS, assortmentByTab as assortmentByTabBase } from '../data/assortment';
import { normalizeAssortmentKey } from '../utils/assortmentIcons';

/**
 * Public list of hidden assortment keys (admin-managed).
 * Icons for old listings still resolve from the full static ASSORTMENT.
 */
export function useHiddenAssortmentKeys() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['assortment-hidden'],
    queryFn: () => api.get('/assortment/hidden').then((r) => r.data),
    staleTime: 60_000,
  });

  const hiddenKeys = useMemo(() => {
    const keys = data?.keys || [];
    return new Set(keys.map((k) => normalizeAssortmentKey(k)));
  }, [data]);

  return { hiddenKeys, isLoading, isError };
}

export function isAssortmentItemHidden(itemOrName, hiddenKeys) {
  if (!hiddenKeys?.size) return false;
  const name = typeof itemOrName === 'string' ? itemOrName : itemOrName?.name;
  return hiddenKeys.has(normalizeAssortmentKey(name));
}

export function filterVisibleAssortment(items, hiddenKeys) {
  if (!hiddenKeys?.size) return items;
  return items.filter((item) => !isAssortmentItemHidden(item, hiddenKeys));
}

/** Visible catalog for home / apps / create-listing picker */
export function useVisibleAssortment() {
  const { hiddenKeys, isLoading } = useHiddenAssortmentKeys();

  const items = useMemo(
    () => filterVisibleAssortment(ASSORTMENT, hiddenKeys),
    [hiddenKeys]
  );

  const homeTop = useMemo(() => {
    const top = filterVisibleAssortment(HOME_TOP_14, hiddenKeys);
    if (top.length >= HOME_TOP_14.length) return top;
    const used = new Set(top.map((i) => i.name));
    const fill = items.filter((i) => !used.has(i.name));
    return [...top, ...fill].slice(0, HOME_TOP_14.length);
  }, [hiddenKeys, items]);

  const byTab = useCallback(
    (tabId) => filterVisibleAssortment(assortmentByTabBase(tabId), hiddenKeys),
    [hiddenKeys]
  );

  return {
    items,
    homeTop,
    byTab,
    tabs: ASSORTMENT_TABS,
    hiddenKeys,
    isLoading,
  };
}
