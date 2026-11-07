import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "../../components/client/PageHero";
import ProductCard from "../../components/client/ProductCard";
import { listJewelry, listPiercingTypes } from "../../features/jewelry/jewelryService";
import { distinctValues } from "../../features/jewelry/jewelryFilters";
import { recommend } from "../../features/recommendations/recommendationService";
import { toUserMessage } from "../../services/api";

const EMPTY = { piercingTypeId: "", budget: "", style: "", material: "", color: "", freeText: "" };

export default function AIRecommendation() {
  const [types, setTypes] = useState([]);
  const [catalog, setCatalog] = useState([]); // only used to offer real style/material/color choices
  const [setupError, setSetupError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // model download percent (first use only)
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listPiercingTypes(), listJewelry()])
      .then(([t, j]) => {
        if (cancelled) return;
        setTypes(t ?? []);
        setCatalog(j ?? []);
      })
      .catch((e) => !cancelled && setSetupError(toUserMessage(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const styles = useMemo(() => distinctValues(catalog, "style"), [catalog]);
  const materials = useMemo(() => distinctValues(catalog, "material"), [catalog]);
  const colors = useMemo(() => distinctValues(catalog, "color"), [catalog]);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.piercingTypeId) {
      setError("Please choose where the piercing will go.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    setProgress(null);
    try {
      setResult(await recommend({ ...form, onProgress: setProgress }));
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const placementName = types.find((t) => t.id === form.piercingTypeId)?.name;

  return (
    <main>
      <PageHero eyebrow="PierceWise · AI stylist" title={<>Your taste, <em>translated.</em></>}>
        Tell us where you are getting pierced and what feels like you. We only suggest pieces the shop has approved for that placement, then rank them by how well they match your description.
      </PageHero>

      <section className="page-body">
        <form className="stylist-form" onSubmit={submit} noValidate>
          <label className="field"><span>Where is the piercing? *</span>
            <select value={form.piercingTypeId} onChange={set("piercingTypeId")} disabled={busy}>
              <option value="">Choose a placement</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Budget (PHP, optional)</span>
            <input type="number" inputMode="numeric" min="0" placeholder="No limit" value={form.budget} onChange={set("budget")} disabled={busy} />
          </label>
          {styles.length > 0 && (
            <label className="field"><span>Style (optional)</span>
              <select value={form.style} onChange={set("style")} disabled={busy}>
                <option value="">No preference</option>
                {styles.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
          {materials.length > 0 && (
            <label className="field"><span>Material (optional)</span>
              <select value={form.material} onChange={set("material")} disabled={busy}>
                <option value="">No preference</option>
                {materials.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          )}
          {colors.length > 0 && (
            <label className="field"><span>Color (optional)</span>
              <select value={form.color} onChange={set("color")} disabled={busy}>
                <option value="">No preference</option>
                {colors.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          )}
          <label className="field field--wide"><span>Describe what you like (optional, English or Taglish)</span>
            <textarea rows={3} maxLength={300} value={form.freeText} onChange={set("freeText")} disabled={busy}
              placeholder="e.g. simple gold hoop, hindi masyadong mabigat" />
          </label>

          <div className="stylist-form__actions">
            <button className="button button--dark" type="submit" disabled={busy || Boolean(setupError)} aria-busy={busy}>
              {busy ? "Finding matches…" : "Find my pieces"}
            </button>
            <p className="stylist-form__privacy">Your description is processed in your browser and is not stored.</p>
          </div>
        </form>

        {setupError && <p className="callout callout--error" role="alert">{setupError}</p>}
        {error && <p className="callout callout--error" role="alert">{error}</p>}
        {busy && progress !== null && progress < 100 && (
          <p className="callout" role="status">Downloading the on-device model (first time only)… {progress}%</p>
        )}

        {result && (
          <div className="stylist-results">
            {result.mode === "none" && (
              <p className="callout" role="status">
                No in-stock pieces are approved for {placementName ?? "that placement"} within your budget. Try a higher budget or another placement, or <Link className="link-button" to="/availability">book a time</Link> and ask your piercer.
              </p>
            )}
            {result.mode === "filter" && (
              <p className="callout" role="status">Here are pieces approved for {placementName}. Add a style or a description to rank them for you.</p>
            )}
            {result.mode === "fallback" && (
              <p className="callout" role="status">Smart matching is not available right now, so these were ranked by simple keyword matching.</p>
            )}
            {result.mode === "ai" && result.lowConfidence && (
              <p className="callout" role="status">We could not find a strong match for that description. These are the closest approved options.</p>
            )}

            {result.results.length > 0 && (
              <div className="product-grid">
                {result.results.map(({ item, reasons }) => (
                  <ProductCard key={item.id} item={item}>
                    {reasons.length > 0 && (
                      <>
                        <p className="reasons__title">Why it fits</p>
                        <ul className="reasons">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                      </>
                    )}
                  </ProductCard>
                ))}
              </div>
            )}

            <p className="detail__note">{result.disclaimer}</p>
            {result.results.length > 0 && (
              <p><Link className="button button--dark" to="/availability">Book a piercing</Link></p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
