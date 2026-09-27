import { useEffect, useRef } from "react";
import type { DialogHTMLAttributes, ReactNode } from "react";

export type NativeModalProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "onCancel"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function NativeModalSurface({ open, onOpenChange, className, children, ...props }: NativeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog ref={dialogRef} className={`ui-native-surface${className ? ` ${className}` : ""}`} onCancel={event => { event.preventDefault(); onOpenChange(false); }} {...props}>{children}</dialog>;
}
