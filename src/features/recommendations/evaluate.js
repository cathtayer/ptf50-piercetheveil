import { recommend } from './recommendationService';

/**
 * Evaluation harness for the project report. Run it from a dev page or the browser console:
 *
 *   const { runEvaluation } = await import('/src/features/recommendations/evaluate.js');
 *   await runEvaluation([
 *     { name: 'Minimal helix', piercingTypeId: '<uuid>', budget: 600, style: 'Minimalist',
 *       freeText: 'simple and subtle for everyday wear', relevantNames: ['Minimal Titanium Hoop', 'Titanium Flat-Back Stud'] },
 *   ]);
 *
 * relevantNames = the pieces the SHOP OWNER judges as good answers for that case.
 * Reports: Precision@3, constraint compliance, response time, and (separately) first-run model load time.
 */
export async function runEvaluation(cases, { topK = 3 } = {}) {
  const rows = [];
  for (const [index, c] of cases.entries()) {
    const t0 = performance.now();
    const out = await recommend({ ...c, topK });
    const ms = Math.round(performance.now() - t0);

    const names = out.results.map((r) => r.item.name);
    const hits = names.filter((n) => (c.relevantNames ?? []).includes(n)).length;
    const compliant = out.results.every(({ item }) => {
      const approved = item.jewelry_compatibility?.some((x) => x.piercing_type_id === c.piercingTypeId && x.approved);
      const inBudget = !c.budget || Number(item.price) <= Number(c.budget);
      return item.stock > 0 && item.is_active && approved && inBudget;
    });

    rows.push({
      case: c.name ?? `Case ${index + 1}`,
      mode: out.mode,
      bestScore: out.bestScore != null ? Number(out.bestScore.toFixed(2)) : null,
      lowConfidence: out.lowConfidence ?? null,
      top: names.join(' | '),
      precisionAt3: out.results.length ? Number((hits / out.results.length).toFixed(2)) : 0,
      constraintsOk: compliant,
      ms,
      coldStart: index === 0, // first case includes model download/load time
    });
  }

  const n = rows.length || 1;
  const warm = rows.filter((r) => !r.coldStart);
  const summary = {
    cases: rows.length,
    avgPrecisionAt3: Number((rows.reduce((s, r) => s + r.precisionAt3, 0) / n).toFixed(2)),
    constraintCompliance: `${rows.filter((r) => r.constraintsOk).length}/${rows.length}`,
    firstRunMs: rows[0]?.ms ?? null,
    avgWarmMs: warm.length ? Math.round(warm.reduce((s, r) => s + r.ms, 0) / warm.length) : null,
    aiModeCases: rows.filter((r) => r.mode === 'ai').length,
  };
  console.table(rows);
  console.log('Summary', summary);
  return { rows, summary };
}
