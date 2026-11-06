import { useEffect, useState } from "react";
import logo from "../../assets/PTV-logo.png";

const links = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#price-guide" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Aftercare", href: "/#care-guide" },
  { label: "AI Stylist", href: "/#recommendation" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onResize = () => {
      if (window.innerWidth > 820) setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.classList.remove("nav-open");
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <a className="brand" href="/#home" aria-label="Pierce the Veil home">
        <span className="brand__mark">
          <img src={logo} alt="" />
        </span>
        <span className="brand__name">
          Pierce the Veil
          <small>Angeles City</small>
        </span>
      </a>

      <button
        className={`menu-toggle ${open ? "menu-toggle--open" : ""}`}
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-controls="primary-navigation"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>

      <nav
        className={`main-nav ${open ? "main-nav--open" : ""}`}
        id="primary-navigation"
        aria-label="Primary navigation"
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
        <a className="nav-cta" href="/availability" onClick={() => setOpen(false)}>
          Check availability
        </a>
      </nav>
    </header>
  );
}
