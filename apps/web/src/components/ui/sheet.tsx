import { useEffect, useRef } from "react";
import type { DialogHTMLAttributes, ReactNode } from "react";

type SurfaceProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, "open" | "onCancel"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

function ModalSurface({ open, onOpenChange, className, children, ...props }: SurfaceProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog ref={dialogRef} className={`ui-native-surface${className ? ` ${className}` : ""}`} onCancel={event => { event.preventDefault(); onOpenChange(false); }} {...props}>{children}</dialog>;
}

export function SheetContent(props: SurfaceProps & { side?: "top" | "right" | "bottom" | "left"; surfaceClassName?: string }) {
  const { side = "right", surfaceClassName = "ui-sheet-content", className, ...surfaceProps } = props;
  return <ModalSurface data-slot="sheet-content" data-side={side} className={`${surfaceClassName}${className ? ` ${className}` : ""}`} {...surfaceProps} />;
}

export function SheetHeader(props: React.ComponentProps<"div">) { return <div data-slot="sheet-header" {...props} />; }
export function SheetTitle(props: React.ComponentProps<"h2">) { return <h2 data-slot="sheet-title" {...props} />; }
export function SheetDescription(props: React.ComponentProps<"p">) { return <p data-slot="sheet-description" {...props} />; }
