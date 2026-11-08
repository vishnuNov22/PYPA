import { hashPassword } from "./crypto";
/** Demo accounts all share this password. Hashed once at boot. */
export const DEMO_PASSWORD = "pypa@123";
export const DEFAULT_PW_HASH = hashPassword(DEMO_PASSWORD);
