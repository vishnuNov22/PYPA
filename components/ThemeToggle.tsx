"use client";
import { Moon, Sun } from "lucide-react";
export function ThemeToggle({ className = "" }: { className?: string }) {
  const flip = () => {
    const r = document.documentElement;
    const cur = r.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const n = cur === "dark" ? "light" : "dark";
    r.dataset.theme = n;
    try { localStorage.setItem("pypa-theme", n); } catch {}
  };
  return (
    <button onClick={flip} aria-label="Toggle dark mode" className={`btn btn-ghost btn-sm !px-2.5 ${className}`}>
      <Sun className="h-[18px] w-[18px] dark-icon" /><Moon className="h-[18px] w-[18px] light-icon" />
    </button>
  );
}
