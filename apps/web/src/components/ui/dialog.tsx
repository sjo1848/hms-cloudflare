import type { ComponentProps, ReactNode } from "react";
import { NativeModalSurface } from "./native-modal";
import type { NativeModalProps } from "./native-modal";

type DialogContentProps = NativeModalProps & { children: ReactNode };

// Source-local native dialog adaptation. This intentionally is not a generated shadcn component.
export function DialogContent({ className, children, ...props }: DialogContentProps) {
  return <NativeModalSurface data-slot="dialog-content" className={`ui-dialog-content${className ? ` ${className}` : ""}`} {...props}>{children}</NativeModalSurface>;
}

export function DialogHeader(props: ComponentProps<"div">) { return <div data-slot="dialog-header" {...props} />; }
export function DialogTitle(props: ComponentProps<"h2">) { return <h2 data-slot="dialog-title" {...props} />; }
export function DialogDescription(props: ComponentProps<"p">) { return <p data-slot="dialog-description" {...props} />; }
