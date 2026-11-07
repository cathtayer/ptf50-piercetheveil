import { Link } from "react-router-dom";
import { formatPeso } from "../../services/api";

// One jewelry piece. `children` is optional extra content (e.g. the AI "why this fits" list).
export default function ProductCard({ item, children }) {
  const soldOut = !(item.stock > 0);
  const to = `/catalog/${item.id}`;
  return (
    <article className="product-card">
      <Link className="product-card__media" to={to} aria-label={`View ${item.name}`}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} loading="lazy" />
        ) : (
          <span className="product-card__placeholder" aria-hidden="true">◇</span>
        )}
        {soldOut && <em className="product-card__badge">Sold out</em>}
      </Link>
      <div className="product-card__body">
        <p className="product-card__meta">{[item.style, item.material].filter(Boolean).join(" · ") || "Jewelry"}</p>
        <h3><Link to={to}>{item.name}</Link></h3>
        <strong>{formatPeso(item.price)}</strong>
        {children}
      </div>
    </article>
  );
}
