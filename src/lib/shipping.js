const WEIGHT_UNIT_RE = /(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|g|gm|gms|gram|grams)\b/i;
const NON_WEIGHT_UNIT_RE = /(?:\b|\d)(piece|pieces|pc|pcs|unit|units|ml|ltr|litre|litres|liter|liters)\b/i;

export function getProductWeightGrams(product) {
  const label = String(product?.weight || product?.unit_label || product?.unit || '').trim();
  if (!label || NON_WEIGHT_UNIT_RE.test(label)) {
    return 0;
  }
  const match = label.match(WEIGHT_UNIT_RE);
  if (!match) {
    return 0;
  }
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const grams = unit.startsWith('k') ? val * 1000 : val;
  return Number.isFinite(grams) && grams > 0 ? Math.round(grams) : 0;
}

export function getOrderWeightGrams(items = []) {
  return items.reduce((sum, entry) => {
    const qty = Math.max(0, Number(entry?.qty ?? entry?.quantity ?? 0));
    return sum + getProductWeightGrams(entry?.product || entry) * qty;
  }, 0);
}

export function calculateDeliveryChargePaise(weightGrams) {
  const w = Math.max(0, Math.round(Number(weightGrams) || 0));
  if (w <= 3000) {
    return 20000;
  }
  const extraKgSlabs = Math.ceil((w - 3000) / 1000);
  return 20000 + extraKgSlabs * 10000;
}
