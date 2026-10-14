import { products as seedProducts, categories as seedCategories } from './data';

// LocalStorage Keys
const STORAGE_USER = 'gtl_mock_auth_user_v1';
const STORAGE_PRODUCTS = 'gtl_mock_products_v2';
const STORAGE_CUSTOMERS = 'gtl_mock_customers_v1';
const STORAGE_ENQUIRIES = 'gtl_mock_enquiries_v1';
const STORAGE_PRICE_HISTORY = 'gtl_mock_price_history_v1';
const STORAGE_ADDRESSES = 'gtl_mock_addresses_v1';
const STORAGE_ORDERS = 'gtl_mock_orders_v1';

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
    const catSlug = p.categorySlug || p.shelfSlug || 'spices';
    const catName = SHELF_NAMES[catSlug] || p.shelf || 'Spices';
    const pricePaise = p.pricePaise || p.price || 35000;

    return {
      id: `prod-${p.id || idx + 1}`,
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
      unit_label: p.weight || '250 g',
      net_weight_grams: p.weightGrams || 250,
      description: p.description || p.shortDescription || '',
      origin_text: p.origin || 'Made in Goa',
      is_featured: Boolean(p.isFeatured),
      image_url: p.imageSrc || '/images/catalog/goan-themed-blue-mug.jpg',
      images: [
        {
          id: `img-${p.id || idx + 1}`,
          url: p.imageSrc || '/images/catalog/goan-themed-blue-mug.jpg',
          alt_text: p.title || p.name,
          is_primary: true,
          sort_order: 0,
        },
      ],
    };
  });

  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(initial));
  return initial;
}

function initMockCustomers() {
  const existing = localStorage.getItem(STORAGE_CUSTOMERS);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {}
  }

  const initial = [
    {
      id: 'cust-1',
      name: 'Sancho Fernandes',
      full_name: 'Sancho Fernandes',
      email: 'sancho.fernandes@example.com',
      phone: '+91 98221 45012',
      orders_count: 4,
      total_spent_paise: 2450000,
      city: 'Panaji',
      state: 'Goa',
      pincode: '403001',
      is_active: true,
      created_at: '2026-08-14T10:00:00Z',
    },
    {
      id: 'cust-2',
      name: 'Pooja Naik',
      full_name: 'Pooja Naik',
      email: 'pooja.naik@example.com',
      phone: '+91 98765 43210',
      orders_count: 2,
      total_spent_paise: 840000,
      city: 'Margao',
      state: 'Goa',
      pincode: '403601',
      is_active: true,
      created_at: '2026-09-01T12:00:00Z',
    },
    {
      id: 'cust-3',
      name: 'Rahul Shenoy',
      full_name: 'Rahul Shenoy',
      email: 'rahul.s@example.com',
      phone: '+91 91234 56789',
      orders_count: 1,
      total_spent_paise: 890000,
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      is_active: true,
      created_at: '2026-09-20T14:00:00Z',
    },
  ];

  localStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(initial));
  return initial;
}

function initMockEnquiries() {
  const existing = localStorage.getItem(STORAGE_ENQUIRIES);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {}
  }

  const initial = [
    {
      id: 'enq-1',
      name: 'Taj Exotica Hospitality',
      email: 'procurement@tajexotica.com',
      phone: '+91 832 6683333',
      type: 'bulk',
      type_label: 'Bulk Corporate',
      message: 'Looking for 150 curated Goan spice and cashew hampers for our annual leadership conference.',
      status: 'new',
      created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'enq-2',
      name: 'Ananya Deshpande',
      email: 'ananya.d@gmail.com',
      phone: '+91 99887 76655',
      type: 'hamper',
      type_label: 'Custom Hamper',
      message: 'Need 50 bespoke Diwali gift hampers containing handcrafted kokum soap, honey, and kunbi stoles.',
      status: 'in_progress',
      created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    },
  ];

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
      const pricePaise = seed.pricePaise || seed.price || 28000;
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
        category_name: SHELF_NAMES[catSlug] || 'Sweet',
        category_slug: catSlug,
        unit_label: seed.weight || '250 g',
        net_weight_grams: seed.weightGrams || 250,
        image_url: seed.imageSrc || '/images/catalog/goan-themed-blue-mug.jpg',
      };
    }
  }

  return found;
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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  const initial = [
    {
      id: 'ord-001',
      order_number: 'GTL-2026-1042',
      customer_name: 'Sancho Fernandes',
      customer_email: 'sancho.fernandes@example.com',
      customer_phone: '+91 98221 45012',
      status: 'paid',
      total_paise: 685000,
      subtotal_paise: 673000,
      shipping_paise: 12000,
      shipping_method: 'Pan-India Standard ₹120',
      shipping_address: {
        name: 'Sancho Fernandes',
        phone: '+91 98221 45012',
        line1: 'House No. 42, Near Church',
        city: 'Panaji',
        state: 'Goa',
        pincode: '403001',
      },
      placed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      items_count: 2,
      items: [
        {
          id: 'item-1',
          name: 'Goan Kokum Butter Soap',
          sku: 'CRFT-KOKU-BUTT',
          quantity: 2,
          unit_price_paise: 24000,
          total_price_paise: 48000,
          image_url: '/images/catalog/goan-themed-blue-mug.jpg',
        },
        {
          id: 'item-2',
          name: 'Traditional Chouriço Masala',
          sku: 'MASL-CHOU-MASA',
          quantity: 1,
          unit_price_paise: 625000,
          total_price_paise: 625000,
          image_url: '/images/catalog/white-chawli-200-grams.jpg',
        },
      ],
      notes: [{ id: 'n1', text: 'Verified Goan pincode 403001', created_at: new Date().toISOString() }],
    },
    {
      id: 'ord-002',
      order_number: 'GTL-2026-1041',
      customer_name: 'Pooja Naik',
      customer_email: 'pooja.naik@example.com',
      customer_phone: '+91 98765 43210',
      status: 'packed',
      total_paise: 420000,
      subtotal_paise: 412000,
      shipping_paise: 8000,
      shipping_method: 'Goa Express ₹80',
      shipping_address: {
        name: 'Pooja Naik',
        phone: '+91 98765 43210',
        line1: 'Flat 302, Palm View',
        city: 'Margao',
        state: 'Goa',
        pincode: '403601',
      },
      placed_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      items_count: 1,
      items: [
        {
          id: 'item-3',
          name: 'Goan Cashew Feni Dark Chocolate',
          sku: 'SWET-GOAN-CASH',
          quantity: 2,
          unit_price_paise: 206000,
          total_price_paise: 412000,
          image_url: '/images/catalog/perad-guava-cheese-200g.jpg',
        },
      ],
      notes: [],
    },
  ];
  localStorage.setItem(STORAGE_ORDERS, JSON.stringify(initial));
  return initial;
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
    // Default to admin if accessed in back-office context
    const defaultUser = {
      id: '7654a59a-d3f2-488a-92c5-b32f898d97a9',
      email: 'admin@globaltolocal.in',
      full_name: 'Global to Local Admin',
      name: 'Global to Local Admin',
      role: 'admin',
      is_active: true,
    };
    return defaultUser;
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
    return { status: 'success' };
  }

  // -------------------------------------------------------------
  // 2. ADMIN DASHBOARD
  // -------------------------------------------------------------
  if (pathname === '/api/v1/admin/dashboard' && method === 'GET') {
    const products = initMockProducts();
    const enquiries = initMockEnquiries();

    return {
      status: 'success',
      today_orders_count: 0,
      pending_orders_count: 0,
      revenue_paise: 0,
      products_count: products.filter((p) => p.is_active).length,
      new_enquiries_count: enquiries.filter((e) => e.status === 'new').length,
      recent_orders: [],
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

  return undefined;
}
