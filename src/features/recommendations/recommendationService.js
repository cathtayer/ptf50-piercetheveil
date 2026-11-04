import { listJewelry, listPiercingTypes } from '../jewelry/jewelryService';
import { embedText } from './embeddingService';
import { fetchEmbeddings, isIndexFresh } from './embeddingStore';
import { cosineSimilarity } from './similarity';
import { DISCLAIMER, buildQueryText, buildReasons, keywordRank } from './ranking';

/**
 * Recommend jewelry.  Order of operations (this is what makes it safe):
 *   1) FILTER by hard rules first: active, in stock, within budget, shop-approved for the piercing.
 *   2) RANK only the items that passed, by similarity to the customer's description.
 *   3) EXPLAIN using real catalog data.
 * The AI can never recommend something that failed the filters.
 *
 * Returns { mode: 'ai' | 'fallback' | 'filter' | 'none', results: [{ item, score, reasons }], ... }
 *   ai       = ranked by the embedding model
 *   fallback = model unavailable, ranked by simple keyword overlap (show a "basic matching" note)
 *   filter   = customer gave no preferences, so just the eligible items
 *   none     = nothing passes the filters
 *
 * onProgress(percent) reports the one-time model download.
 */
export async function recommend({ piercingTypeId, budget, style, material, color, freeText, topK = 3, onProgress } = {}) {
  if (!piercingTypeId) throw new Error('Please choose a piercing placement first.');
  const t0 = performance.now();

  const budgetNum = Number(budget);
  const maxPrice = Number.isFinite(budgetNum) && budgetNum > 0 ? budgetNum : undefined;

  const [eligible, types] = await Promise.all([
    listJewelry({ piercingTypeId, maxPrice, inStockOnly: true }),
    listPiercingTypes(),
  ]);
  const piercingName = types.find((t) => t.id === piercingTypeId)?.name;
  const prefs = { style, material, color, freeText, budget: maxPrice };
  const queryText = buildQueryText(prefs);

  const finish = (mode, ranked, extra = {}) => ({
    mode,
    results: ranked.map(({ item, score }) => ({
      item,
      score,
      reasons: buildReasons(item, prefs, { piercingName, mode }),
    })),
    eligibleCount: eligible.length,
    queryText,
    ms: Math.round(performance.now() - t0),
    disclaimer: DISCLAIMER,
    ...extra,
  });

  if (eligible.length === 0) return finish('none', []);
  if (!queryText) return finish('filter', eligible.slice(0, topK).map((item) => ({ item, score: null })));

  try {
    const [queryVector, embeds] = await Promise.all([embedText(queryText, onProgress), fetchEmbeddings()]);
    const scored = eligible
      .filter((item) => isIndexFresh(item, embeds.get(item.id)))
      .map((item) => ({ item, score: cosineSimilarity(queryVector, embeds.get(item.id).embedding) }));
    if (scored.length === 0) throw new Error('AI index is empty. An admin needs to run "Update AI index".');
    scored.sort((a, b) => b.score - a.score);
    return finish('ai', scored.slice(0, topK), { unindexedCount: eligible.length - scored.length });
  } catch (err) {
    console.warn('AI ranking unavailable, using keyword fallback:', err);
    return finish('fallback', keywordRank(eligible, queryText, topK), { fallbackReason: String(err?.message ?? err) });
  }
}
