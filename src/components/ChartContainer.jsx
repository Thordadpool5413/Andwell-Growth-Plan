import { useEffect, useRef, useState } from "react";
import { ResponsiveContainer } from "recharts";

export default function ChartContainer({ height = "h-80", children }) {
  const wrapperRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDims({ width, height });
      }
    };

    measure();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDims({ width, height });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isReady = dims.width > 0 && dims.height > 0;

  return (
    <div ref={wrapperRef} className={height}>
      {isReady ? (
        <ResponsiveContainer width={dims.width} height={dims.height}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
