import React, { useEffect, useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { ArrowLeft, X } from "lucide-react";

const DESKTOP_QUERY = "(min-width: 768px)";

// Peak / half / full. The sheet opens at "half" because that is where the form
// inputs live; dragging up reveals full height, dragging down parks it on the
// summary. Every release springs to the nearest of these, never in between.
const SNAPS = [0.5, 0.8, 1];

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(DESKTOP_QUERY).matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia(DESKTOP_QUERY);
    const listener = (event) => setDesktop(event.matches);
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    }
    query.addListener(listener);
    return () => query.removeListener(listener);
  }, []);

  return desktop;
}

/**
 * Context-preserving container for non-destructive work (forms, pickers,
 * notification lists).
 *
 * Phones get a bottom sheet with three snap points and velocity-aware
 * dismissal; desktops get a right-hand drawer whose width stays between 320px
 * and 40vw so the page behind it stays readable. Pass `onBack` to swap the
 * sheet's content in place for a child view instead of opening a second
 * container, and `blocking` confirmations belong in <Modal>, not here.
 */
export default function Sheet({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  footer,
  onBack,
  headerRight,
  children,
}) {
  const desktop = useIsDesktop();
  const [snap, setSnap] = useState(SNAPS[1]);

  useEffect(() => {
    if (open) setSnap(SNAPS[1]);
  }, [open]);

  const shell = (
    <>
      {!desktop && (
        <div className="flex shrink-0 justify-center pb-1 pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>
      )}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 pb-3 pt-2 sm:px-5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Icon className="h-4 w-4" />
            </span>
          )
        )}
        <div className="min-w-0 flex-1">
          <DrawerPrimitive.Title className="truncate font-heading text-base font-semibold">
            {title}
          </DrawerPrimitive.Title>
          {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {headerRight}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
      {footer && (
        <div
          className="flex shrink-0 justify-end gap-2 border-t border-border px-4 py-3 sm:px-5"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          {footer}
        </div>
      )}
    </>
  );

  if (desktop) {
    return (
      <DrawerPrimitive.Root
        open={open}
        onOpenChange={(next) => { if (!next) onClose(); }}
        direction="right"
        dismissible
        modal
      >
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/40" />
          <DrawerPrimitive.Content className="fixed right-0 top-0 z-[70] flex h-[100dvh] w-[40vw] min-w-[320px] max-w-[40vw] flex-col border-l border-border bg-card text-foreground shadow-2xl outline-none">
            {shell}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    );
  }

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(next) => { if (!next) onClose(); }}
      direction="bottom"
      dismissible
      modal
      snapPoints={SNAPS}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      // A slow drag must clear half the sheet before it commits; a fast flick
      // closes from anywhere. Vaul springs to the nearest snap otherwise.
      closeThreshold={0.5}
      fadeFromIndex={0}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/40" />
        <DrawerPrimitive.Content className="fixed inset-x-0 bottom-0 z-[70] flex h-[96dvh] flex-col rounded-t-2xl border-t border-border bg-card text-foreground shadow-2xl outline-none">
          {shell}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}