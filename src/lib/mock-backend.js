import { products as seedProducts, categories as seedCategories } from './data';

// LocalStorage Keys
const STORAGE_USER = 'gtl_mock_auth_user_v1';
const STORAGE_PRODUCTS = 'gtl_mock_products_v3';
const STORAGE_CUSTOMERS = 'gtl_mock_customers_v2';
const STORAGE_ENQUIRIES = 'gtl_mock_enquiries_v1';
const STORAGE_PRICE_HISTORY = 'gtl_mock_price_history_v1';
const STORAGE_ADDRESSES = 'gtl_mock_addresses_v1';
const STORAGE_ORDERS = 'gtl_mock_orders_v2';

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
      return JSON.parse(existing);
    } catch {}
  }

  const initial = [
    {
      id: 'cust-1',
      name: 'Maria Fernandes',
      full_name: 'Maria Fernandes',
      email: 'maria.fernandes@example.com',
      phone: '+91 98221 23456',
      orders_count: 2,
      total_spent_paise: 170000,
      city: 'Panaji',
      state: 'Goa',
      pincode: '403001',
      is_active: true,
      created_at: '2026-09-29T10:00:00Z',
    },
    {
      id: 'cust-2',
      name: 'Rahul Naik',
      full_name: 'Rahul Naik',
      email: 'rahul.naik@example.com',
      phone: '+91 98909 87654',
      orders_count: 2,
      total_spent_paise: 182000,
      city: 'Margao',
      state: 'Goa',
      pincode: '403601',
      is_active: true,
      created_at: '2026-10-04T12:00:00Z',
    },
    {
      id: 'cust-3',
      name: 'Sancho Fernandes',
      full_name: 'Sancho Fernandes',
      email: 'sancho.fernandes@example.com',
      phone: '+91 98221 45012',
      orders_count: 1,
      total_spent_paise: 104000,
      city: 'Panaji',
      state: 'Goa',
      pincode: '403001',
      is_active: true,
      created_at: '2026-10-10T14:00:00Z',
    },
    {
      id: 'cust-4',
      name: 'Pooja Naik',
      full_name: 'Pooja Naik',
      email: 'pooja.naik@example.com',
      phone: '+91 98765 43210',
      orders_count: 1,
      total_spent_paise: 78000,
      city: 'Margao',
      state: 'Goa',
      pincode: '403601',
      is_active: true,
      created_at: '2026-10-12T09:00:00Z',
    },
    {
      id: 'cust-5',
      name: 'Max',
      full_name: 'Max',
      email: 'max@example.com',
      phone: '+91 97425 68876',
      orders_count: 1,
      total_spent_paise: 26000,
      city: 'Mapusa',
      state: 'Goa',
      pincode: '403507',
      is_active: true,
      created_at: '2026-10-14T08:00:00Z',
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
      order_number: 'GTL-20261010-0101',
      customer_name: 'Goan Heritage Shopper',
      customer_email: 'shopper@globaltolocal.in',
      customer_phone: '+91 98765 43210',
      status: 'delivered',
      total_paise: 148000,
      subtotal_paise: 140000,
      shipping_paise: 8000,
      shipping_method: 'Goa Express ₹80',
      shipping_address: {
        name: 'Goan Heritage Shopper',
        phone: '+91 98765 43210',
        line1: 'Heritage Villa 12, Fontainhas',
        line2: '31st January Road',
        city: 'Panaji',
        state: 'Goa',
        pincode: '403001',
      },
      placed_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      items_count: 3,
      items: [
        {
          id: 'item-1',
          name: 'Traditional Goan Bebinca 500g',
          sku: 'SWET-BEBI-500G',
          quantity: 2,
          unit_price_paise: 55000,
          line_total_paise: 110000,
          image_url: '/images/catalog/bebinca-500-grams.jpg',
        },
        {
          id: 'item-2',
          name: 'Crisp Wine Biscuits 200g',
          sku: 'SWET-WINE-BISC',
          quantity: 1,
          unit_price_paise: 30000,
          line_total_paise: 30000,
          image_url: '/images/catalog/wine-biscuits-200-grams.jpg',
        },
      ],
      shipment: {
        carrier: 'Blue Dart',
        tracking_number: 'BD789123456IN',
        tracking_url: 'https://www.bluedart.com/tracking?track=BD789123456IN',
        delivered: true,
      },
      notes: [{ id: 'n1', text: 'Delivered to security desk as instructed.', created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() }],
    },
    {
      id: 'ord-002',
      order_number: 'GTL-20261012-0102',
      customer_name: 'Maria Fernandes',
      customer_email: 'maria.fernandes@example.com',
      customer_phone: '+91 98221 23456',
      status: 'shipped',
      total_paise: 92000,
      subtotal_paise: 84000,
      shipping_paise: 8000,
      shipping_method: 'Goa Express ₹80',
      shipping_address: {
        name: 'Maria Fernandes',
        phone: '+91 98221 23456',
        line1: 'House No. 42, Fontainhas Latin Quarter',
        line2: 'Near St. Sebastian Chapel',
        city: 'Panaji',
        state: 'Goa',
        pincode: '403001',
      },
      placed_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      items_count: 4,
      items: [
        {
          id: 'item-3',
          name: 'Handcrafted Musk Incense 80g',
          sku: 'WELL-AGAR-MUSK',
          quantity: 3,
          unit_price_paise: 18000,
          line_total_paise: 54000,
          image_url: '/images/catalog/agarbatti--musk-80-grams.jpg',
        },
        {
          id: 'item-4',
          name: 'Spicy Balchão Masala Paste 250g',
          sku: 'MASL-BALC-PAST',
          quantity: 1,
          unit_price_paise: 30000,
          line_total_paise: 30000,
          image_url: '/images/catalog/balchao-masala-paste-250-grams.jpg',
        },
      ],
      shipment: {
        carrier: 'Delhivery',
        tracking_number: 'DLV998877665',
        tracking_url: 'https://www.delhivery.com/track/package/DLV998877665',
        delivered: false,
      },
      notes: [{ id: 'n2', text: 'Dispatched via local van.', created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }],
    },
    {
      id: 'ord-003',
      order_number: 'GTL-20261013-0103',
      customer_name: 'Rahul Naik',
      customer_email: 'rahul.naik@example.com',
      customer_phone: '+91 98909 87654',
      status: 'packed',
      total_paise: 156000,
      subtotal_paise: 144000,
      shipping_paise: 12000,
      shipping_method: 'Pan-India Standard ₹120',
      shipping_address: {
        name: 'Rahul Naik',
        phone: '+91 98909 87654',
        line1: '104, Sea Green Apartments, Bandra West',
        line2: 'Hill Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
      },
      placed_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      items_count: 6,
      items: [
        {
          id: 'item-5',
          name: 'Crispy Aataa Rings',
          sku: 'FARS-AATA-RING',
          quantity: 4,
          unit_price_paise: 21000,
          line_total_paise: 84000,
          image_url: '/images/catalog/aataa-rings.jpg',
        },
        {
          id: 'item-6',
          name: 'Fiery Ambot Tik Masala Paste 250g',
          sku: 'MASL-AMBT-PAST',
          quantity: 2,
          unit_price_paise: 30000,
          line_total_paise: 60000,
          image_url: '/images/catalog/ambot-tik-masala-paste-250-grams.jpg',
        },
      ],
      notes: [{ id: 'n3', text: 'Fragile snack items; packed with extra honeycomb padding.', created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString() }],
    },
    {
      id: 'ord-004',
      order_number: 'GTL-20261014-0104',
      customer_name: 'Sancho Fernandes',
      customer_email: 'sancho.fernandes@example.com',
      customer_phone: '+91 98221 45012',
      status: 'paid',
      total_paise: 104000,
      subtotal_paise: 96000,
      shipping_paise: 8000,
      shipping_method: 'Goa Express ₹80',
      shipping_address: {
        name: 'Sancho Fernandes',
        phone: '+91 98221 45012',
        line1: 'House No. 42, Near Church',
        city: 'Panaji',
        state: 'Goa',
        pincode: '403001',
      },
      placed_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      items_count: 3,
      items: [
        {
          id: 'item-7',
          name: 'Coconut Oil Fried Banana Chips 500g',
          sku: 'FARS-BANA-CHIP',
          quantity: 2,
          unit_price_paise: 33000,
          line_total_paise: 66000,
          image_url: '/images/catalog/banana-chips-in-coconut-oil-500-grams.jpg',
        },
        {
          id: 'item-8',
          name: 'Pure Goan Cashew Vinegar 700ml',
          sku: 'OILS-CASH-VINE',
          quantity: 1,
          unit_price_paise: 30000,
          line_total_paise: 30000,
          image_url: '/images/catalog/cashew-vinegar-700-ml.jpg',
        },
      ],
      notes: [{ id: 'n4', text: 'Verified payment signature. Ready for packaging.', created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString() }],
    },
    {
      id: 'ord-005',
      order_number: 'GTL-20261014-0105',
      customer_name: 'Pooja Naik',
      customer_email: 'pooja.naik@example.com',
      customer_phone: '+91 98765 43210',
      status: 'pending_payment',
      total_paise: 78000,
      subtotal_paise: 70000,
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
      placed_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      items_count: 2,
      items: [
        {
          id: 'item-9',
          name: 'Goan Themed Ceramic Blue Mug',
          sku: 'CRFT-BLUE-MUG',
          quantity: 2,
          unit_price_paise: 35000,
          line_total_paise: 70000,
          image_url: '/images/catalog/goan-themed-blue-mug.jpg',
        },
      ],
      notes: [],
    },
    {
      id: 'ord-006',
      order_number: 'GTL-20261011-0106',
      customer_name: 'Max',
      customer_email: 'max@example.com',
      customer_phone: '+91 97425 68876',
      status: 'cancelled',
      cancel_reason: 'Customer cancelled before payment',
      total_paise: 26000,
      subtotal_paise: 18000,
      shipping_paise: 8000,
      shipping_method: 'Goa Express ₹80',
      shipping_address: {
        name: 'Max',
        phone: '+91 97425 68876',
        line1: 'Near St. Jerome Church',
        city: 'Mapusa',
        state: 'Goa',
        pincode: '403507',
      },
      placed_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      items_count: 1,
      items: [
        {
          id: 'item-10',
          name: 'Stone-Ground Black Pepper 50g',
          sku: 'SPIC-BLCK-PEPP',
          quantity: 1,
          unit_price_paise: 18000,
          line_total_paise: 18000,
          image_url: '/images/catalog/black-pepper-50-grams.jpg',
        },
      ],
      notes: [{ id: 'n6', text: 'Auto-cancelled due to payment session expiry.', created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() }],
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
