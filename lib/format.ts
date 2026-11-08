export const fmtDate = (d?: string | null) => (d ? new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export const fmtDT = (d?: string | null) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
export const inr = (n: number) => "₹" + Number(n).toLocaleString("en-IN");
export const initials = (n: string) => String(n || "?").replace(/^(Pr|Dr|Mr|Ms|Mrs)\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const PAL = ["#237B68", "#142E37", "#2AA3A3", "#4A90C2", "#7FB83A", "#5B6FB5"];
export const avColor = (n: string) => PAL[[...String(n)].reduce((a, c) => a + c.charCodeAt(0), 0) % 6];
export const ago = (d: string) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)} d ago`;
  return fmtDate(d);
};
export const sizeLabel = (b: number) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB");
