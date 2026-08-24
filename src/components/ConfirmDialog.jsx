import React from "react";
import Modal from "@/components/ui/Modal";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Delete", cancelLabel = "Cancel" }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-black/15 hover:bg-black/5">{cancelLabel}</button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-black/90">{confirmLabel}</button>
      </>}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></div>
        <p className="text-sm text-black/60 pt-1.5">{message}</p>
      </div>
    </Modal>
  );
}