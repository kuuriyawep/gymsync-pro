import React from "react";
import Modal from "@/components/ui/Modal";
import { AlertTriangle } from "lucide-react";
import { ghostBtn, primaryBtn } from "@/lib/uiClasses";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Delete", cancelLabel = "Cancel" }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button onClick={onClose} className={ghostBtn}>{cancelLabel}</button>
          <button onClick={onConfirm} className={primaryBtn}>{confirmLabel}</button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <AlertTriangle className="w-5 h-5" />
        </span>
        <p className="pt-1.5 text-sm text-muted-foreground">{message}</p>
      </div>
    </Modal>
  );
}