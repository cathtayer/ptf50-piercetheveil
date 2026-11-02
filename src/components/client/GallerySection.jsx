import { galleryItems } from "../../data/studioContent";

const earPlacementSketch = galleryItems.find((item) => item.featured);

export default function GallerySection() {
  return (
    <section className="gallery section" id="gallery">
      <div className="gallery__heading gallery__heading--single">
        <div>
          <p className="eyebrow eyebrow--dark"><span /> From the Pierce the Veil archive</p>
          <h2>Look closer.</h2>
        </div>
        <p>
          A complete hand-drawn guide to ear piercing placements.
        </p>
      </div>

      <figure className="gallery-feature">
        <img
          src={earPlacementSketch.src}
          alt={earPlacementSketch.alt}
          loading="lazy"
        />
        <figcaption>
          <span>{earPlacementSketch.category}</span>
          <strong>{earPlacementSketch.title}</strong>
          <small>Right and left ear placement reference</small>
        </figcaption>
      </figure>
    </section>
  );
}
