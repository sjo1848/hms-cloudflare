import { NativeModalSurface } from "./native-modal";
import type { NativeModalProps } from "./native-modal";

export function SheetContent(props: NativeModalProps & { side?: "top" | "right" | "bottom" | "left"; surfaceClassName?: string }) {
  const { side = "right", surfaceClassName = "ui-sheet-content", className, ...surfaceProps } = props;
  return <NativeModalSurface data-slot="sheet-content" data-side={side} className={`${surfaceClassName}${className ? ` ${className}` : ""}`} {...surfaceProps} />;
}

export function SheetHeader(props: React.ComponentProps<"div">) { return <div data-slot="sheet-header" {...props} />; }
export function SheetTitle(props: React.ComponentProps<"h2">) { return <h2 data-slot="sheet-title" {...props} />; }
export function SheetDescription(props: React.ComponentProps<"p">) { return <p data-slot="sheet-description" {...props} />; }
