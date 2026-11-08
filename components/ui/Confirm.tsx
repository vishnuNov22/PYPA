"use client";
import { useCallback, useRef, useState } from "react";
import { FormModal } from "./Modal";

/** const [confirm, dialog] = useConfirm(); ... if (await confirm("Title", "Text")) {...}; render {dialog} */
export function useConfirm() {
  const [st, setSt] = useState<{ title: string; text: string; label: string; danger: boolean } | null>(null);
  const res = useRef<((v: boolean) => void) | null>(null);
  const ask = useCallback((title: string, text: string, label = "Confirm", danger = false) => new Promise<boolean>((r) => { res.current = r; setSt({ title, text, label, danger }); }), []);
  const close = (v: boolean) => { res.current?.(v); res.current = null; setSt(null); };
  const dialog = (
    <FormModal open={!!st} onClose={() => close(false)} title={st?.title || ""} size="sm" submitLabel={st?.label} danger={st?.danger} onSubmit={() => { close(true); }}>
      <p className="text-[15px]">{st?.text}</p>
    </FormModal>
  );
  return [ask, dialog] as const;
}
