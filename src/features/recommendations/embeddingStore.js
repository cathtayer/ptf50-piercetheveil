import { supabase } from '../../services/supabase';
import { MODEL_KEY, buildJewelryText, embedText } from './embeddingService';

// Map of jewelry_id -> { jewelry_id, source_text, embedding }. Visitors only receive active items (RLS).
export async function fetchEmbeddings() {
  const { data, error } = await supabase
    .from('jewelry_embeddings')
    .select('jewelry_id, source_text, embedding')
    .eq('model', MODEL_KEY);
  if (error) throw error;
  return new Map(data.map((r) => [r.jewelry_id, r]));
}

// An embedding is "fresh" if it was built from the item's CURRENT text.
export function isIndexFresh(item, row) {
  return Boolean(row) && row.source_text === buildJewelryText(item);
}

// Admin only (RLS). Embeds one item and stores the vector.
export async function syncJewelryEmbedding(item, onProgress) {
  const text = buildJewelryText(item);
  const vector = await embedText(text, onProgress);
  const { error } = await supabase.from('jewelry_embeddings').upsert(
    {
      jewelry_id: item.id,
      model: MODEL_KEY,
      source_text: text,
      embedding: vector,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'jewelry_id,model' }
  );
  if (error) throw error;
}

// Re-embeds only items that are missing or out of date. Returns how many were updated.
export async function reindexStale(items, embeds, onStatus) {
  const stale = items.filter((i) => !isIndexFresh(i, embeds.get(i.id)));
  let done = 0;
  for (const item of stale) {
    onStatus?.({ phase: 'indexing', done, total: stale.length });
    await syncJewelryEmbedding(item, (percent) => onStatus?.({ phase: 'model', percent }));
    done++;
  }
  onStatus?.({ phase: 'done', done, total: stale.length });
  return stale.length;
}
