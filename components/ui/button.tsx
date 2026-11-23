import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", asChild, ...props }: React.ComponentProps<"button"> & {
  asChild?: boolean;
  variant?: "primary" | "outline" | "text";
}) {
  const Component = asChild ? Slot : "button";
  return <Component data-slot="button" className={cn("button", `button-${variant}`, className)} {...props} />;
}
