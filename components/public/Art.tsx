import { mulberry } from "@/lib/util";

const PAL = [["#237B68", "#B8F0D8", "#EAF8F2", "#142E37"], ["#142E37", "#7FE0B8", "#E4F2EE", "#2AA3A3"], ["#2AA3A3", "#F2E6A8", "#F1FAF7", "#237B68"], ["#3F5E9E", "#9CE6C7", "#EAF0FA", "#142E37"]];

/** Generated artwork used where a member has not uploaded an image. Deterministic per seed. */
export function Art({ seed, type, className }: { seed: number; type: string; className?: string }) {
  const r = mulberry(seed * 7919 + 13), p = PAL[seed % 4], id = `g${seed}`;
  const els: React.ReactNode[] = [];
  if (type === "Photography") {
    els.push(<defs key="d"><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p[1]} /><stop offset=".55" stopColor={p[0]} /><stop offset="1" stopColor="#08191e" /></linearGradient></defs>, <rect key="b" width="400" height="300" fill={`url(#${id})`} />,
      <circle key="s" cx={120 + r() * 160} cy={100 + r() * 30} r={26 + r() * 14} fill={p[2]} opacity=".9" />);
    for (let i = 0; i < 4; i++) els.push(<path key={"w" + i} d={`M0 ${190 + i * 28} Q ${100 + r() * 80} ${170 + i * 28 - r() * 20} 200 ${190 + i * 28} T 400 ${190 + i * 28} V300 H0Z`} fill="#08191e" opacity={0.18 + i * 0.18} />);
  } else if (type === "Music") {
    els.push(<rect key="b" width="400" height="300" fill={p[0]} />);
    for (let i = 0; i < 34; i++) { const h = 20 + r() * 190; els.push(<rect key={i} x={14 + i * 11} y={150 - h / 2} width="6" height={h} rx="3" fill={i % 5 === 0 ? p[1] : p[2]} opacity=".92" />); }
  } else if (type === "Painting") {
    els.push(<rect key="b" width="400" height="300" fill={p[2]} />);
    for (let i = 0; i < 9; i++) els.push(<circle key={i} cx={r() * 400} cy={r() * 300} r={30 + r() * 70} fill={p[i % 4]} opacity={0.35 + r() * 0.4} />);
    els.push(<path key="p" d={`M0 ${220 + r() * 30} C 120 ${150 + r() * 40}, 260 ${250 - r() * 40}, 400 ${180 + r() * 40} V300 H0Z`} fill={p[3]} opacity=".75" />);
  } else {
    els.push(<rect key="b" width="400" height="300" fill={p[2]} />);
    for (let i = 0; i < 6; i++) els.push(<rect key={i} x={r() * 300} y={r() * 200} width={60 + r() * 120} height={50 + r() * 90} rx="16" fill={p[i % 4]} opacity=".25" transform={`rotate(${r() * 40 - 20} 200 150)`} />);
  }
  return <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">{els}</svg>;
}
