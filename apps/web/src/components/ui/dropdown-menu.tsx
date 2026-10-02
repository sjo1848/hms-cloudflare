import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

const MenuCloseContext = createContext<() => void>(() => {});

export function DropdownMenu({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const dismiss = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key === "Tab") {
      event.preventDefault();
      const root = rootRef.current;
      const candidates = [...document.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter(element => !root?.contains(element) && element.getClientRects().length > 0);
      const following = root && candidates.find(element => Boolean(root.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING));
      const previous = root && [...candidates].reverse().find(element => Boolean(root.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING));
      setOpen(false);
      requestAnimationFrame(() => {
        // The trigger can be the last focusable control in a focused workspace
        // (for example, the selected Reception case). Keep Tab navigation in
        // the document by wrapping to the opposite end instead of returning
        // focus to the trigger and trapping keyboard users in the menu.
        const target = event.shiftKey
          ? previous ?? candidates.at(-1)
          : following ?? candidates[0];
        if (target) target.focus();
        else triggerRef.current?.focus();
      });
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
      items[next]?.focus();
    }
  }

  return <div className="ui-dropdown-root" ref={rootRef}>
    <button ref={triggerRef} type="button" className="secondary-button reception-more-actions" aria-haspopup="menu" aria-expanded={Boolean(open)} onClick={() => setOpen(value => !value)}>{label} <span aria-hidden="true">⌄</span></button>
    {open ? <MenuCloseContext.Provider value={close}><div ref={menuRef} className="ui-dropdown-menu" role="menu" aria-label={label} onKeyDown={onMenuKeyDown}>{children}</div></MenuCloseContext.Provider> : null}
  </div>;
}

export function DropdownMenuItem({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const close = useContext(MenuCloseContext);
  return <button type="button" role="menuitem" className="ui-dropdown-menu-item" onClick={() => { onClick(); close(); }}>{children}</button>;
}
