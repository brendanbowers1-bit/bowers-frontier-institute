import { useEffect, useState } from "react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="container site-header__inner">
        <a href="#top" className="site-brand">
          <span className="site-brand__mark">BFI</span>
          <span className="site-brand__name">Bowers Frontier Institute</span>
        </a>
        <nav className="site-nav" aria-label="Primary">
          <a href="#institute">Institute</a>
          <a href="#weekly-trade">Weekly Trade</a>
          <a href="#labs">Labs</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}
