import type { ComponentProps, ReactNode } from "react";
import { SheetContent } from "./sheet";

type DrawerContentProps = ComponentProps<typeof SheetContent> & { children: ReactNode };

export function DrawerContent({ className, children, ...props }: DrawerContentProps) {
  return <SheetContent data-slot="drawer-content" surfaceClassName="ui-drawer-popup" className={className} {...props}><div className="ui-drawer-content">{children}</div></SheetContent>;
}

export function DrawerHeader(props: ComponentProps<"div">) { return <div data-slot="drawer-header" {...props} />; }
export function DrawerTitle(props: ComponentProps<"h2">) { return <h2 data-slot="drawer-title" {...props} />; }
export function DrawerDescription(props: ComponentProps<"p">) { return <p data-slot="drawer-description" {...props} />; }
