import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"

const Offcanvas = DialogPrimitive.Root

const OffcanvasPortal = DialogPrimitive.Portal

const OffcanvasClose = DialogPrimitive.Close

const OffcanvasTrigger = DialogPrimitive.Trigger

const OffcanvasOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
OffcanvasOverlay.displayName = DialogPrimitive.Overlay.displayName

const OffcanvasContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <OffcanvasPortal>
    <OffcanvasOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-background shadow-lg duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right right-0 top-0 h-full w-full max-w-xs sm:max-w-sm flex flex-col",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </OffcanvasPortal>
))
OffcanvasContent.displayName = DialogPrimitive.Content.displayName

export { Offcanvas, OffcanvasPortal, OffcanvasTrigger, OffcanvasClose, OffcanvasOverlay, OffcanvasContent }
