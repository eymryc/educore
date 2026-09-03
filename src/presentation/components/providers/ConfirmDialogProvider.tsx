"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertDialog } from "radix-ui";
import { createContext, useCallback, useContext, useRef, useState } from "react";

export interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm extends ConfirmOptions {
  message: string;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((message, options) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setPending({ message, ...options });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setPending(null);
  }, []);

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <AlertDialog.Root
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
      >
        <AnimatePresence>
          {pending && (
            <AlertDialog.Portal forceMount>
              <AlertDialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 bg-black/40 z-[100]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              </AlertDialog.Overlay>
              <AlertDialog.Content asChild forceMount>
                <motion.div
                  className="fixed left-1/2 top-1/2 w-full max-w-sm ui-card ui-card-pad z-[101] shadow-xl"
                  initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                  animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                  exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                  transition={{ duration: 0.15 }}
                >
                  <AlertDialog.Title className="font-title-sm text-on-surface">
                    {pending?.title ?? "Confirmer"}
                  </AlertDialog.Title>
                  <AlertDialog.Description className="font-body-sm text-on-surface-variant mt-sm">
                    {pending?.message}
                  </AlertDialog.Description>
                  <div className="flex justify-end gap-sm mt-lg">
                    <AlertDialog.Cancel asChild>
                      <button
                        type="button"
                        className="ui-btn-secondary"
                        onClick={() => settle(false)}
                      >
                        {pending?.cancelLabel ?? "Annuler"}
                      </button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <button
                        type="button"
                        className={
                          pending?.destructive
                            ? "inline-flex items-center gap-sm bg-error hover:bg-error/90 text-on-error font-label-caps text-label-caps px-md py-sm rounded-lg transition-colors shadow-sm"
                            : "ui-btn-primary"
                        }
                        onClick={() => settle(true)}
                      >
                        {pending?.confirmLabel ?? "Confirmer"}
                      </button>
                    </AlertDialog.Action>
                  </div>
                </motion.div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          )}
        </AnimatePresence>
      </AlertDialog.Root>
    </ConfirmDialogContext.Provider>
  );
}

/** Drop-in async replacement for window.confirm(message): await confirmDialog("..."). */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error("useConfirm doit être utilisé dans un ConfirmDialogProvider.");
  }
  return ctx;
}
