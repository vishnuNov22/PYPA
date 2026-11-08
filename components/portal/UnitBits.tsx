"use client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Combobox, Field, Input, Select } from "@/components/ui/Field";
import { FormModal } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/kit";
import { act, useRpc } from "@/lib/client";
import { useConfirm } from "@/components/ui/Confirm";
import { FUNCS } from "@/lib/consts";
import { fmtDate } from "@/lib/format";

export interface CouncilRow { id: string; name: string; memberId: string | null; functionary: string; termEnds: string; current: boolean }

/** The council table used on unit view and unit edit, with the Add/Edit popup (searchable member dropdown). */
export function CouncilTable({ kind, id, rows, editable }: { kind: string; id: string; rows: CouncilRow[]; editable: boolean }) {
  const [ask, confirmDialog] = useConfirm();
  const [edit, setEdit] = useState<CouncilRow | "new" | null>(null);
  const [member, setMember] = useState(""), [func, setFunc] = useState(FUNCS[0]), [ends, setEnds] = useState("");
  const { data: cands } = useRpc<{ id: string; name: string; local: string }[]>(edit ? "council.candidates" : null, { kind, id });
  const openEdit = (r: CouncilRow | "new") => { setEdit(r); if (r === "new") { setMember(""); setFunc(FUNCS[0]); setEnds(""); } else { setMember(r.memberId || ""); setFunc(r.functionary); setEnds(r.termEnds); } };
  const row = edit && edit !== "new" ? edit : null;
  const opts = (cands || []).map((c) => ({ value: c.id, label: c.name, sub: c.local }));
  if (row && row.memberId && !opts.some((o) => o.value === row.memberId)) opts.unshift({ value: row.memberId, label: row.name, sub: "" });
  return (
    <>
      {confirmDialog}
      <div className="scroll-thin overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[560px] text-sm"><thead><tr className="bg-sunk/70 text-left text-xs uppercase tracking-wider text-mute"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Functionary</th><th className="px-4 py-3">Term ends on</th><th className="px-4 py-3">Status</th>{editable && <th className="px-4 py-3 text-right">Actions</th>}</tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-t border-line"><td className="px-4 py-3 font-semibold">{r.name}</td><td className="px-4 py-3">{r.functionary}</td><td className="px-4 py-3">{fmtDate(r.termEnds)}</td>
              <td className="px-4 py-3"><Pill tone={r.current ? "ok" : ""}>{r.current ? "Active" : "Past"}</Pill></td>
              {editable && <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1.5">
                <button className="btn btn-sm" onClick={() => openEdit(r)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                <button className="btn btn-sm btn-bad" aria-label="Remove" onClick={async () => { if (await ask("Remove from council", `Remove ${r.name} from the council?`, "Remove", true)) await act("council.remove", { kind, id, rowId: r.id }, "Removed from council."); }}><Trash2 className="h-3.5 w-3.5" /></button></div></td>}
            </tr>))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-mute">No council members yet.</td></tr>}</tbody></table>
      </div>
      {editable && <button className="btn btn-pri btn-sm mt-4" onClick={() => openEdit("new")}><Plus className="h-4 w-4" />Add council member</button>}
      <FormModal open={!!edit} onClose={() => setEdit(null)} title={row ? "Edit council member" : "Add council member"} submitLabel={row ? "Save" : "Add"}
        onSubmit={async () => { const r = await act("council.save", { kind, id, rowId: row?.id, memberId: member, functionary: func, termEnds: ends }, row ? "Council updated." : "Council member added."); return r ? undefined : false; }}>
        <Field label="Member name" required><Combobox options={opts} value={member} onChange={setMember} placeholder="Search by name" /></Field>
        <Field label="Functionary" required><Select options={FUNCS} value={func} onChange={(e) => setFunc(e.target.value)} /></Field>
        <Field label="Term ends on" required hint="When this date passes, the member shows as Past."><Input type="date" required value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
      </FormModal>
    </>
  );
}
