import { products as seedProducts, categories as seedCategories } from './data';

// --- AUTO PURGE LEGACY TEST DATA FROM LOCALSTORAGE ---
if (typeof localStorage !== 'undefined') {
  try {
    ['gtl_mock_orders_v1', 'gtl_mock_orders_v2', 'gtl_mock_orders_v3', 'gtl_mock_orders_v4'].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('gtl_mock_orders_v5', JSON.stringify([]));
  } catch {}

  try {
    ['gtl_mock_enquiries_v1', 'gtl_mock_enquiries_v2', 'gtl_mock_enquiries_v3', 'gtl_mock_enquiries_v4'].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('gtl_mock_enquiries_v5', JSON.stringify([]));
  } catch {}

  try {
    ['gtl_mock_customers_v1', 'gtl_mock_customers_v2', 'gtl_mock_customers_v3', 'gtl_mock_customers_v4'].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('gtl_mock_customers_v5', JSON.stringify([]));
  } catch {}
}

const STORAGE_USER = 'gtl_mock_auth_user_v1';
const STORAGE_PRODUCTS = 'gtl_mock_products_v3';
const STORAGE_CUSTOMERS = 'gtl_mock_customers_v5';
const STORAGE_ENQUIRIES = 'gtl_mock_enquiries_v5';
const STORAGE_NEWS = 'gtl_mock_news_v1';
const STORAGE_PRICE_HISTORY = 'gtl_mock_price_history_v1';
const STORAGE_ADDRESSES = 'gtl_mock_addresses_v1';
const STORAGE_ORDERS = 'gtl_mock_orders_v5';
const STORAGE_REVIEWS = 'gtl_mock_reviews_v1';

export const CATEGORY_PREFIXES = {
  'hand-crafted': 'CRFT',
  'sweet': 'SWET',
  'farsaan': 'FARS',
  'spices': 'SPIC',
  'masala': 'MASL',
  'grains': 'GRAN',
  'oils-and-vinegars': 'OILS',
  'papads-and-pickles': 'PCKL',
  'seafood': 'SEAF',
  'chutneys-and-spreads': 'CHUT',
  'kunbi': 'KNBI',
  'wellness': 'WELL',
  'sustainable-products': 'SUST',
};

export const SHELF_NAMES = {
  'chutneys-and-spreads': 'Chutneys & Spreads',
  'farsaan': 'Farsaan',
  'grains': 'Grains',
  'hand-crafted': 'Hand-Crafted',
  'kunbi': 'Kunbi',
  'masala': 'Masala',
  'oils-and-vinegars': 'Oils & Vinegars',
  'papads-and-pickles': 'Papads & Pickles',
  'seafood': 'Seafood',
  'spices': 'Spices',
  'sustainable-products': 'Sustainable Products',
  'sweet': 'Sweet',
  'wellness': 'Wellness',
};

export function generateIdentifiableSku(p, usedSkus) {
  const catSlug = p.categorySlug || p.shelfSlug || p.category_slug || '';
  const prefix = CATEGORY_PREFIXES[catSlug] || 'PROD';
  let raw = (p.slug || p.name || 'item')
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  let parts = raw.split('-').filter(
    (w) => !['grams', 'gram', 'and', 'the', 'themed', 'goan', 'of', 'in', '8211'].includes(w)
  );
  if (prefix === 'KNBI') {
    parts = parts.filter((w) => w !== 'kunbi');
  }
  let code = parts.slice(0, 3).join('-').toUpperCase() || 'ITEM';
  let baseSku = `${prefix}-${code}`;
  let finalSku = baseSku;
  let counter = 2;
  if (usedSkus) {
    while (usedSkus.has(finalSku)) {
      finalSku = `${baseSku}-${counter}`;
      counter++;
    }
    usedSkus.add(finalSku);
  }
  return finalSku;
}

// Initial Mock Seed Data
function initMockProducts() {
  const existing = localStorage.getItem(STORAGE_PRODUCTS);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  const usedSkus = new Set();
  const initial = seedProducts.map((p, idx) => {
    const sku = p.sku && !p.sku.startsWith('GTL-') ? p.sku : generateIdentifiableSku(p, usedSkus);
    const catSlug = p.categorySlug || p.shelfSlug || p.category_slug || 'spices';
    const catName = SHELF_NAMES[catSlug] || p.shelf || 'Spices';
    const pricePaise = p.pricePaise || p.price || 35000;
    const imgSrc = p.imageSrc || p.image_url || '/images/catalog/goan-themed-blue-mug.jpg';
    const imgAlt = p.imageAlt || p.title || p.name || 'Goan product';

    return {
      // Backend canonical fields
      id: `prod-${p.id || idx + 1}`,
      legacy_id: p.id,
      sku,
      slug: p.slug,
      name: p.title || p.name,
      price_paise: pricePaise,
      price_formatted: `₹${(pricePaise / 100).toLocaleString('en-IN')}`,
      stock_qty: 50,
      reserved_qty: 0,
      is_active: true,
      status: 'published',
      category_name: catName,
      category_slug: catSlug,
      category: { id: catSlug, slug: catSlug, name: catName },
      unit_label: p.weight || '250 g',
      net_weight_grams: p.weightGrams || 250,
      description: p.description || p.shortDescription || '',
      short_description: p.shortDescription || p.description || '',
      origin_text: p.origin || 'Made in Goa',
      is_featured: Boolean(p.isFeatured),
      image_url: imgSrc,
      images: [
        {
          id: `img-${p.id || idx + 1}`,
          url: imgSrc,
          alt_text: imgAlt,
          is_primary: true,
          sort_order: 0,
        },
      ],
      primary_image: {
        id: `img-${p.id || idx + 1}`,
        url: imgSrc,
        alt_text: imgAlt,
        is_primary: true,
      },
      // Frontend compatibility fields so existing storefront UI components render identically
      price: pricePaise,
      categorySlug: catSlug,
      categoryName: catName,
      shortDescription: p.shortDescription || p.description || '',
      weight: p.weight || '250 g',
      weightGrams: p.weightGrams || 250,
      imageAlt: imgAlt,
      imageSrc: imgSrc,
      gallery: p.gallery || [imgSrc],
      inStock: true,
      origin: p.origin || 'Made in Goa',
    };
  });

  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(initial));
  return initial;
}

function initMockCustomers() {
  const existing = localStorage.getItem(STORAGE_CUSTOMERS);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(c => {
          const name = (c.name || c.full_name || '').toLowerCase();
          const email = (c.email || '').toLowerCase();
          return (
            !name.includes('maria fernandes') &&
            !name.includes('rahul naik') &&
            !name.includes('sancho fernandes') &&
            !name.includes('pooja naik') &&
            !name.includes('max') &&
            !email.includes('example.com') &&
            !name.includes('gurjeet') &&
            !name.includes('debarshi') &&
            !name.includes('kunal') &&
            !name.includes('shopper 8288') &&
            !name.includes('test user') &&
            !(name.includes('test') && !name.includes('attest'))
          );
        });
        localStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(clean));
        return clean;
      }
    } catch {}
  }
  const initial = [];
  localStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(initial));
  return initial;
}

function initMockNews() {
  const existing = localStorage.getItem(STORAGE_NEWS);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  const initial = [
    {
      id: 'news-1',
      publication: 'The Navhind Times',
      date: 'October 2020',
      title: 'Global to Local supermarket opens in city',
      url: 'https://www.navhindtimes.in/2020/10/28/business/global-to-local-supermarket-opens-in-city/',
    },
    {
      id: 'news-2',
      publication: 'Business Goa',
      date: 'March 2021',
      title: 'Global to Local in Business Goa',
      url: 'https://businessgoa.in/tag/global-to-local/',
    },
    {
      id: 'news-3',
      publication: 'Gomantak Times',
      date: 'August 2022',
      title: 'Global to Local empowers rural Goan women entrepreneurs',
      url: 'https://www.gomantaktimes.com/news/business/global-to-local-empowers-rural-goan-women-entrepreneurs',
    },
    {
      id: 'news-4',
      publication: 'The Goan',
      date: 'February 2025',
      title: 'Feature on Global to Local',
      url: '#',
    },
    {
      id: 'news-5',
      publication: 'Herald',
      date: 'November 2024',
      title: 'Global to Local in the Herald',
      url: '#',
    },
  ];
  localStorage.setItem(STORAGE_NEWS, JSON.stringify(initial));
  return initial;
}

function initMockEnquiries() {
  const existing = localStorage.getItem(STORAGE_ENQUIRIES);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(
          (e) =>
            !e.name?.toLowerCase().includes('huttesha') &&
            !e.name?.toLowerCase().includes('taj exotica') &&
            !e.name?.toLowerCase().includes('ananya') &&
            e.email?.toLowerCase() !== 'mrhuttesh003@gmail.com' &&
            e.email?.toLowerCase() !== 'procurement@tajexotica.com' &&
            e.email?.toLowerCase() !== 'ananya.d@gmail.com'
        );
        localStorage.setItem(STORAGE_ENQUIRIES, JSON.stringify(clean));
        return clean;
      }
    } catch {}
  }
  const initial = [];
  localStorage.setItem(STORAGE_ENQUIRIES, JSON.stringify(initial));
  return initial;
}

// Convert File to base64 Data URL helper
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export class MockProblemError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : detail?.detail || 'Request failed');
    this.name = 'ApiProblemError';
    this.status = status;
    this.detail = typeof detail === 'string' ? detail : detail?.detail || this.message;
  }
}

export function resolveMockProduct(ref) {
  if (ref === undefined || ref === null || ref === '') return null;
  const prods = initMockProducts();
  const refStr = String(ref).trim();
  const refNum = parseInt(refStr, 10);

  let found = prods.find((p) => {
    if (String(p.id) === refStr) return true;
    if (p.slug === refStr) return true;
    if (p.sku && p.sku.toLowerCase() === refStr.toLowerCase()) return true;
    if (!isNaN(refNum) && (p.legacy_id === refNum || p.id === `prod-${refNum}`)) return true;
    return false;
  });

  if (!found) {
    const seed = seedProducts.find((sp) => {
      if (String(sp.id) === refStr) return true;
      if (sp.slug === refStr) return true;
      if (sp.sku && sp.sku.toLowerCase() === refStr.toLowerCase()) return true;
      if (!isNaN(refNum) && sp.id === refNum) return true;
      return false;
    });
    if (seed) {
      const catSlug = seed.categorySlug || seed.shelfSlug || 'sweet';
      const catName = SHELF_NAMES[catSlug] || 'Sweet';
      const pricePaise = seed.pricePaise || seed.price || 28000;
      const imgSrc = seed.imageSrc || '/images/catalog/goan-themed-blue-mug.jpg';
      const imgAlt = seed.imageAlt || seed.title || seed.name || 'Goan product';
      found = {
        id: `prod-${seed.id}`,
        legacy_id: seed.id,
        sku: seed.sku || generateIdentifiableSku(seed, new Set()),
        slug: seed.slug,
        name: seed.title || seed.name,
        price_paise: pricePaise,
        price_formatted: `₹${(pricePaise / 100).toLocaleString('en-IN')}`,
        stock_qty: 50,
        reserved_qty: 0,
        is_active: true,
        status: 'published',
        category_name: catName,
        category_slug: catSlug,
        category: { id: catSlug, slug: catSlug, name: catName },
        unit_label: seed.weight || '250 g',
        net_weight_grams: seed.weightGrams || 250,
        description: seed.description || seed.shortDescription || '',
        short_description: seed.shortDescription || seed.description || '',
        image_url: imgSrc,
        images: [
          {
            id: `img-${seed.id}`,
            url: imgSrc,
            alt_text: imgAlt,
            is_primary: true,
            sort_order: 0,
          },
        ],
        primary_image: {
          id: `img-${seed.id}`,
          url: imgSrc,
          alt_text: imgAlt,
          is_primary: true,
        },
        // Frontend compatibility fields
        price: pricePaise,
        categorySlug: catSlug,
        categoryName: catName,
        shortDescription: seed.shortDescription || seed.description || '',
        weight: seed.weight || '250 g',
        weightGrams: seed.weightGrams || 250,
        imageAlt: imgAlt,
        imageSrc: imgSrc,
        gallery: seed.gallery || [imgSrc],
        inStock: true,
        origin: seed.origin || 'Made in Goa',
      };
    }
  }

  return found;
}


export const DEFAULT_MOCK_REVIEWS = [
  {
    id: 'rev-001',
    name: 'Gifty Abraham',
    author: 'Gifty Abraham',
    author_name: 'Gifty Abraham',
    stars: 5,
    rating: 5,
    description: 'Global to Local is a world of authentic Goan Treasures. A very aesthetic space with organic Goan delicacies and traditional items. Love the way they empower women through their business ideas. A must visit place.',
    quote: 'Global to Local is a world of authentic Goan Treasures. A very aesthetic space with organic Goan delicacies and traditional items. Love the way they empower women through their business ideas. A must visit place.',
    location: '',
    author_location: '',
    role: '',
    source: "Visitors' Book",
    is_approved: true,
    is_featured: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'rev-002',
    name: 'Stedwick Fernandes',
    author: 'Stedwick Fernandes',
    author_name: 'Stedwick Fernandes',
    stars: 5,
    rating: 5,
    description: "The store had Kokani music playing. The light shades were so much like the ones in my great granny's house. The staff was super courteous and hospitable...I will 100% recommend this store to family, friends and everyone I know.",
    quote: "The store had Kokani music playing. The light shades were so much like the ones in my great granny's house. The staff was super courteous and hospitable...I will 100% recommend this store to family, friends and everyone I know.",
    location: '',
    author_location: '',
    role: '',
    source: "Visitors' Book",
    is_approved: true,
    is_featured: true,
    created_at: '2024-01-20T14:30:00Z',
  },
  {
    id: 'rev-003',
    name: 'Swapna Pujari',
    author: 'Swapna Pujari',
    author_name: 'Swapna Pujari',
    stars: 5,
    rating: 5,
    description: 'Our go to place all such needs is Global to Local and I highly recommend Global to Local for authentic goan hampers and gifting requirements.',
    quote: 'Our go to place all such needs is Global to Local and I highly recommend Global to Local for authentic goan hampers and gifting requirements.',
    location: 'SilhouetteIndia',
    author_location: 'SilhouetteIndia',
    role: 'SilhouetteIndia',
    source: "Visitors' Book",
    is_approved: true,
    is_featured: true,
    created_at: '2024-02-05T09:15:00Z',
  },
];

export function initMockReviews() {
  const existing = localStorage.getItem(STORAGE_REVIEWS);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  localStorage.setItem(STORAGE_REVIEWS, JSON.stringify(DEFAULT_MOCK_REVIEWS));
  return [...DEFAULT_MOCK_REVIEWS];
}

function initMockAddresses() {
  const existing = localStorage.getItem(STORAGE_ADDRESSES);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  const initial = [
    {
      id: 'addr-1',
      recipient_name: 'Goan Shopper',
      phone: '+91 98765 43210',
      line1: 'House 14, 31st January Road, Fontainhas',
      city: 'Panaji',
      state: 'Goa',
      pincode: '403001',
      is_default: true,
      label: 'Home',
    },
  ];
  localStorage.setItem(STORAGE_ADDRESSES, JSON.stringify(initial));
  return initial;
}

function initMockOrders() {
  const existing = localStorage.getItem(STORAGE_ORDERS);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(
          (o) =>
            o.order_number &&
            !['GTL-2026-2A1E82F1', 'GTL-2026-4DB2743C', 'GTL-2026-06153F1B', 'GTL-2026-0FADE939', 'GTL-2026-1004', 'GTL-2026-1003', 'GTL-2026-1002', 'GTL-2026-1001'].includes(o.order_number) &&
            !String(o.order_number).startsWith('GTL-2026-100')
        );
        localStorage.setItem(STORAGE_ORDERS, JSON.stringify(clean));
        return clean;
      }
    } catch {}
  }
  const initial = [];
  localStorage.setItem(STORAGE_ORDERS, JSON.stringify(initial));
  return initial;
}

export function generateMockOrderNumber() {
  const year = new Date().getFullYear();
  const orders = initMockOrders();
  const prefix = `GTL-${year}-`;
  let maxSeq = 7232;
  orders.forEach((o) => {
    if (o.order_number && o.order_number.startsWith(prefix)) {
      const suffix = o.order_number.replace(prefix, '');
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });
  return `GTL-${year}-${maxSeq + 1}`;
}

/**
 * Handle API requests in client-side Standalone Mode
 */
export async function handleMockBackend(path, options = {}, method = 'GET') {
  const url = new URL(path, 'http://localhost');
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  // -------------------------------------------------------------
  // 1. AUTHENTICATION ENDPOINTS
  // -------------------------------------------------------------
  if (pathname === '/api/v1/auth/login' && method === 'POST') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const email = (body?.email || '').trim().toLowerCase();
    const isAdmin = email === 'admin@globaltolocal.in';

    if (isAdmin) {
      const storedPw = localStorage.getItem('gtl_admin_password') || 'AdminPass123!';
      if (body?.password !== storedPw) {
        throw new ApiProblemError(401, {
          title: 'Sign-In Failed',
          detail: 'Invalid email address or password.',
        });
      }
    }

    const user = {
      id: isAdmin ? '7654a59a-d3f2-488a-92c5-b32f898d97a9' : `user-${Date.now()}`,
      email: email || 'shopper@globaltolocal.in',
      phone: body?.phone || '+91 98799 98888',
      full_name: isAdmin ? 'Global to Local Admin' : (body?.name || 'Shopper'),
      name: isAdmin ? 'Global to Local Admin' : (body?.name || 'Shopper'),
      role: isAdmin ? 'admin' : 'customer',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_USER, JSON.stringify(user));

    return {
      user,
      access_token: 'mock-jwt-token-standalonemode',
      csrf_token: 'mock-csrf-token-standalonemode',
    };
  }

  if (pathname === '/api/v1/auth/otp/request' && method === 'POST') {
    return {
      status: 'otp_sent',
      message: 'A 6-digit verification code has been sent to your mobile number.',
      dev_otp: '123456',
    };
  }

  if (pathname === '/api/v1/auth/otp/verify' && method === 'POST') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const user = {
      id: `user-${Date.now()}`,
      email: body?.email || 'shopper@globaltolocal.in',
      phone: body?.phone || '+91 98765 43210',
      full_name: body?.name || 'Goan Shopper',
      name: body?.name || 'Goan Shopper',
      role: 'customer',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    return {
      user,
      access_token: 'mock-jwt-token-standalonemode',
      csrf_token: 'mock-csrf-token-standalonemode',
    };
  }

  if (pathname === '/api/v1/me' && method === 'GET') {
    const raw = localStorage.getItem(STORAGE_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    throw new ApiProblemError(401, { detail: 'Unauthorized. Please sign in.' });
  }

  if (pathname === '/api/v1/admin/me' && method === 'GET') {
    return {
      id: '7654a59a-d3f2-488a-92c5-b32f898d97a9',
      email: 'admin@globaltolocal.in',
      full_name: 'Global to Local Admin',
      role: 'admin',
      is_active: true,
    };
  }

  if (pathname === '/api/v1/auth/logout') {
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem('gtl_user_session');
    return { status: 'success' };
  }

  // -------------------------------------------------------------
  // 2. ADMIN DASHBOARD
  // -------------------------------------------------------------
  if (pathname === '/api/v1/admin/dashboard' && method === 'GET') {
    const products = initMockProducts();
    const orders = initMockOrders();
    const enquiries = initMockEnquiries();

    const revenue = orders
      .filter((o) => ['paid', 'packed', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);

    return {
      status: 'success',
      revenue_paise: revenue,
      revenue_formatted: `₹${(revenue / 100).toLocaleString('en-IN')}`,
      orders_count: orders.length,
      today_orders_count: 0,
      pending_orders_count: orders.filter((o) => ['paid', 'packed'].includes(o.status)).length,
      products_count: products.filter((p) => p.is_active).length,
      low_stock_count: products.filter((p) => p.stock_qty <= 5).length,
      new_enquiries_count: enquiries.filter((e) => e.status === 'new').length,
      pending_enquiries_count: enquiries.filter((e) => e.status === 'new').length,
      recent_orders: orders.slice(0, 5),
    };
  }

  // -------------------------------------------------------------
  // 3. ADMIN PRODUCTS & CATALOGUE
  // -------------------------------------------------------------
  if (pathname === '/api/v1/admin/products/next-sku' && method === 'GET') {
    const shelf = searchParams.get('shelf') || searchParams.get('category') || 'spices';
    const prefix = CATEGORY_PREFIXES[shelf] || 'SPIC';
    return { suggested_sku: `${prefix}-NEW-ITEM` };
  }

  if (pathname === '/api/v1/admin/products/images' && method === 'POST') {
    if (options.body instanceof FormData) {
      const file = options.body.get('file');
      if (file && typeof file === 'object') {
        try {
          const dataUrl = await fileToDataUrl(file);
          return { status: 'success', url: dataUrl };
        } catch {
          return { status: 'success', url: '/images/catalog/goan-themed-blue-mug.jpg' };
        }
      }
    }
    return { status: 'success', url: '/images/catalog/goan-themed-blue-mug.jpg' };
  }

  if (pathname === '/api/v1/admin/products' && method === 'GET') {
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const category = searchParams.get('category') || 'all';

    let list = initMockProducts();

    if (category && category !== 'all') {
      list = list.filter((p) => p.category_slug === category);
    }

    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }

    return {
      items: list,
      total: list.length,
      page: 1,
      page_size: 250,
    };
  }

  if (pathname === '/api/v1/admin/products' && method === 'POST') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const products = initMockProducts();
    const newId = `prod-${Date.now()}`;
    const pricePaise = body.price_paise || Math.round((parseFloat(body.price_rupees) || 350) * 100);
    const primaryImg = (body.images && body.images.find((img) => img.is_primary)) || body.images?.[0];

    const catSlug = body.shelf_slug || body.shelf || body.category_slug || 'spices';
    const autoSku = generateIdentifiableSku({
      name: body.name,
      slug: body.slug,
      categorySlug: catSlug,
    });

    const newProd = {
      id: newId,
      sku: body.sku || autoSku,
      slug: body.slug || `product-${Date.now()}`,
      name: body.name || 'New Product',
      price_paise: pricePaise,
      price_formatted: `₹${(pricePaise / 100).toLocaleString('en-IN')}`,
      stock_qty: parseInt(body.stock_qty, 10) || 50,
      reserved_qty: 0,
      is_active: body.status === 'Published',
      status: (body.status || 'Published').toLowerCase(),
      category_name: SHELF_NAMES[catSlug] || body.shelf || 'Spices',
      category_slug: catSlug,
      unit_label: body.unit_label || '250 g',
      net_weight_grams: parseInt(body.weight_grams || body.net_weight_grams, 10) || 250,
      description: body.description || '',
      origin_text: body.origin || body.origin_text || 'Made in Goa',
      is_featured: Boolean(body.is_featured),
      image_url: primaryImg?.url || primaryImg?.image_url || '/images/catalog/goan-themed-blue-mug.jpg',
      images: body.images || [
        {
          url: '/images/catalog/goan-themed-blue-mug.jpg',
          alt_text: body.name || 'Product photo',
          is_primary: true,
          sort_order: 0,
        },
      ],
      created_at: new Date().toISOString(),
    };

    // Prepend new product to top of list
    const updatedList = [newProd, ...products];
    localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(updatedList));

    return {
      status: 'success',
      product: newProd,
      ...newProd,
    };
  }

  // Update product details
  if (pathname.startsWith('/api/v1/admin/products/') && method === 'PUT') {
    const prodId = pathname.replace('/api/v1/admin/products/', '');
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const products = initMockProducts();
    const idx = products.findIndex((p) => p.id === prodId || p.slug === prodId);

    if (idx !== -1) {
      const existing = products[idx];
      const pricePaise = body.price_paise ?? existing.price_paise;
      const primaryImg = (body.images && body.images.find((img) => img.is_primary)) || body.images?.[0];

      const updated = {
        ...existing,
        ...body,
        price_paise: pricePaise,
        price_formatted: `₹${(pricePaise / 100).toLocaleString('en-IN')}`,
        stock_qty: body.stock_qty !== undefined ? parseInt(body.stock_qty, 10) : existing.stock_qty,
        category_name: body.shelf || body.category_slug || existing.category_name,
        category_slug: body.shelf_slug || body.shelf || body.category_slug || existing.category_slug,
        image_url: primaryImg?.url || primaryImg?.image_url || existing.image_url,
      };

      products[idx] = updated;
      localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));

      return {
        status: 'success',
        product: updated,
        ...updated,
      };
    }
  }

  // Price PATCH
  if (pathname.endsWith('/price') && method === 'PATCH') {
    const prodId = pathname.replace('/api/v1/admin/products/', '').replace('/price', '');
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const products = initMockProducts();
    const prod = products.find((p) => p.id === prodId || p.slug === prodId);
    if (prod) {
      const oldPrice = prod.price_paise;
      prod.price_paise = body.new_price_paise;
      prod.price_formatted = `₹${(body.new_price_paise / 100).toLocaleString('en-IN')}`;
      localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));

      // Append price audit log
      const historyRaw = localStorage.getItem(STORAGE_PRICE_HISTORY);
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.push({
        id: `audit-${Date.now()}`,
        product_id: prod.id,
        old_price_formatted: `₹${(oldPrice / 100).toLocaleString('en-IN')}`,
        new_price_formatted: prod.price_formatted,
        reason: body.reason || 'Manual price adjustment',
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_PRICE_HISTORY, JSON.stringify(history));

      return { status: 'success', price_paise: prod.price_paise };
    }
  }

  // Stock PATCH
  if (pathname.endsWith('/stock') && method === 'PATCH') {
    const prodId = pathname.replace('/api/v1/admin/products/', '').replace('/stock', '');
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const products = initMockProducts();
    const prod = products.find((p) => p.id === prodId || p.slug === prodId);
    if (prod) {
      prod.stock_qty = body.stock_qty;
      localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
      return { status: 'success', stock_qty: prod.stock_qty };
    }
  }

  // Status PATCH
  if (pathname.endsWith('/status') && method === 'PATCH') {
    const prodId = pathname.replace('/api/v1/admin/products/', '').replace('/status', '');
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const products = initMockProducts();
    const prod = products.find((p) => p.id === prodId || p.slug === prodId);
    if (prod) {
      prod.is_active = body.is_active !== undefined ? body.is_active : !prod.is_active;
      prod.status = prod.is_active ? 'published' : 'hidden';
      localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
      return { status: 'success', is_active: prod.is_active };
    }
  }

  // Price history
  if (pathname.endsWith('/price-history') && method === 'GET') {
    const prodId = pathname.replace('/api/v1/admin/products/', '').replace('/price-history', '');
    const historyRaw = localStorage.getItem(STORAGE_PRICE_HISTORY);
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    return history.filter((h) => h.product_id === prodId);
  }

  // -------------------------------------------------------------
  // 4. ADMIN DASHBOARD & ORDERS (Standalone Preview)
  // -------------------------------------------------------------
  if (pathname === '/api/v1/admin/dashboard' && method === 'GET') {
    const products = initMockProducts();
    const orders = initMockOrders();
    const enquiries = initMockEnquiries();

    const revenue = orders
      .filter((o) => ['paid', 'packed', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);

    return {
      revenue_paise: revenue,
      revenue_formatted: `₹${(revenue / 100).toLocaleString('en-IN')}`,
      orders_count: orders.length,
      products_count: products.length,
      low_stock_count: products.filter((p) => p.stock_qty <= 5).length,
      pending_enquiries_count: enquiries.filter((e) => e.status === 'new').length,
      recent_orders: orders.slice(0, 5),
    };
  }

  
  if (pathname === '/api/v1/orders' && method === 'POST') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const orderNumber = generateMockOrderNumber();
    const orders = initMockOrders();
    const newOrder = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      status: 'paid',
      placed_at: new Date().toISOString(),
      items: body?.items || [],
      shipping_address: body?.delivery_address || {},
      total_paise: body?.total_paise || 0,
      total_formatted: `₹${((body?.total_paise || 0) / 100).toFixed(2)}`,
    };
    orders.unshift(newOrder);
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
    return newOrder;
  }

  if (pathname === '/api/v1/admin/orders' && method === 'GET') {
    const status = searchParams.get('status') || 'all';
    const q = (searchParams.get('q') || '').trim().toLowerCase();

    let orders = initMockOrders();
    if (status && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }
    if (q) {
      orders = orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.toLowerCase().includes(q)
      );
    }
    return { items: orders, total: orders.length };
  }

  if (pathname.startsWith('/api/v1/admin/orders/') && method === 'GET') {
    const id = pathname.replace('/api/v1/admin/orders/', '');
    const cleanId = id.replace(/^#/, '');
    const orders = initMockOrders();
    const ord = orders.find(
      (o) =>
        o.id === id ||
        o.id === cleanId ||
        o.order_number === id ||
        o.order_number.replace(/^#/, '') === cleanId
    );
    if (ord) return ord;
  }

  if (pathname.startsWith('/api/v1/admin/orders/') && pathname.endsWith('/status') && method === 'PATCH') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const orderId = pathname.replace('/api/v1/admin/orders/', '').replace('/status', '');
    const cleanId = orderId.replace(/^#/, '');
    const orders = initMockOrders();
    const ord = orders.find(
      (o) =>
        o.id === orderId ||
        o.id === cleanId ||
        o.order_number === orderId ||
        o.order_number.replace(/^#/, '') === cleanId
    );
    if (ord && body?.status) {
      ord.status = body.status;
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
      return { status: 'success', current_status: ord.status, order: ord };
    }
  }

  if (pathname.startsWith('/api/v1/admin/orders/') && pathname.endsWith('/notes') && method === 'POST') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const orderId = pathname.replace('/api/v1/admin/orders/', '').replace('/notes', '');
    const cleanId = orderId.replace(/^#/, '');
    const orders = initMockOrders();
    const ord = orders.find(
      (o) =>
        o.id === orderId ||
        o.id === cleanId ||
        o.order_number === orderId ||
        o.order_number.replace(/^#/, '') === cleanId
    );
    if (ord && body?.text) {
      if (!ord.notes) ord.notes = [];
      const newNote = { id: `n-${Date.now()}`, text: body.text, created_at: new Date().toISOString() };
      ord.notes.push(newNote);
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
      return newNote;
    }
  }

  // -------------------------------------------------------------
  // 5. ADMIN CUSTOMERS
  // -------------------------------------------------------------
  if (pathname === '/api/v1/admin/customers' && method === 'GET') {
    const customers = initMockCustomers();
    return { items: customers, total: customers.length };
  }

  // -------------------------------------------------------------
  // 6. ADMIN ENQUIRIES
  // -------------------------------------------------------------
  if (pathname === '/api/v1/admin/enquiries' && method === 'GET') {
    const enquiries = initMockEnquiries();
    return { items: enquiries, total: enquiries.length };
  }

  if (pathname.startsWith('/api/v1/admin/enquiries/') && pathname.endsWith('/status') && method === 'PATCH') {
    const id = pathname.replace('/api/v1/admin/enquiries/', '').replace('/status', '');
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const enquiries = initMockEnquiries();
    const enq = enquiries.find((e) => e.id === id);
    if (enq && body?.status) {
      enq.status = body.status;
      localStorage.setItem(STORAGE_ENQUIRIES, JSON.stringify(enquiries));
      return { status: 'success', enquiry: enq };
    }
  }

  // -------------------------------------------------------------
  // 7. PUBLIC STORE FALLBACK (/api/v1/products, /categories)
  // -------------------------------------------------------------
  
  // -------------------------------------------------------------
  // CUSTOMER REVIEWS (PUBLIC & ADMIN)
  // -------------------------------------------------------------
  if (pathname === '/api/v1/reviews' && method === 'GET') {
    const reviews = initMockReviews();
    return { items: reviews, total: reviews.length };
  }

  if (pathname === '/api/v1/admin/reviews' && method === 'GET') {
    const reviews = initMockReviews();
    return { items: reviews, total: reviews.length };
  }

  if (pathname === '/api/v1/admin/reviews' && method === 'POST') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const reviews = initMockReviews();
    const newReview = {
      id: `rev-${Date.now()}`,
      name: body.name || body.author || 'Store Customer',
      author: body.name || body.author || 'Store Customer',
      author_name: body.name || body.author || 'Store Customer',
      stars: Math.max(1, Math.min(5, Number(body.stars || body.rating || 5))),
      rating: Math.max(1, Math.min(5, Number(body.stars || body.rating || 5))),
      description: body.description || body.quote || '',
      quote: body.description || body.quote || '',
      location: body.location || body.role || '',
      author_location: body.location || body.role || '',
      role: body.location || body.role || '',
      source: "Visitors' Book",
      is_approved: true,
      is_featured: true,
      created_at: new Date().toISOString(),
    };
    reviews.unshift(newReview);
    localStorage.setItem(STORAGE_REVIEWS, JSON.stringify(reviews));
    return newReview;
  }

  if (pathname.startsWith('/api/v1/admin/reviews/') && method === 'DELETE') {
    const revId = pathname.replace('/api/v1/admin/reviews/', '').trim();
    let reviews = initMockReviews();
    reviews = reviews.filter((r) => r.id !== revId);
    localStorage.setItem(STORAGE_REVIEWS, JSON.stringify(reviews));
    return { status: 'success', message: 'Review deleted successfully' };
  }

  // ADMIN NEWS & PRESS
  if ((pathname === '/api/v1/admin/news' || pathname === '/api/v1/press') && method === 'GET') {
    const news = initMockNews();
    return { items: news, articles: news, awards: [], total: news.length };
  }

  if (pathname === '/api/v1/admin/news' && method === 'POST') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const news = initMockNews();
    const newArticle = {
      id: `news-${Date.now()}`,
      publication: body.publication || 'Press Outlet',
      title: body.title || 'Global to Local in the News',
      date: body.date || 'October 2026',
      url: body.url || '#',
      created_at: new Date().toISOString(),
    };
    news.unshift(newArticle);
    localStorage.setItem(STORAGE_NEWS, JSON.stringify(news));
    return newArticle;
  }

  if (pathname.startsWith('/api/v1/admin/news/') && method === 'DELETE') {
    const newsId = pathname.replace('/api/v1/admin/news/', '').trim();
    let news = initMockNews();
    news = news.filter((n) => n.id !== newsId);
    localStorage.setItem(STORAGE_NEWS, JSON.stringify(news));
    return { status: 'success', message: 'News article deleted successfully' };
  }

  if (pathname === '/api/v1/categories') {
    return { items: seedCategories };
  }

  if (pathname === '/api/v1/products' && method === 'GET') {
    const products = initMockProducts();
    const published = products.filter((p) => p.is_active !== false && String(p.status || '').toLowerCase() === 'published');
    const category = searchParams.get('category') || searchParams.get('shelf');
    let filtered = published;
    if (category && category !== 'all') {
      filtered = filtered.filter((p) => p.category_slug === category || p.categorySlug === category);
    }
    return {
      items: filtered,
      meta: { total: filtered.length, page: 1, total_pages: 1 },
    };
  }

  if (pathname.startsWith('/api/v1/products/') && method === 'GET') {
    const slugOrId = decodeURIComponent(pathname.replace('/api/v1/products/', ''));
    const prod = resolveMockProduct(slugOrId);
    if (!prod || prod.is_active === false || String(prod.status || '').toLowerCase() !== 'published') {
      throw new MockProblemError(404, `Product '${slugOrId}' not found.`);
    }
    const prods = initMockProducts();
    const related = prods
      .filter((p) => p.category_slug === prod.category_slug && p.id !== prod.id && p.is_active !== false && String(p.status || '').toLowerCase() === 'published')
      .slice(0, 4);
    return {
      ...prod,
      gallery: prod.images ? prod.images.map((img) => img.url) : [prod.image_url],
      related_products: related,
    };
  }

  // -------------------------------------------------------------
  // 8. CUSTOMER ADDRESSES (/api/v1/me/addresses)
  // -------------------------------------------------------------
  if (pathname === '/api/v1/me/addresses' && method === 'GET') {
    return { items: initMockAddresses() };
  }

  if (pathname === '/api/v1/me/addresses' && method === 'POST') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const addrs = initMockAddresses();
    const newAddr = {
      id: `addr-${Date.now()}`,
      recipient_name: body?.name || body?.recipient_name || 'Customer',
      phone: body?.phone || '+91 98765 43210',
      line1: body?.line1 || '',
      city: body?.city || 'Panaji',
      state: body?.state || 'Goa',
      pincode: body?.pincode || '403001',
      is_default: addrs.length === 0,
      label: body?.label || 'Delivery',
    };
    addrs.push(newAddr);
    localStorage.setItem(STORAGE_ADDRESSES, JSON.stringify(addrs));
    return newAddr;
  }

  if (pathname.startsWith('/api/v1/me/addresses/') && pathname.endsWith('/default') && method === 'POST') {
    const addrId = pathname.replace('/api/v1/me/addresses/', '').replace('/default', '');
    const addrs = initMockAddresses();
    for (const a of addrs) {
      a.is_default = a.id === addrId;
    }
    localStorage.setItem(STORAGE_ADDRESSES, JSON.stringify(addrs));
    return { status: 'success' };
  }

  if (pathname.startsWith('/api/v1/me/addresses/') && method === 'PUT') {
    const addrId = pathname.replace('/api/v1/me/addresses/', '');
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const addrs = initMockAddresses();
    const target = addrs.find((a) => a.id === addrId);
    if (target) {
      Object.assign(target, body);
      localStorage.setItem(STORAGE_ADDRESSES, JSON.stringify(addrs));
    }
    return target || { status: 'success' };
  }

  if (pathname.startsWith('/api/v1/me/addresses/') && method === 'DELETE') {
    const addrId = pathname.replace('/api/v1/me/addresses/', '');
    let addrs = initMockAddresses();
    addrs = addrs.filter((a) => a.id !== addrId);
    localStorage.setItem(STORAGE_ADDRESSES, JSON.stringify(addrs));
    return { status: 'success' };
  }

  // -------------------------------------------------------------
  // 12. CUSTOMER AUTH / PROFILE EXTRA ENDPOINTS
  // -------------------------------------------------------------
  if (pathname === '/api/v1/auth/register' && method === 'POST') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const user = {
      id: `user-${Date.now()}`,
      email: (body?.email || 'shopper@globaltolocal.in').trim().toLowerCase(),
      phone: body?.phone || '+91 98765 43210',
      full_name: body?.name || 'Shopper',
      name: body?.name || 'Shopper',
      role: 'customer',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    return {
      user,
      access_token: 'mock-jwt-token-standalonemode',
      csrf_token: 'mock-csrf-token-standalonemode',
    };
  }

  if (pathname === '/api/v1/auth/password/forgot' && method === 'POST') {
    return { status: 'success', message: 'Password reset link sent.' };
  }

  if (pathname === '/api/v1/auth/password/reset' && method === 'POST') {
    return { status: 'success', message: 'Password has been updated.' };
  }

  if (pathname === '/api/v1/me' && method === 'PATCH') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const raw = localStorage.getItem(STORAGE_USER);
    let user = raw ? JSON.parse(raw) : {};
    user = { ...user, ...body };
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    return user;
  }

  if (pathname === '/api/v1/me/password' && method === 'POST') {
    let body = options.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const storedPw = localStorage.getItem('gtl_admin_password') || 'AdminPass123!';
    if (body?.current_password && body.current_password !== storedPw) {
      throw new ApiProblemError(400, {
        title: 'Current Password Incorrect',
        detail: 'The current password you entered does not match our records.',
      });
    }
    if (body?.new_password) {
      localStorage.setItem('gtl_admin_password', body.new_password);
    }
    return { status: 'password_updated', message: 'Password updated successfully.' };
  }

  return undefined;
}
