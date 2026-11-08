import { cookies } from "next/headers";
export type Lang = "en" | "ml";
export const getLang = (): Lang => (cookies().get("lang")?.value === "ml" ? "ml" : "en");
export const tr = (lang: Lang, en: string, ml?: string) => (lang === "ml" && ml ? ml : en);
export const NAV: [string, string, string][] = [
  ["/", "Home", "ഹോം"], ["/about", "About PYPA", "ഞങ്ങളെക്കുറിച്ച്"], ["/projects", "Ongoing Projects", "പദ്ധതികൾ"],
  ["/leadership", "Leadership", "നേതൃത്വം"], ["/wall", "Wall", "വാൾ"], ["/kahalam", "Yuvajana Kahalam", "യുവജന കാഹളം"], ["/jobs", "Job Portal", "തൊഴിൽ പോർട്ടൽ"],
];
