"use client";
import { motion, useInView, useMotionValue, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

export function Reveal({ children, delay = 0, className, y = 22 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}
export function Counter({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const sp = useSpring(mv, { duration: 1400, bounce: 0 });
  const inView = useInView(ref, { once: true });
  useEffect(() => { if (inView) mv.set(to); }, [inView, to, mv]);
  useEffect(() => sp.on("change", (v) => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString("en-IN"); }), [sp]);
  return <span ref={ref} className={className}>0</span>;
}
export function Floating({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} animate={{ y: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>{children}</motion.div>;
}

/** Dark hero wrapper: soft emerald spotlight follows the cursor. */
export function Spotlight({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className={className}
      onPointerMove={(e) => { const r = ref.current!.getBoundingClientRect(); ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`); ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`); }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-90" style={{ background: "radial-gradient(520px circle at var(--mx,70%) var(--my,30%), rgb(64 196 160 / .22), transparent 60%)" }} />
      {children}
    </div>
  );
}

/** Card that tilts toward the pointer. */
export function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className={className} style={{ transformStyle: "preserve-3d", transition: "transform .18s ease-out" }}
      onPointerMove={(e) => { if (e.pointerType !== "mouse") return; const r = ref.current!.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; ref.current!.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`; }}
      onPointerLeave={() => { if (ref.current) ref.current.style.transform = ""; }}>{children}</div>
  );
}

/** Thin emerald bar showing scroll progress. */
export function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 140, damping: 24 });
  return <motion.div aria-hidden style={{ scaleX: x }} className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand to-gold" />;
}

/** Logo that drifts slightly with the pointer (parallax). */
export function Parallax({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 80, damping: 18 }), sy = useSpring(y, { stiffness: 80, damping: 18 });
  useEffect(() => {
    const m = (e: PointerEvent) => { x.set((e.clientX / window.innerWidth - 0.5) * 26); y.set((e.clientY / window.innerHeight - 0.5) * 20); };
    window.addEventListener("pointermove", m);
    return () => window.removeEventListener("pointermove", m);
  }, [x, y]);
  return <motion.div style={{ x: sx, y: sy }} className={className}>{children}</motion.div>;
}
