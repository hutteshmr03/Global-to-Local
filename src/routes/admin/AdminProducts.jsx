import React, { useEffect, useState } from 'react';
import {
  Search,
  Package,
  Edit2,
  Eye,
  EyeOff,
  History,
  X,
  AlertTriangle,
  Check,
  RefreshCw,
  Clock,
  ArrowRight,
  Plus,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileEdit,
  Star,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client';
import { queryClient } from '../../lib/catalogue-hooks';

const SHELVES = [
  { slug: 'all', name: 'All 13 Shelves' },
  { slug: 'chutneys-and-spreads', name: 'Chutneys & Spreads' },
  { slug: 'farsaan', name: 'Farsaan' },
  { slug: 'grains', name: 'Grains' },
  { slug: 'hand-crafted', name: 'Hand-Crafted' },
  { slug: 'kunbi', name: 'Kunbi' },
  { slug: 'masala', name: 'Masala' },
  { slug: 'oils-vinegars', name: 'Oils & Vinegars' },
  { slug: 'papads-pickles', name: 'Papads & Pickles' },
  { slug: 'seafood', name: 'Seafood' },
  { slug: 'spices', name: 'Spices' },
  { slug: 'sustainable-products', name: 'Sustainable Products' },
  { slug: 'sweet', name: 'Sweet' },
  { slug: 'wellness', name: 'Wellness' },
];

const PRODUCT_SHELVES = SHELVES.filter((s) => s.slug !== 'all');

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const CATEGORY_PREFIXES = {
  'hand-crafted': 'CRFT',
  'sweet': 'SWET',
  'farsaan': 'FARS',
  'spices': 'SPIC',
  'masala': 'MASL',
  'grains': 'GRAN',
  'oils-and-vinegars': 'OILS',
  'oils-vinegars': 'OILS',
  'papads-and-pickles': 'PCKL',
  'papads-pickles': 'PCKL',
  'seafood': 'SEAF',
  'chutneys-and-spreads': 'CHUT',
  'kunbi': 'KNBI',
  'wellness': 'WELL',
  'sustainable-products': 'SUST',
};

function generateSkuFromName(name, shelfSlug) {
  const prefix = CATEGORY_PREFIXES[shelfSlug] || 'PROD';
  if (!name || !name.trim()) return `${prefix}-NEW-ITEM`;
  const clean = name
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const tokens = clean
    .split('-')
    .filter((w) => !['grams', 'gram', 'and', 'the', 'themed', 'goan', 'of', 'in', '8211'].includes(w));
  const filtered = prefix === 'KNBI' ? tokens.filter((w) => w !== 'kunbi') : tokens;
  const code = filtered.slice(0, 3).join('-').toUpperCase();
  return code ? `${prefix}-${code}` : `${prefix}-NEW-ITEM`;
}

function cleanNameDashes(str) {
  if (!str) return '';
  let s = str.replace(/\s*[-–—]\s*/g, ' ');
  s = s.replace(/Goan themed/gi, 'Goan-themed').replace(/Khat khate/gi, 'Khat-khate');
  return s.replace(/\s+/g, ' ').trim();
}

export const CATEGORY_DEFAULT_MAKERS = {
  kunbi: 'Kunbi weavers, Goa',
  masala: 'Self-help group kitchens, Goa',
  'papads-pickles': 'Self-help group kitchens, Goa',
  'papads-and-pickles': 'Self-help group kitchens, Goa',
  'chutneys-and-spreads': 'Self-help group kitchens, Goa',
  'chutneys-spreads': 'Self-help group kitchens, Goa',
  'hand-crafted': 'Goan makers',
  'sustainable-products': 'Goan makers',
  wellness: 'Goan makers',
  sweet: 'Traditional Goan confectioners',
  farsaan: 'Goan bakers & snack makers',
  seafood: 'Coastal Goan fisherfolk collectives',
  'oils-and-vinegars': 'Goan cold-press mills & distilleries',
  'oils-vinegars': 'Goan cold-press mills & distilleries',
  grains: 'Heritage Goan paddy farmers',
  spices: 'Goan spice estates & growers',
};

export function parseWeight(str) {
  const s = (str || '').trim();
  const match = s.match(/(\d+)\s*(kg|g|gm|grams|ml|l)?/i);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = (match[2] || 'g').toLowerCase();
    const grams = unit === 'kg' || unit === 'l' ? val * 1000 : val;
    return {
      unit_label: s.toLowerCase().includes('piece') ? 'One piece' : match[2] ? s : `${val} g`,
      weight_grams: Math.max(1, grams),
    };
  }
  return {
    unit_label: s || 'One piece',
    weight_grams: 250,
  };
}

export function formatProductDisplayName(product) {
  if (!product) return '';
  const rawName = (product.name || '').trim();
  const unit = (product.unit_label || '').trim();

  // Pattern matches weight or quantity specification (e.g. 80 grams, 200 g, 500 ml, 1 Kg, pack of 4, per piece)
  const qtyPattern = /[-–—]?\s*\b(\d+\s*(?:grams?|gm?|g|kg|kgs?|kilo(?:gram)?s?|ml|l|ltr|litres?|liters?|pieces?|pcs)|pack\s+of\s+\d+|per\s+piece)\b/i;

  const match = rawName.match(qtyPattern);
  if (match) {
    const weightStr = match[1].trim();
    let baseName = rawName.slice(0, match.index).trim();
    baseName = baseName.replace(/[-–—,]\s*$/, '').trim();
    const remainder = rawName.slice(match.index + match[0].length).trim();
    if (remainder) {
      baseName = `${baseName} ${remainder}`.trim();
    }
    baseName = cleanNameDashes(baseName);
    if (baseName) {
      return `${baseName} • ${weightStr}`;
    }
    return `${cleanNameDashes(rawName)} • ${weightStr}`;
  }

  const cleaned = cleanNameDashes(rawName);
  // If no weight in name, format as name • One piece / unit_label
  if (unit) {
    return `${cleaned} • ${unit}`;
  }

  return cleaned;
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [shelf, setShelf] = useState('all');
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Inline Price & Stock Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [newRupees, setNewRupees] = useState('');
  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Price History Modal State
  const [historyProduct, setHistoryProduct] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add / Edit Product Slide-over Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formProduct, setFormProduct] = useState(null); // null = Add, obj = Edit Details
  const [formData, setFormData] = useState({
    name: '',
    shelf_slug: 'chutneys-and-spreads',
    price_rupees: '',
    weight: '100 g',
    made_by: 'Self-help group kitchens, Goa',
    description: '',
    stock_qty: '50',
    low_stock_threshold: '5',
    status: 'published',
    images: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [generalFormError, setGeneralFormError] = useState('');
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('q', search.trim());
      if (shelf !== 'all') params.append('category', shelf);
      params.append('page_size', '250');

      const res = await apiFetch(`/api/v1/admin/products?${params.toString()}`);
      setProducts(res.items || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [shelf]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setNewRupees((prod.price_paise / 100).toString());
    setNewStock((prod.stock_qty ?? 50).toString());
    setReason('');
    setEditError('');
    setEditSuccess('');
  };

  const handleSavePriceAndStock = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    const val = parseFloat(newRupees);
    if (isNaN(val) || val <= 0) {
      setEditError('Price must be greater than zero.');
      return;
    }

    const stockVal = parseInt(newStock, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      setEditError('Stock must be zero or a positive number.');
      return;
    }

    if (!reason.trim()) {
      setEditError('A non-empty reason is required for the audit trail.');
      return;
    }

    const newPaise = Math.round(val * 100);
    const oldPaise = editingProduct.price_paise;
    const oldStock = editingProduct.stock_qty ?? 50;

    const priceChanged = newPaise !== oldPaise;
    const stockChanged = stockVal !== oldStock;

    if (!priceChanged && !stockChanged) {
      setEditError('No changes detected in price or stock.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updates = [];
      if (priceChanged) {
        updates.push(
          apiFetch(`/api/v1/admin/products/${editingProduct.id}/price`, {
            method: 'PATCH',
            body: {
              new_price_paise: newPaise,
              reason: reason.trim(),
            },
          })
        );
      }
      if (stockChanged) {
        updates.push(
          apiFetch(`/api/v1/admin/products/${editingProduct.id}/stock`, {
            method: 'PATCH',
            body: {
              stock_qty: stockVal,
              reason: reason.trim(),
            },
          })
        );
      }

      await Promise.all(updates);

      const msgs = [];
      if (priceChanged) msgs.push(`Price: ₹${val.toFixed(2).replace(/\.00$/, '')}`);
      if (stockChanged) msgs.push(`Stock: ${stockVal} on hand`);
      setEditSuccess(`${msgs.join(' & ')} updated successfully.`);

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                price_paise: newPaise,
                price_formatted: `₹${val}`,
                stock_qty: stockVal,
              }
            : p
        )
      );

      // Invalidate customer queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });

      setTimeout(() => {
        setEditingProduct(null);
      }, 900);
    } catch (err) {
      setEditError(err.detail || err.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (prod) => {
    try {
      const nextStatus = !prod.is_active;
      await apiFetch(`/api/v1/admin/products/${prod.id}/status`, {
        method: 'PATCH',
        body: { is_active: nextStatus },
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, is_active: nextStatus, status: nextStatus ? 'Published' : 'Hidden' } : p))
      );
      // Invalidate customer-facing catalogue queries so changes reflect immediately
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    } catch (err) {
      alert(err.detail || err.message || 'Failed to toggle status');
    }
  };

  const handleOpenHistory = async (prod) => {
    setHistoryProduct(prod);
    setHistoryLoading(true);
    try {
      const res = await apiFetch(`/api/v1/admin/products/${prod.id}/price-history`);
      setHistoryItems(res || []);
    } catch (err) {
      alert('Failed to load price history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Add Product Slide-over Actions
  const handleOpenAddProduct = async () => {
    setGeneralFormError('');
    setImageUploadError('');
    setFormErrors({});
    setFormProduct(null);

    setFormData({
      name: '',
      shelf_slug: 'chutneys-and-spreads',
      price_rupees: '',
      weight: '100 g',
      made_by: CATEGORY_DEFAULT_MAKERS['chutneys-and-spreads'] || 'Self-help group kitchens, Goa',
      description: '',
      stock_qty: '50',
      low_stock_threshold: '5',
      status: 'published',
      images: [],
    });
    setIsFormOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setGeneralFormError('');
    setImageUploadError('');
    setFormErrors({});
    setFormProduct(prod);

    let initialImages = [];
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      initialImages = prod.images.map((img) => ({
        image_url: img.image_url || img.url,
        alt_text: img.alt_text || prod.name || 'Product photo',
        is_primary: Boolean(img.is_primary),
      }));
    } else if (prod.image_url) {
      initialImages = [
        {
          image_url: prod.image_url,
          alt_text: prod.name || 'Product photo',
          is_primary: true,
        },
      ];
    }

    const currentShelf = prod.shelf_slug || prod.category_slug || 'chutneys-and-spreads';
    const fallbackMaker = CATEGORY_DEFAULT_MAKERS[currentShelf] || 'Goan makers';

    setFormData({
      name: prod.name || '',
      shelf_slug: currentShelf,
      price_rupees: ((prod.price_paise || 0) / 100).toString(),
      weight: prod.unit_label || (prod.net_weight_grams ? `${prod.net_weight_grams} g` : '100 g'),
      made_by: prod.made_by || prod.madeBy || (prod.maker && prod.maker.name) || fallbackMaker,
      description: prod.description || '',
      stock_qty: (prod.stock_qty ?? 50).toString(),
      low_stock_threshold: (prod.low_stock_threshold ?? 5).toString(),
      status: prod.status || (prod.is_active ? 'published' : 'draft'),
      images: initialImages,
    });
    setIsFormOpen(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: val,
    }));
    if (formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleShelfChange = (e) => {
    const newShelf = e.target.value;
    setFormData((prev) => {
      const prevDefault = CATEGORY_DEFAULT_MAKERS[prev.shelf_slug] || 'Goan makers';
      const shouldUpdateMadeBy = !prev.made_by || prev.made_by === prevDefault;
      const nextMadeBy = shouldUpdateMadeBy ? (CATEGORY_DEFAULT_MAKERS[newShelf] || 'Goan makers') : prev.made_by;
      return {
        ...prev,
        shelf_slug: newShelf,
        made_by: nextMadeBy,
      };
    });
    if (formErrors.shelf_slug) setFormErrors((prev) => ({ ...prev, shelf_slug: '' }));
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setImageUploadError('');
    setIsUploadingImage(true);

    try {
      const newImages = [...formData.images];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          setImageUploadError(`"${file.name}" exceeds the 5 MB maximum size limit.`);
          continue;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setImageUploadError(`"${file.name}" has an unsupported format. Only JPG, PNG, and WebP are accepted.`);
          continue;
        }

        const body = new FormData();
        body.append('file', file);
        const res = await apiFetch('/api/v1/admin/products/images', {
          method: 'POST',
          body,
        });

        if (res && res.url) {
          const hasPrimary = newImages.some((img) => img.is_primary);
          newImages.push({
            image_url: res.url,
            alt_text: formData.name ? `${formData.name} photo` : 'Product photo',
            is_primary: !hasPrimary,
          });
        }
      }
      setFormData((prev) => ({ ...prev, images: newImages }));
      if (formErrors.images) {
        setFormErrors((prev) => ({ ...prev, images: '' }));
      }
    } catch (err) {
      setImageUploadError(err.detail || err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSetPrimaryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      })),
    }));
  };

  const handleImageAltChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.images];
      updated[index] = { ...updated[index], alt_text: value };
      return { ...prev, images: updated };
    });
    if (formErrors.images) {
      setFormErrors((prev) => ({ ...prev, images: '' }));
    }
  };

  const handleMoveImage = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= formData.images.length) return;
    setFormData((prev) => {
      const updated = [...prev.images];
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      return { ...prev, images: updated };
    });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const filtered = prev.images.filter((_, i) => i !== index);
      if (filtered.length > 0 && !filtered.some((img) => img.is_primary)) {
        filtered[0].is_primary = true;
      }
      return { ...prev, images: filtered };
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Product name is required.';
    }
    if (!formData.shelf_slug) {
      errors.shelf_slug = 'Shelf selection is required.';
    }
    const price = parseFloat(formData.price_rupees);
    if (isNaN(price) || price <= 0) {
      errors.price_rupees = 'Price must be greater than zero.';
    }
    if (!formData.weight.trim()) {
      errors.weight = 'Weight is required (e.g. 100 g or One piece).';
    }
    const stock = parseInt(formData.stock_qty, 10);
    if (isNaN(stock) || stock < 0) {
      errors.stock_qty = 'Stock quantity cannot be negative.';
    }
    const lowStock = parseInt(formData.low_stock_threshold, 10);
    if (isNaN(lowStock) || lowStock < 0) {
      errors.low_stock_threshold = 'Low-stock threshold cannot be negative.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setGeneralFormError('');
    if (!validateForm()) return;

    setIsFormSubmitting(true);
    try {
      const parsedWeight = parseWeight(formData.weight);
      const generatedSlug = formProduct ? formProduct.slug : slugify(formData.name.trim());
      const finalSku =
        (formProduct && formProduct.sku) ||
        generateSkuFromName(formData.name.trim(), formData.shelf_slug);

      const payload = {
        name: formData.name.trim(),
        slug: generatedSlug,
        sku: finalSku,
        shelf: formData.shelf_slug,
        shelf_slug: formData.shelf_slug,
        category_slug: formData.shelf_slug,
        price_paise: Math.round(parseFloat(formData.price_rupees) * 100),
        price_rupees: parseFloat(formData.price_rupees),
        unit_label: parsedWeight.unit_label,
        weight_grams: parsedWeight.weight_grams,
        net_weight_grams: parsedWeight.weight_grams,
        description: formData.description.trim(),
        short_description: formData.description.trim().slice(0, 300),
        made_by: formData.made_by.trim() || 'Self-help group kitchens, Goa',
        origin: 'Made in Goa',
        origin_text: 'Made in Goa',
        stock_qty: parseInt(formData.stock_qty, 10) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold, 10) || 5,
        is_featured: false,
        status: formData.status || 'published',
        images: formData.images.map((img, idx) => ({
          url: img.image_url || img.url,
          image_url: img.image_url || img.url,
          alt_text: (img.alt_text && img.alt_text.trim()) || `${formData.name.trim() || 'Product'} photo`,
          is_primary: idx === 0,
          sort_order: idx,
        })),
      };

      if (formProduct) {
        const updated = await apiFetch(`/api/v1/admin/products/${formProduct.id}`, {
          method: 'PUT',
          body: payload,
        });

        const productObj = updated.product || updated;
        setProducts((prev) => prev.map((p) => (p.id === productObj.id ? productObj : p)));
        setToastMessage(`Product "${formatProductDisplayName(productObj)}" updated successfully.`);
      } else {
        const created = await apiFetch('/api/v1/admin/products', {
          method: 'POST',
          body: payload,
        });

        const productObj = created.product || created;
        setProducts((prev) => [productObj, ...prev]);
        setToastMessage(`Product "${formatProductDisplayName(productObj)}" created successfully.`);
      }

      // Invalidate customer queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });

      setIsFormOpen(false);
      setTimeout(() => {
        setToastMessage('');
      }, 4500);
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const fieldErrs = {};
        err.errors.forEach((e) => {
          const fieldName = e.loc ? e.loc[e.loc.length - 1] : null;
          if (fieldName) fieldErrs[fieldName] = e.msg;
        });
        setFormErrors(fieldErrs);
      }
      setGeneralFormError(err.detail || err.message || 'Failed to save product');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Compute percentage difference for warning in inline price edit
  const currentRupees = editingProduct ? editingProduct.price_paise / 100 : 0;
  const targetRupees = parseFloat(newRupees) || 0;
  const pctChange = currentRupees > 0 ? (Math.abs(targetRupees - currentRupees) / currentRupees) * 100 : 0;
  const showWarning = pctChange > 25 && targetRupees > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-accent">Catalogue Management</span>
          <h1 className="mt-1 font-sans text-2xl sm:text-3xl font-bold text-content">Products & Pricing</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddProduct}
            className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-xs font-semibold text-content hover:bg-surface-muted transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-palm" />
            <span>Add Product</span>
          </button>
          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-xs font-semibold text-content hover:bg-surface-muted transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : 'text-palm'}`} />
            <span>Reload Products</span>
          </button>
        </div>
      </div>

      {/* Confirmation Toast Banner */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-palm/30 bg-palm/10 px-4 py-3 text-xs font-semibold text-palm shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-palm hover:opacity-75 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-content-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, shelf, or slug..."
            className="w-full rounded-pill border border-border bg-surface py-2.5 pl-10 pr-4 text-xs font-medium text-content outline-none focus:border-palm shadow-xs"
          />
        </form>

        <select
          value={shelf}
          onChange={(e) => setShelf(e.target.value)}
          aria-label="Filter by shelf"
          className="rounded-pill border border-border bg-surface px-4 py-2 text-xs font-semibold text-content outline-none cursor-pointer focus:border-palm shadow-xs"
        >
          {SHELVES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product List Table / Cards */}
      <div className="rounded-2xl border border-border/60 bg-surface shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-content-muted">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-palm border-t-transparent mb-2" />
            <p>Fetching catalogue items...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-xs text-content-muted space-y-2">
            <Package className="w-8 h-8 text-content-subtle mx-auto" />
            <p className="font-semibold text-content">No products matched your filter</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto hide-scrollbar">
              <table className="w-full text-left text-xs text-content">
                <thead>
                  <tr className="border-b border-border/40 bg-ground/50 text-content-subtle uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-bold">Product</th>
                    <th className="py-3 px-4 font-bold">Shelf</th>
                    <th className="py-3 px-4 font-bold">Price</th>
                    <th className="py-3 px-4 font-bold">Stock</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-ground/40 transition-colors">
                      {/* Title & Quantity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-10 w-10 rounded-lg object-cover bg-surface-sunken shrink-0 border border-border/40"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-content truncate max-w-sm sm:max-w-md">
                              {formatProductDisplayName(p)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Shelf */}
                      <td className="py-3 px-4 font-medium text-content-muted">{p.category_name}</td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <span className="font-sans font-bold text-sm text-content tabular-nums">
                          ₹{((p.price_paise || 0) / 100).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span className="font-sans font-semibold text-content tabular-nums">
                          {p.stock_qty} on hand
                        </span>
                        {p.reserved_qty > 0 && (
                          <p className="text-[10px] text-accent">({p.reserved_qty} reserved)</p>
                        )}
                      </td>

                      {/* Status (Visible / Hidden) */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                            p.is_active
                              ? 'bg-palm/15 text-palm border-palm/30 hover:bg-palm/25'
                              : 'bg-content-subtle/15 text-content-muted border-border hover:bg-content-subtle/25'
                          }`}
                          title={p.is_active ? 'Click to hide from store' : 'Click to show in store'}
                        >
                          {p.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{p.is_active ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-palm bg-surface px-3 py-1 text-[11px] font-semibold text-palm hover:bg-palm hover:text-white transition-all shadow-xs whitespace-nowrap"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Price & Stock</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-content hover:bg-surface-muted transition-all shadow-xs whitespace-nowrap"
                            title="Edit product details & images"
                          >
                            <FileEdit className="w-3 h-3" />
                            <span>Edit Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenHistory(p)}
                            className="p-1 rounded-full text-content-subtle hover:text-content hover:bg-surface-muted transition-colors"
                            title="View price history audit log"
                            aria-label={`Price history for ${p.name}`}
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (< 768px) */}
            <div className="md:hidden divide-y divide-border/20">
              {products.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-14 w-14 rounded-lg object-cover bg-surface-sunken shrink-0 border border-border/40"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-content text-sm">{formatProductDisplayName(p)}</p>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border min-h-[44px] ${
                            p.is_active
                              ? 'bg-palm/15 text-palm border-palm/30 hover:bg-palm/25'
                              : 'bg-content-subtle/15 text-content-muted border-border hover:bg-content-subtle/25'
                          }`}
                          title={p.is_active ? 'Click to hide from store' : 'Click to show in store'}
                        >
                          {p.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{p.is_active ? 'Active' : 'Hidden'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-content-muted font-medium mt-0.5">{p.category_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/20">
                    <div>
                      <span className="text-content-muted">Price: </span>
                      <span className="font-bold text-sm text-content tabular-nums">
                        ₹{((p.price_paise || 0) / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-content-muted">Stock: </span>
                      <span className="font-semibold text-content tabular-nums">
                        {p.stock_qty} on hand
                      </span>
                      {p.reserved_qty > 0 && (
                        <span className="text-[10px] text-accent ml-1">({p.reserved_qty} reserved)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-pill border border-palm bg-surface px-3 py-2 text-xs font-semibold text-palm hover:bg-palm hover:text-white transition-all shadow-xs whitespace-nowrap min-h-[44px]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Price & Stock</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditProduct(p)}
                      className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-2 text-xs font-semibold text-content hover:bg-surface-muted transition-all shadow-xs whitespace-nowrap min-h-[44px]"
                      title="Edit product details & images"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenHistory(p)}
                      className="p-2.5 rounded-pill border border-border bg-surface text-content-subtle hover:text-content hover:bg-surface-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shadow-xs"
                      title="View price history audit log"
                      aria-label={`Price history for ${p.name}`}
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ADD / EDIT PRODUCT SLIDE-OVER (DESKTOP) / FULL-SCREEN SHEET (360PX MOBILE) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-ink-deep/60 backdrop-blur-xs flex justify-end">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            className="w-full max-w-full sm:max-w-2xl h-full bg-surface shadow-2xl flex flex-col sm:border-l border-border"
          >
            {/* Slide-over Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-5 sm:px-6 py-4 shrink-0 bg-surface">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  {formProduct ? 'Catalogue Update' : 'New Catalogue Product'}
                </span>
                <h2 id="product-form-title" className="font-sans text-lg sm:text-xl font-bold text-content mt-0.5">
                  {formProduct ? 'Edit Product Details' : 'Add Product'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-content-subtle hover:text-content cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-surface-muted transition-colors"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {generalFormError && (
                <div className="rounded-2xl border border-accent/30 bg-accent/10 p-3.5 text-xs font-semibold text-accent flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{generalFormError}</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Product Name */}
                <div>
                  <label htmlFor="field-name" className="block text-xs font-semibold text-content mb-1">
                    Product Name *
                  </label>
                  <input
                    id="field-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Coconut Cashew Chutney 100 grams"
                    className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs text-content outline-none focus:border-palm shadow-2xs"
                  />
                  {formErrors.name && <p className="text-xs font-semibold text-accent mt-1">{formErrors.name}</p>}
                </div>

                {/* Shelf Selection */}
                <div>
                  <label htmlFor="field-shelf" className="block text-xs font-semibold text-content mb-1">
                    Shelf (Category) * <span className="text-[10px] text-content-subtle font-normal">(One of 13 shelves)</span>
                  </label>
                  <select
                    id="field-shelf"
                    required
                    value={formData.shelf_slug}
                    onChange={handleShelfChange}
                    className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-content outline-none cursor-pointer focus:border-palm shadow-2xs"
                  >
                    {PRODUCT_SHELVES.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.shelf_slug && <p className="text-xs font-semibold text-accent mt-1">{formErrors.shelf_slug}</p>}
                </div>

                {/* Price & Weight Grid (2 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price in Rupees */}
                  <div>
                    <label htmlFor="field-price" className="block text-xs font-semibold text-content mb-1">
                      Price (in ₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-content-muted">₹</span>
                      <input
                        id="field-price"
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={formData.price_rupees}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, price_rupees: e.target.value }));
                          if (formErrors.price_rupees) setFormErrors((prev) => ({ ...prev, price_rupees: '' }));
                        }}
                        placeholder="e.g. 120"
                        className="w-full rounded-pill border border-border bg-surface py-2.5 pl-8 pr-4 text-xs font-bold text-content outline-none focus:border-palm shadow-2xs tabular-nums"
                      />
                    </div>
                    {formErrors.price_rupees && <p className="text-xs font-semibold text-accent mt-1">{formErrors.price_rupees}</p>}
                  </div>

                  {/* Weight */}
                  <div>
                    <label htmlFor="field-weight" className="block text-xs font-semibold text-content mb-1">
                      Weight * <span className="text-[10px] text-content-subtle font-normal">(e.g. "100 g", "One piece")</span>
                    </label>
                    <input
                      id="field-weight"
                      type="text"
                      required
                      value={formData.weight}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, weight: e.target.value }));
                        if (formErrors.weight) setFormErrors((prev) => ({ ...prev, weight: '' }));
                      }}
                      placeholder="e.g. 100 g"
                      className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs text-content outline-none focus:border-palm shadow-2xs"
                    />
                    {formErrors.weight && <p className="text-xs font-semibold text-accent mt-1">{formErrors.weight}</p>}
                  </div>
                </div>

                {/* Made by */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="field-made-by" className="block text-xs font-semibold text-content">
                      Made by
                    </label>
                    <span className="text-[11px] text-content-subtle">
                      Origin: <strong className="text-content font-medium">Made in Goa</strong>
                    </span>
                  </div>
                  <input
                    id="field-made-by"
                    type="text"
                    value={formData.made_by}
                    onChange={(e) => setFormData((prev) => ({ ...prev, made_by: e.target.value }))}
                    placeholder="e.g. Self-help group kitchens, Goa"
                    className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs text-content outline-none focus:border-palm shadow-2xs"
                  />
                </div>

                {/* Stock Quantity & Low-Stock Threshold Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="field-stock" className="block text-xs font-semibold text-content mb-1">
                      Stock Quantity
                    </label>
                    <input
                      id="field-stock"
                      type="number"
                      step="1"
                      min="0"
                      value={formData.stock_qty}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, stock_qty: e.target.value }));
                        if (formErrors.stock_qty) setFormErrors((prev) => ({ ...prev, stock_qty: '' }));
                      }}
                      placeholder="50"
                      className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs text-content outline-none focus:border-palm shadow-2xs tabular-nums"
                    />
                    {formErrors.stock_qty && <p className="text-xs font-semibold text-accent mt-1">{formErrors.stock_qty}</p>}
                  </div>

                  <div>
                    <label htmlFor="field-low-stock" className="block text-xs font-semibold text-content mb-1">
                      Low-Stock Threshold
                    </label>
                    <input
                      id="field-low-stock"
                      type="number"
                      step="1"
                      min="0"
                      value={formData.low_stock_threshold}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, low_stock_threshold: e.target.value }));
                        if (formErrors.low_stock_threshold) setFormErrors((prev) => ({ ...prev, low_stock_threshold: '' }));
                      }}
                      placeholder="5"
                      className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs text-content outline-none focus:border-palm shadow-2xs tabular-nums"
                    />
                    {formErrors.low_stock_threshold && <p className="text-xs font-semibold text-accent mt-1">{formErrors.low_stock_threshold}</p>}
                  </div>
                </div>

                {/* Product Description */}
                <div>
                  <label htmlFor="field-description" className="block text-xs font-semibold text-content mb-1">
                    Product Description
                  </label>
                  <textarea
                    id="field-description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the product (e.g. Desiccated coconut ground with cashew and red chillies)..."
                    className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-content outline-none focus:border-palm shadow-2xs resize-y"
                  />
                </div>

                {/* Status Selection */}
                <div>
                  <label htmlFor="field-status" className="block text-xs font-semibold text-content mb-1">
                    Status *
                  </label>
                  <select
                    id="field-status"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-content outline-none cursor-pointer focus:border-palm shadow-2xs"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              {/* 3. Images Management */}
              <div className="space-y-4 pt-2 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted">Product Images</h3>
                    <p className="text-[11px] text-content-subtle">
                      Upload JPG, PNG, or WebP up to 5 MB. Server verifies magic bytes and generates web-friendly sizes.
                    </p>
                  </div>
                  {formData.images.length > 0 && (
                    <span className="text-[10px] font-bold text-palm bg-palm/10 px-2 py-0.5 rounded-pill">
                      {formData.images.length} {formData.images.length === 1 ? 'image' : 'images'}
                    </span>
                  )}
                </div>

                {/* Drag & Drop File Upload Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileUpload(Array.from(e.dataTransfer.files));
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                    isDragging
                      ? 'border-palm bg-palm/5'
                      : 'border-border/80 hover:border-palm/60 bg-ground/40'
                  }`}
                >
                  <input
                    type="file"
                    id="product-images-input"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(Array.from(e.target.files));
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <Upload className="w-7 h-7 text-palm mx-auto mb-2 opacity-80" />
                  <label
                    htmlFor="product-images-input"
                    className="inline-block cursor-pointer font-bold text-xs text-palm hover:underline"
                  >
                    Click to browse files
                  </label>
                  <span className="text-xs text-content-muted"> or drag and drop images here</span>
                  <p className="text-[11px] text-content-subtle mt-1">
                    Accepts JPG, PNG, WebP up to 5 MB per image
                  </p>

                  {isUploadingImage && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-palm">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading and optimizing image...</span>
                    </div>
                  )}

                  {imageUploadError && (
                    <p className="mt-2 text-xs font-semibold text-accent">{imageUploadError}</p>
                  )}
                </div>

                {formErrors.images && (
                  <p className="text-xs font-semibold text-accent">{formErrors.images}</p>
                )}

                {/* Image List Preview & Controls */}
                {formData.images.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {formData.images.map((img, idx) => (
                      <div
                        key={`${img.image_url}-${idx}`}
                        className={`rounded-2xl border p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-colors ${
                          img.is_primary ? 'border-palm/50 bg-palm/5' : 'border-border/50 bg-ground/50'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative shrink-0">
                          <img
                            src={img.image_url}
                            alt={img.alt_text || 'Thumbnail'}
                            className="h-16 w-16 rounded-xl object-cover border border-border bg-surface-sunken"
                          />
                          {img.is_primary && (
                            <span className="absolute -top-1.5 -right-1.5 bg-palm text-white rounded-full p-0.5 shadow-2xs" title="Main Primary Image">
                              <Star className="w-3 h-3 fill-current" />
                            </span>
                          )}
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-content">Image #{idx + 1}</span>
                        </div>

                        {/* Reorder and Delete Buttons */}
                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, -1)}
                            className="p-1.5 rounded-full border border-border bg-surface text-content-muted hover:text-content hover:bg-surface-muted disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move Up"
                            aria-label={`Move image ${idx + 1} up`}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === formData.images.length - 1}
                            onClick={() => handleMoveImage(idx, 1)}
                            className="p-1.5 rounded-full border border-border bg-surface text-content-muted hover:text-content hover:bg-surface-muted disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move Down"
                            aria-label={`Move image ${idx + 1} down`}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1.5 rounded-full border border-border bg-surface text-accent hover:bg-accent/10 cursor-pointer ml-1"
                            title="Remove Image"
                            aria-label={`Remove image ${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Slide-over Footer */}
            <div className="border-t border-border/40 px-5 sm:px-6 py-4 bg-ground/60 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={isFormSubmitting}
                className="rounded-pill border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-content hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={isFormSubmitting}
                className="rounded-pill bg-palm px-6 py-2.5 text-xs font-bold text-white hover:bg-palm-shade shadow-xs transition-all disabled:opacity-50 cursor-pointer min-h-[44px] flex items-center gap-2"
              >
                {isFormSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isFormSubmitting ? 'Saving...' : formProduct ? 'Update Product' : 'Save Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE PRICE & STOCK EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">Audit-Logged Edit</span>
                <h2 className="font-sans text-lg font-bold text-content mt-0.5">Edit Price & Stock</h2>
                <p className="text-xs text-content-muted truncate max-w-xs">{formatProductDisplayName(editingProduct)}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 text-content-subtle hover:text-content cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close edit modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePriceAndStock} className="space-y-4 pt-1">
              <div className="rounded-2xl border border-border/60 bg-ground/80 p-4 space-y-4">
                {/* 1. Price Editing */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-content-muted">Current Price:</span>
                    <span className="font-bold text-content tabular-nums">
                      ₹{((editingProduct.price_paise || 0) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">
                      New Price (in ₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-content-muted">₹</span>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        required
                        value={newRupees}
                        onChange={(e) => setNewRupees(e.target.value)}
                        placeholder="e.g. 550"
                        className="w-full rounded-pill border border-border bg-surface py-2 pl-8 pr-4 text-sm font-bold text-content outline-none focus:border-palm shadow-2xs tabular-nums"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Warning if change > 25% */}
                  {showWarning && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Warning: Price change is {pctChange.toFixed(1)}% (exceeds 25%).</span>
                    </div>
                  )}
                </div>

                {/* 2. In-Hand Stock Editing */}
                <div className="border-t border-border/40 pt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-content-muted">Current Stock:</span>
                    <span className="font-bold text-content tabular-nums">
                      {editingProduct.stock_qty ?? 50} units on hand
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content mb-1">
                      New In-Hand Stock (units) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full rounded-pill border border-border bg-surface py-2 px-4 text-sm font-bold text-content outline-none focus:border-palm shadow-2xs tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-semibold text-content mb-1">
                  Reason for Changes * <span className="text-[10px] text-content-subtle font-normal">(Recorded in audit log)</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Restocked 25 units from Fontainhas / Raw material adjustment"
                  className="w-full rounded-pill border border-border bg-surface px-4 py-2.5 text-xs text-content outline-none focus:border-palm shadow-2xs"
                />
              </div>

              {editError && (
                <p className="text-xs font-semibold text-accent">{editError}</p>
              )}

              {editSuccess && (
                <p className="text-xs font-semibold text-palm flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{editSuccess}</span>
                </p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-pill bg-palm py-3 text-xs font-bold text-white hover:bg-palm-shade shadow-xs transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm & Audit Log Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-pill border border-border bg-surface px-5 py-3 text-xs font-semibold text-content hover:bg-surface-muted transition-colors cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRICE HISTORY AUDIT DRAWER / MODAL */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/40 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">Audit History</span>
                <h2 className="font-sans text-lg font-bold text-content mt-0.5">Price Change History</h2>
                <p className="text-xs text-content-muted">{formatProductDisplayName(historyProduct)}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryProduct(null)}
                className="p-1 text-content-subtle hover:text-content min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Close price history modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-xs text-content-muted">Loading audit entries...</div>
            ) : historyItems.length === 0 ? (
              <p className="py-8 text-center text-xs text-content-muted">No prior price modifications recorded.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {historyItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/50 bg-ground/60 p-3.5 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-content-subtle line-through tabular-nums">{item.old_price_formatted}</span>
                        <ArrowRight className="w-3 h-3 text-accent" />
                        <span className="font-bold text-palm tabular-nums">{item.new_price_formatted}</span>
                      </div>
                      <span className="text-[10px] text-content-subtle">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-content font-medium">"{item.reason}"</p>
                    {item.ip && <p className="text-[10px] text-content-subtle font-medium">Admin IP: {item.ip}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
