import React, { useEffect, useRef, useState } from "react";
import { useClub } from "../../hooks/useClub";

const HIDE_AFTER = 120;
const MIN_DELTA = 6;

const YEAR = new Date().getFullYear();

const Navbar = () => {
  const links = [
    { label: "HOME", href: "#home" },
    { label: "ABOUT", href: "#about" },
    { label: "PLAYERS", href: "#players" },
    { label: "COACH", href: "#coaches" },
  ];
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  const revealUntil = useRef(0);

  const club = useClub();

  const era = club ? `${club.founded_year} - ${YEAR}` : "";

  useEffect(() => {
    const update = () => {
      ticking.current = false;
      const y = window.scrollY;

      setScrolled(y > 8);

      if (Date.now() < revealUntil.current) {
        lastY.current = y;
        return;
      }

      const delta = y - lastY.current;
      if (Math.abs(delta) < MIN_DELTA) return;

      setHidden(delta > 0 && y > HIDE_AFTER);
      lastY.current = y;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(update);
    };

    lastY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const jump = () => {
    setOpen(false);
    setHidden(false);
    revealUntil.current = Date.now() + 900;
  };

  const revealed = !hidden || open;

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-100 text-lg",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        revealed ? "translate-y-0" : "-translate-y-full",
        scrolled
          ? "border-b border-white/10 bg-black/60 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="nav flex justify-between items-center py-6 px-6 md:px-12">
        <h1 className="whitespace-nowrap font-display text-3xl">FC BARCELONA</h1>

        <div className="hidden md:flex gap-6 lg:gap-10">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={jump}
              className="nav-link cursor-pointer font-condensed"
            >
              {link.label}
            </a>
          ))}
        </div>

        <h3 className="hidden md:block font-condensed text-xl">{era}</h3>

        <button
          className="md:hidden text-3xl leading-none cursor-pointer text-white/70 hover:text-barca-gold transition-colors duration-300"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="md:hidden absolute inset-x-0 top-full flex flex-col gap-4 border-b border-white/10 bg-black/80 px-6 md:px-12 py-6 text-lg backdrop-blur-md">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={jump}
              className="nav-link cursor-pointer font-condensed"
            >
              {link.label}
            </a>
          ))}
          <p className="opacity-70 font-condensed">{era}</p>
        </div>
      )}
    </header>
  );
}

export default Navbar