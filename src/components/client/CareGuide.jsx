import { useState } from "react";
import { careGuides } from "../../data/studioContent";

export default function CareGuide() {
  const [activeId, setActiveId] = useState(careGuides[0].id);
  const active = careGuides.find((guide) => guide.id === activeId);

  return (
    <section className="care-guide section" id="care-guide">
      <div className="care-guide__heading">
        <p className="eyebrow eyebrow--dark"><span /> Care library</p>
        <h2>Know what comes<br /><em>after the needle.</em></h2>
        <p>Piercing guidance, reorganized into short sections you can return to at any point in the healing process.</p>
      </div>

      <div className="care-guide__tabs" role="tablist" aria-label="Piercing care topics">
        {careGuides.map((guide, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={guide.id === activeId}
            className={guide.id === activeId ? "active" : ""}
            onClick={() => setActiveId(guide.id)}
            key={guide.id}
          >
            <span>0{index + 1}</span>{guide.label}
          </button>
        ))}
      </div>

      <article className="care-panel" role="tabpanel">
        <div className="care-panel__lead">
          <span>{active.eyebrow}</span>
          <h3>{active.title}</h3>
          <p>{active.intro}</p>
        </div>

        {active.timelines ? (
          <div className="healing-grid">
            {active.timelines.map(([placement, time]) => (
              <div className="healing-item" key={placement}>
                <span>{placement}</span>
                <strong>{time}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className={`care-groups ${active.groups.length === 1 ? "care-groups--single" : ""}`}>
            {active.groups.map((group) => (
              <div className="care-group" key={group.title}>
                <h4>{group.title}</h4>
                <ul>
                  {group.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="care-panel__footer">
          <p>{active.note}</p>
          <a href="https://safepiercing.org/aftercare/" target="_blank" rel="noreferrer">
            Professional aftercare reference ↗
          </a>
        </div>
      </article>
    </section>
  );
}
