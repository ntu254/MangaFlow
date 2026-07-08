import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background shadow-[0_16px_34px_-18px_hsl(var(--primary)/0.28)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/92 hover:-translate-y-0.5 font-body",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-0.5 font-body",
        outline: "border border-border bg-background/85 text-foreground hover:bg-secondary/90 font-body shadow-none",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/92 hover:-translate-y-0.5 font-body",
        ghost: "hover:bg-secondary/90 hover:text-foreground font-body shadow-none",
        link: "text-foreground underline-offset-4 hover:underline font-body shadow-none",
        hero: "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 font-body font-medium tracking-wide uppercase text-xs",
        "hero-outline": "border border-border bg-background/78 text-foreground hover:bg-secondary/92 font-body font-medium tracking-wide uppercase text-xs shadow-none",
        accent: "bg-accent text-accent-foreground hover:bg-accent/92 hover:-translate-y-0.5 font-body font-medium tracking-wide uppercase text-xs shadow-[0_18px_34px_-18px_hsl(var(--accent)/0.62)]",
        teal: "bg-teal text-teal-foreground hover:bg-teal/92 hover:-translate-y-0.5 font-body font-medium tracking-wide uppercase text-xs",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-10",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
