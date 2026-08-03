import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import {
  ASSORTMENT,
  HOME_CAROUSEL_PINNED,
  ASSORTMENT_TABS,
  assortmentByTab as assortmentByTabBase,
  buildHomeCarousel,
} from '../data/assortment';
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

  const { data: popularData } = useQuery({
    queryKey: ['assortment-popular'],
    queryFn: () => api.get('/assortment/popular').then((r) => r.data),
    staleTime: 120_000,
    retry: 1,
  });

  const items = useMemo(
    () => filterVisibleAssortment(ASSORTMENT, hiddenKeys),
    [hiddenKeys]
  );

  const homeCarousel = useMemo(() => {
    const popularNames = popularData?.names || [];
    return filterVisibleAssortment(
      buildHomeCarousel(items, popularNames),
      hiddenKeys
    );
  }, [items, popularData, hiddenKeys]);

  /** First pinned block (for compact mobile strip) */
  const homeTop = useMemo(() => {
    const pinnedCatalogs = new Set(HOME_CAROUSEL_PINNED.map((p) => p.catalog));
    const pinned = homeCarousel.filter(
      (i) => pinnedCatalogs.has(i.catalog) || pinnedCatalogs.has(i.name)
    );
    return pinned.length ? pinned : homeCarousel.slice(0, HOME_CAROUSEL_PINNED.length);
  }, [homeCarousel]);

  const byTab = useCallback(
    (tabId) => filterVisibleAssortment(assortmentByTabBase(tabId), hiddenKeys),
    [hiddenKeys]
  );

  return {
    items,
    homeTop,
    homeCarousel,
    byTab,
    tabs: ASSORTMENT_TABS,
    hiddenKeys,
    isLoading,
  };
}
