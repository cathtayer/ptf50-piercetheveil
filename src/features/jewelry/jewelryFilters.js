// Pure helpers for the public catalog (no network, no React).

const norm = (value) => String(value ?? "").trim().toLowerCase();

// Piercing types the shop has approved this piece for.
export function approvedPlacementIds(item) {
  return (item?.jewelry_compatibility ?? []).filter((c) => c.approved).map((c) => c.piercing_type_id);
}

// Sorted unique non-empty values of one field, e.g. distinctValues(items, "material").
export function distinctValues(items, key) {
  const values = items.map((item) => String(item[key] ?? "").trim()).filter(Boolean);
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function filterJewelry(
  items,
  { search = "", material = "", style = "", maxPrice = "", piercingTypeId = "", inStockOnly = false } = {},
) {
  const query = norm(search);
  const max = Number(maxPrice);
  return items.filter((item) => {
    if (query && !norm(`${item.name} ${item.description} ${item.material} ${item.style} ${item.color}`).includes(query)) {
      return false;
    }
    if (material && norm(item.material) !== norm(material)) return false;
    if (style && norm(item.style) !== norm(style)) return false;
    if (maxPrice !== "" && Number.isFinite(max) && max > 0 && Number(item.price) > max) return false;
    if (piercingTypeId && !approvedPlacementIds(item).includes(piercingTypeId)) return false;
    if (inStockOnly && !(item.stock > 0)) return false;
    return true;
  });
}
