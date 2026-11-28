import { useState } from 'react';
import Modal from './Modal.jsx';
import { LoadingButton } from './ui.jsx';

// A "Are you sure?" box. onConfirm should return true when it worked (the parent then closes the box).
export default function ConfirmModal({
  title,
  text,
  confirmText,
  busyText = 'Please wait...',
  cancelText = 'Go back',
  danger,
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const ok = await onConfirm();
    if (!ok) setBusy(false);
  };

  return (
    <Modal onClose={onClose}>
      <h2>{title}</h2>
      <p className="muted">{text}</p>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose} disabled={busy}>{cancelText}</button>
        <LoadingButton busy={busy} busyText={busyText} onClick={run} style={danger ? { background: 'var(--chili)' } : undefined}>
          {confirmText}
        </LoadingButton>
      </div>
    </Modal>
  );
}
