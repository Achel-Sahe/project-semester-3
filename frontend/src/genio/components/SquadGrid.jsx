import React, { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  gsap,
  prefersReduced,
  refreshMotion,
  stopTriggers,
} from "../../lib/motion";

const POSITION_FILTERS = [
  { label: "Goalkeepers", value: "Goalkeeper" },
  { label: "Defenders", value: "Defender" },
  { label: "Midfielders", value: "Midfielder" },
  { label: "Attackers", value: "Forward" },
];

const SquadGrid = ({
  id,
  ambilData,
  renderKartu,
  labelSeksi,
  judul,
  satuanData,
  langkah = 3,
  kolomGrid = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  tampilkanFilter = false,
}) => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(langkah);
  const [activePosition, setActivePosition] = useState(null);
  const gridRef = useRef(null);
  const headRef = useRef(null);

  useEffect(() => {
    let alive = true;

    setStatus("loading");
    setError("");
    setVisible(langkah);

    ambilData(activePosition ? { position: activePosition } : undefined)
      .then((data) => {
        if (!alive) return;
        setItems(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setStatus("error");
      });

    return () => {
      alive = false;
    };
  }, [ambilData, langkah, activePosition]);

  const selectPosition = (position) => {

    setActivePosition((current) => (current === position ? null : position));
  };

  const shown = items.slice(0, visible);
  const remaining = items.length - shown.length;

  const showMore = () => {
    setVisible((current) => current + langkah);

    const target = items[Math.min(visible + langkah, items.length) - 1];
    requestAnimationFrame(() => {
      document
        .getElementById(`person-${target?.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const showLess = () => {
    setVisible(langkah);

    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const collapsible = items.length > langkah;
  const expanded = collapsible && remaining === 0;

  useEffect(() => {
    if (status !== "ready" || prefersReduced() || !headRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-reveal-head]", {
        y: 40,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headRef.current,
          start: "top 88%",
          once: true,
        },
      });
    }, headRef);

    return () => stopTriggers(ctx);
  }, [status]);

  useEffect(() => {
    if (status !== "ready" || prefersReduced() || !gridRef.current) return;

    const fresh = gsap.utils.toArray(
      "[data-card]:not([data-shown])",
      gridRef.current,
    );
    if (!fresh.length) return;

    const ctx = gsap.context(() => {
      gsap.from(fresh, {
        y: 48,
        autoAlpha: 0,
        duration: 0.65,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 90%",
          once: true,
          onEnter: () =>
            fresh.forEach((el) => {
              el.dataset.shown = "1";
            }),
        },
      });
    }, gridRef);

    return () => stopTriggers(ctx);
  }, [status, shown.length]);

  useEffect(() => {
    refreshMotion();
  }, [visible]);

  return (
    <div id={id}>
      <div className="pembungkus py-16 md:py-24 px-6 md:px-20 flex flex-col gap-8">
        <div ref={headRef} className="text awal flex justify-between">
          <p data-reveal-head className="font-mono">
            {labelSeksi}
          </p>
          <p data-reveal-head className="font-mono">
            {status === "ready" && `${shown.length} / ${items.length} ${satuanData}`}
          </p>
        </div>

        <div className="tekskedua">
          <h1 data-reveal-head className="text-5xl md:text-7xl font-display">
            {judul}
          </h1>
        </div>

        {tampilkanFilter && (
          <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-6 lg:gap-10 font-condensed text-lg sm:text-xl">
            {POSITION_FILTERS.map(({ label, value }) => {
              const isActive = activePosition === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectPosition(value)}
                  aria-pressed={isActive}
                  className={`py-3 px-5 border-b-1 rounded-2xl cursor-pointer transition-all hover:border-barca-garnet hover:border-b-2 ${
                    isActive ? "border-barca-garnet border-b-2" : ""
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {status === "loading" && (
          <p className="font-mono text-white/60 py-10">MEMUAT DATA...</p>
        )}

        {status === "error" && (
          <p className="font-mono text-barca-garnet py-10">GAGAL: {error}</p>
        )}

        {status === "ready" && items.length === 0 && (
          <p className="font-mono text-white/60 py-10">BELUM ADA DATA.</p>
        )}

        {status === "ready" && items.length > 0 && (
          <div ref={gridRef} className={`card-wrapper grid ${kolomGrid} gap-2.5`}>
            {shown.map((item, i) => (
              <div data-card id={`person-${item.id}`} key={item.id}>
                {renderKartu(item, i)}
              </div>
            ))}
          </div>
        )}

        {status === "ready" && collapsible && (
          <div className="buton flex items-center justify-center w-fit mx-auto">
            <button
              onClick={expanded ? showLess : showMore}
              aria-expanded={expanded}
              className="sweep-btn group items-center flex justify-center gap-3 mt-6 cursor-pointer py-3 px-5 border-b border-white/40 rounded-2xl font-condensed"
            >
              <span className="sweep-btn-label">
                {expanded ? "VIEW LESS" : "VIEW MORE"}
              </span>
              {!expanded && (

                <span className="font-mono text-sm text-white/60 group-hover:text-white/90 transition-colors">
                  {remaining} LEFT
                </span>
              )}
              <ArrowRight
                className={`w-4 h-4 transition-transform ${
                  expanded
                    ? "-rotate-90 group-hover:-translate-y-1"
                    : "group-hover:translate-x-1"
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadGrid;
