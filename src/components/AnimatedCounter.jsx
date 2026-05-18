import React, { useEffect, useRef, useState } from "react";

export default function AnimatedCounter({ value, formatter, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const numericValue = typeof value === "string"
    ? parseFloat(value.replace(/[^0-9.-]/g, "")) || 0
    : value || 0;

  useEffect(() => {
    const start = 0;
    const end = numericValue;
    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [numericValue, duration]);

  return <span>{formatter ? formatter(display) : Math.round(display).toLocaleString()}</span>;
}
