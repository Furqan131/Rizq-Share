import { useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Modal from './Modal.jsx';
import { LoadingButton } from './ui.jsx';
import { PinIcon, UserIcon, SuccessMark } from './icons.jsx';

// Step 1: confirm. Step 2: show the pickup details.
export default function ClaimModal({ post, onClose, onDone }) {
  const toast = useToast();
  const [claimed, setClaimed] = useState(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    onClose();
    if (claimed) onDone();
  };

  const confirm = async () => {
    setBusy(true);
    try {
      setClaimed(await api(`/posts/${post.id}/claim`, 'PATCH'));
    } catch (err) {
      toast(err.message, 'error');
      onClose();
      onDone();
    }
  };

  const copyAddress = () => {
    const text = `${claimed.address}, ${claimed.area}, ${claimed.city}`;
    navigator.clipboard.writeText(text).then(
      () => toast('Address copied'),
      () => toast('Could not copy the address', 'error')
    );
  };

  if (!claimed) {
    return (
      <Modal onClose={close}>
        <h2>Claim this food?</h2>
        <p className="muted">
          Once you claim it, nobody else can. You'll see the pickup address and the donor's contact right away, so please collect it before it expires.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <LoadingButton busy={busy} busyText="Claiming..." onClick={confirm}>Yes, claim it</LoadingButton>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={close}>
      <SuccessMark />
      <h2>It's yours</h2>
      <p className="muted">Collect it before it expires. You can find it again in your dashboard.</p>
      <div className="pickup">
        <p><strong>{claimed.title}</strong> ({claimed.quantity})</p>
        <p><PinIcon /> {claimed.address}, {claimed.area}, {claimed.city}</p>
        <p>
          <UserIcon /> {claimed.donor.name}
          {claimed.donor.phone && <> · <a href={`tel:${claimed.donor.phone}`}>{claimed.donor.phone}</a></>}
        </p>
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={copyAddress}>Copy address</button>
        <button className="btn btn-primary" onClick={close}>Done</button>
      </div>
    </Modal>
  );
}
