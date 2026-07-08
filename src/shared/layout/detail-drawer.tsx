import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/shared/lib/cn";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function DetailDrawer({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  children,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex flex-col space-y-1 pr-6">
            {eyebrow ? (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                {eyebrow}
              </p>
            ) : null}
            <SheetTitle className="font-serif text-xl">{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-6 p-6">{children}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function DrawerSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {title ? <h3 className="font-semibold">{title}</h3> : null}
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  );
}

export function DrawerActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-auto flex items-center justify-end gap-2 border-t border-border bg-muted/30 p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
