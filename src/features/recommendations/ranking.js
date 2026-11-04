// Pure helpers (no network, no model): query text, keyword fallback, and plain-language reasons.

export const DISCLAIMER =
  'Recommendations are based on style and shop-approved placements. Your piercer confirms final suitability during your appointment.';

const peso = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);

export function buildQueryText({ style, material, color, freeText } = {}) {
  const parts = [];
  if (style) parts.push(`${style} style`);
  if (material) parts.push(`${material} material`);
  if (color) parts.push(`${color} color`);
  const attrs = parts.length ? `Looking for jewelry: ${parts.join(', ')}.` : '';
  return [attrs, (freeText || '').trim()].filter(Boolean).join(' ');
}

const STOP = new Set(['the', 'and', 'for', 'with', 'looking', 'jewelry', 'style', 'material', 'color', 'something', 'want', 'like', 'that', 'this', 'very', 'piece']);

export function tokenize(text) {
  const words = (text || '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return [...new Set(words.filter((w) => w.length >= 3 && !STOP.has(w)))];
}

// Used when the AI model cannot load: simple keyword overlap, clearly labelled as non-AI by the caller.
export function keywordRank(items, queryText, topK = 3) {
  const tokens = tokenize(queryText);
  const scored = items.map((item) => {
    const hay = [item.name, item.description, item.style, item.material, item.color].filter(Boolean).join(' ').toLowerCase();
    const hits = tokens.filter((t) => hay.includes(t)).length;
    return { item, score: tokens.length ? hits / tokens.length : 0 };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

const same = (a, b) => a && b && String(a).toLowerCase() === String(b).toLowerCase();

// Explanations come ONLY from real catalog data, never invented.
export function buildReasons(item, prefs = {}, { piercingName, mode } = {}) {
  const reasons = [];
  if (same(item.style, prefs.style)) reasons.push(`${item.style} style, as you asked`);
  if (same(item.material, prefs.material)) reasons.push(`Made of ${item.material}, as you asked`);
  if (same(item.color, prefs.color)) reasons.push(`${item.color}, as you asked`);
  if (prefs.budget && Number(item.price) <= Number(prefs.budget)) {
    reasons.push(`Within your budget (${peso(item.price)} of ${peso(prefs.budget)})`);
  }
  if (piercingName) reasons.push(`Shop-approved for ${piercingName} piercings`);
  if (mode === 'ai' && prefs.freeText?.trim()) reasons.push('Its description closely matches what you described');
  if (mode === 'fallback' && prefs.freeText?.trim()) reasons.push('Its description shares keywords with what you described');
  if (item.stock > 0) reasons.push('In stock');
  return reasons;
}
