import { authHandlers, PUBLIC_ACTIONS } from "./handlers/auth";
import { orgHandlers } from "./handlers/org";
import { dashHandlers } from "./handlers/dash";
import { unitHandlers } from "./handlers/units";
import { memberHandlers } from "./handlers/members";
import { dueHandlers } from "./handlers/dues";
import { letterHandlers } from "./handlers/letters";
import { activityHandlers } from "./handlers/activity";
import { talentHandlers } from "./handlers/talent";
import { adminPanelHandlers } from "./handlers/adminpanel";
import { siteHandlers } from "./handlers/site";
import type { SessionUser } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (u: any, input: any) => unknown;
export const HANDLERS: Record<string, Handler> = {
  ...authHandlers, ...orgHandlers, ...dashHandlers, ...unitHandlers, ...memberHandlers, ...dueHandlers,
  ...letterHandlers, ...activityHandlers, ...talentHandlers, ...adminPanelHandlers, ...siteHandlers,
};
export { PUBLIC_ACTIONS };
export type { SessionUser };
