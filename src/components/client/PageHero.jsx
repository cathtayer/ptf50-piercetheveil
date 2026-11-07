// Dark intro band for public pages (the fixed header is cream text, so it needs a dark top).
export default function PageHero({ eyebrow, title, children }) {
  return (
    <section className="page-hero">
      <div className="page-hero__inner">
        <p className="eyebrow"><span /> {eyebrow}</p>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
    </section>
  );
}
