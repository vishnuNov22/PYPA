export const pad = (n: number | string, l: number) => String(n).padStart(l, "0");
export const uid = (p: string) => p + Math.random().toString(36).slice(2, 9);
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const thisYear = () => new Date().getFullYear();

export function ageOn(dob: string, on: Date = new Date()) {
  const b = new Date(dob);
  let a = on.getFullYear() - b.getFullYear();
  const m = on.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < b.getDate())) a--;
  return a;
}
export const addYears = (dob: string, n: number) => (dob ? `${+dob.slice(0, 4) + n}${dob.slice(4)}` : "");

export function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
