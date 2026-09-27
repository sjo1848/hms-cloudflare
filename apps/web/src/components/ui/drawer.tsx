import type { ComponentProps, ReactNode } from "react";
import { NativeModalSurface } from "./native-modal";
import type { NativeModalProps } from "./native-modal";

type DrawerContentProps = NativeModalProps & { children: ReactNode };

export function DrawerContent({ className, children, ...props }: DrawerContentProps) {
  return <NativeModalSurface data-slot="drawer-content" className={`ui-drawer-popup${className ? ` ${className}` : ""}`} {...props}><div className="ui-drawer-content">{children}</div></NativeModalSurface>;
}

export function DrawerHeader(props: ComponentProps<"div">) { return <div data-slot="drawer-header" {...props} />; }
export function DrawerTitle(props: ComponentProps<"h2">) { return <h2 data-slot="drawer-title" {...props} />; }
export function DrawerDescription(props: ComponentProps<"p">) { return <p data-slot="drawer-description" {...props} />; }
