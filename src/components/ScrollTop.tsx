"use client";

import { useEffect, useState } from "react";

/** Parity with the original .scrollup control, rebuilt as a precise square affordance. */
export default function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className={`fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center bg-ink text-paper transition-all duration-300 hover:bg-brand ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg viewBox="0 0 12 8" className="h-2 w-3" aria-hidden>
        <path d="M1 7l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </button>
  );
}
