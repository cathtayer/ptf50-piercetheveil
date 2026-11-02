const instagramUrl = "https://www.instagram.com/piercetheveil.ac/";
const instagramEmbedUrl = "https://www.instagram.com/piercetheveil.ac/embed/";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle className="instagram-icon__dot" cx="17.4" cy="6.7" r="1" />
    </svg>
  );
}

export default function InstagramSection() {
  return (
    <section className="instagram-feed" id="instagram" aria-labelledby="instagram-heading">
      <div className="instagram-feed__heading">
        <div>
          <p className="eyebrow"><span /> Updates & pop-up announcements</p>
          <h2 id="instagram-heading">
            Follow the niche <em>on Instagram.</em>
          </h2>
        </div>

        <a
          className="instagram-feed__profile"
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open Pierce the Veil on Instagram"
        >
          <span className="instagram-feed__avatar"><InstagramIcon /></span>
          <span>
            <strong>@piercetheveil.ac</strong>
            <small>Open the full profile ↗</small>
          </span>
        </a>
      </div>

      <div className="instagram-feed__widget">
        <iframe
          src={instagramEmbedUrl}
          title="Pierce the Veil Instagram profile and posts"
          loading="lazy"
          allow="encrypted-media"
        />
        <p className="instagram-feed__fallback">
          Instagram not loading?{" "}
          <a href={instagramUrl} target="_blank" rel="noreferrer">
            View @piercetheveil.ac directly ↗
          </a>
        </p>
      </div>
    </section>
  );
}
