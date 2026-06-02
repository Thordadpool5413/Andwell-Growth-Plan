import { useEffect, useRef, useState } from "react";
import { ResponsiveContainer } from "recharts";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function ChartContainer({ height = "h-80", children, title, subtitle, caption }) {
  const wrapperRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const { dark } = useDarkMode();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = (width, height) => {
      if (width > 0 && height > 0) {
        setDims({ width, height });
      }
    };

    const { width, height } = el.getBoundingClientRect();
    update(width, height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        update(entry.contentRect.width, entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isReady = dims.width > 0 && dims.height > 0;

  return (
    <div className="flex flex-col h-full">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <p className={`text-sm font-semibold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>{title}</p>}
          {subtitle && <p className={`mt-0.5 text-xs font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>}
        </div>
      )}
      <div ref={wrapperRef} className={`${height} min-h-0 flex-1`}>
        {isReady ? (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        ) : null}
      </div>
      {caption && (
        <p className={`mt-4 text-[11px] font-medium italic leading-relaxed ${dark ? "text-slate-500" : "text-slate-400"}`}>{caption}</p>
      )}
    </div>
  );
}
