import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/client/Footer";
import Navbar from "../components/client/Navbar";

// Shared frame for every public page: navbar, page, footer.
export default function ClientLayout() {
  const { pathname, hash } = useLocation();

  // New page -> start at the top. A "#section" link (e.g. /#about) -> scroll to that section.
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return (
    <div className="page-shell">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
