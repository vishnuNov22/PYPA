import fs from "fs";
import path from "path";
import { seed } from "./seed";
import type { DB } from "./types";

const FILE = process.env.PYPA_DATA_FILE || path.join(process.cwd(), "data", "db.json");
type G = typeof globalThis & { __pypa?: { db: DB; timer?: NodeJS.Timeout } };
const g = globalThis as G;

function load(): DB {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8")) as DB;
  } catch (e) {
    console.error("Could not read data file, reseeding:", e);
  }
  const d = seed();
  persist(d);
  return d;
}
function persist(d: DB) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    const tmp = FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(d));
    fs.renameSync(tmp, FILE);
  } catch (e) {
    console.error("Could not write data file:", e);
  }
}
export function db(): DB {
  if (!g.__pypa) g.__pypa = { db: load() };
  return g.__pypa.db;
}
/** Debounced write-through to data/db.json. Swap this module for Prisma/Postgres in production. */
export function save() {
  const s = (g.__pypa ||= { db: load() });
  if (s.timer) clearTimeout(s.timer);
  s.timer = setTimeout(() => persist(s.db), 250);
}
export function resetDb() {
  const d = seed();
  g.__pypa = { db: d };
  persist(d);
}
export const uploadsDir = () => path.join(path.dirname(FILE), "uploads");
