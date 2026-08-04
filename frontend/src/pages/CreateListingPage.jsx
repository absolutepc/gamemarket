import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, X, Search, Gamepad2, Smartphone, Layers, Monitor,
  Tag, Eye, EyeOff, Package, Shield, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import Seo from '../components/Seo';
import {
  resolveFeePercent,
  resolveReducedFeePercent,
  formatFeePercent,
  calcSellerReceives,
  isReducedFeeListingType,
} from '../utils/fees';
import { formatPrice } from '../utils/format';
import { LISTING_TYPE_OPTIONS } from '../utils/listingTypes';
import { listingTypeOptionsForAssortment } from '../utils/listingTypesByAssortment';
import {
  getAttributeSchema,
  validateAttributes,
  attributesToTags,
} from '../utils/listingAttributes';
import { compressImageFile } from '../utils/imageCompress';
import { resolveAssortmentItem, isExactAssortmentName, assortmentIconUrl } from '../utils/assortmentIcons';
import { useHiddenAssortmentKeys, useVisibleAssortment } from '../hooks/useAssortmentCatalog';
import { ASSORTMENT_TABS } from '../data/assortment';
import { categoryIdForListingType } from '../utils/listingCategoryMap';
import { PAGE_WIDTH_CLASS } from '../components/ListingCard';

const DEFAULT_FIELD = { key: 'player_id', label: 'ID / ник', required: true };
const MAX_IMAGES = 5;
const FALLBACK_ICON = assortmentIconUrl('/assortment/other-apps.png');

export default function CreateListingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 text-white p-6">
      <div className="text-center">
        <p className="text-lg font-semibold mb-2">Страница создания лота временно недоступна</p>
        <p className="text-dark-400 text-sm mb-4">Идёт восстановление. Обновите через минуту.</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/')}>На главную</button>
      </div>
    </div>
  );
}
