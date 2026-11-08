export type Role = "admin" | "state" | "zone" | "centre" | "local";
export type Kind = "zone" | "centre" | "local";
export type UnitKind = Kind | "state";

export interface Person { name: string; email: string; mobile: string }
export interface Unit {
  id: string; name: string; parent: string; contact: string; established: string;
  addr1: string; addr2: string; city: string; panchayat: string; taluk: string; pincode: string;
  status: string; admin: Person; code?: string; zoneId?: string; centreId?: string; registered?: boolean;
}
export interface Member {
  id: string; name: string; gender: string; dob: string; blood: string; govId: string; family: string;
  father: string; mother: string; marital: string; perm: string; comm: string; mobile: string; email: string;
  photo: string | null; zone: string; centre: string; local: string; saved: string; baptism: string; from: string;
  tenth: string; twelfth: string; diploma: string; ug: string; pg: string; pgd: string; phd: string;
  employed: string; occType: string; occOrg: string; residence: string; country: string;
  status: string; reason: string; paid: number[];
}
export interface CouncilRow { id: string; unitType: UnitKind; unitId: string; memberId: string | null; name: string; functionary: string; termEnds: string }
export interface User { id: string; email: string; role: Role; unitId: string | null; name: string; pw: string; mustChange: boolean }
export interface Notif { id: string; to: string[]; title: string; body: string; date: string; readBy: string[]; go?: string; goParams?: Record<string, string> }
export interface Activity { id: string; date: string; role: Role; unitId: string | null; zoneId: string | null; user: string; type: "Add" | "Edit"; desc: string }
export interface Due {
  id: string; date: string; role: Role; unitId: string; zone: string; centre: string; local: string; paidBy: string; unitName: string;
  mode: "Online" | "Offline"; ref?: string; years: number[]; count: number; amount: number; status: "Pending" | "Approved" | "Rejected"; remarks: string;
}
export interface Attachment { name: string; size: number; date: string; url?: string }
export interface Letter { id: string; from: string; fromLabel: string; to: string[]; subject: string; body: string; date: string; attachment: Attachment | null; sms: boolean }
export interface Freeze { id: string; start: string; end: string; remarks: string; ended: boolean }
export interface Transfer { id: string; memberId: string; fromLocal: string; toLocal: string; by: string; date: string; status: "Pending" | "Approved" | "Rejected"; reason?: string }
export interface TalentCategory { id: string; name: string; from: string; to: string }
export interface TalentEvent { id: string; name: string; gender: "Male" | "Female" | "Both"; type: "Individual" | "Common" | "Group"; cats: string[]; n: number }
export interface TalentEntry { id: string; memberId: string; category: string; events: string[]; by: string; evBy?: Record<string, string> }
export interface TalentGroup { id: string; eventId: string; name: string; memberIds: string[]; by: string }
export interface Mail { id: string; to: string; subject: string; body: string; date: string }
export interface Master {
  idFormat: { prefix: string; useZone: boolean; digits: number; sep: string };
  fee: number; lists: Record<string, string[]>;
}
export interface Project { id: string; title: string; tag: string; status: string; color: string; text: string; when: string }
export interface WallItem { id: string; title: string; author: string; unit: string; type: string; text?: string; seed: number; img?: string | null }
export interface Issue { id: string; title: string; issue: string; color: string; headline: string; lead: string; pdf: string | null }
export interface Job { id: string; title: string; org: string; loc: string; type: string; pay: string; date: string; deadline: string; text: string; contact: string; status: "Approved" | "Pending" }
export interface Content {
  home: { kicker: string; headline1: string; headline2: string; sub: string; subMl: string; banner: string | null };
  about: { mission: string; vision: string; stands: string; pillars: [string, string][]; history: [string, string][] };
  projects: Project[];
  leadership: { office: string; phone: string; email: string; note: string; social: [string, string][] };
  wall: WallItem[]; kahalam: Issue[]; jobs: Job[];
}
export interface DB {
  zones: Unit[]; centres: Unit[]; locals: Unit[]; members: Member[]; council: CouncilRow[]; users: User[];
  notifs: Notif[]; activity: Activity[]; dues: Due[]; letters: Letter[]; freezes: Freeze[]; transfers: Transfer[];
  outbox: Mail[]; sms: { id: string; to: string[]; text: string; date: string }[];
  runs: { age: { date: string; n: number } | null; dup: string | null };
  state: Unit; master: Master;
  talent: { categories: TalentCategory[]; events: TalentEvent[]; entries: TalentEntry[]; groups: TalentGroup[] };
  content: Content;
}
export interface SessionUser { id: string; email: string; role: Role; unitId: string | null; name: string }
