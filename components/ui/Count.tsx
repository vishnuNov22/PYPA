"use client";
import { animate } from "framer-motion";
import { useEffect, useRef } from "react";

/** Number that counts up whenever `to` changes. */
export function Count({ to, className, duration = 1 }: { to: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  useEffect(() => {
    const c = animate(prev.current, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("en-IN"); } });
    prev.current = to;
    return () => c.stop();
  }, [to, duration]);
  return <span ref={ref} className={className}>{to.toLocaleString("en-IN")}</span>;
}
