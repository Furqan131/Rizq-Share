import { useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Modal from './Modal.jsx';
import { LoadingButton } from './ui.jsx';

export default function PostFoodModal({ onClose, onPosted }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: '',
    description: '',
    quantity: '',
    city: localStorage.getItem('lastCity') || '',
    area: '',
    address: '',
    expires: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  // datetime-local expects local time without a timezone suffix
  const soon = new Date(Date.now() + 60 * 60 * 1000);
  const min = new Date(soon.getTime() - soon.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const created = await api('/posts', 'POST', {
        title: form.title.trim(),
        description: form.description.trim(),
        quantity: form.quantity.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        address: form.address.trim(),
        expiresAt: form.expires ? new Date(form.expires).toISOString() : '',
      });
      localStorage.setItem('lastCity', form.city.trim());
      toast(
        created.approval === 'PENDING'
          ? 'Submitted. It will go live once an admin approves it.'
          : 'Food posted'
      );
      onPosted();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2>Post surplus food</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        An admin reviews every post before it goes live. Your pickup address stays private until someone claims it.
      </p>
      <form onSubmit={submit} noValidate>
        <label className="field"><span>Title</span>
          <input value={form.title} onChange={set('title')} placeholder="Chicken biryani from a wedding" autoFocus />
        </label>
        <label className="field"><span>Description (optional)</span>
          <textarea value={form.description} onChange={set('description')} placeholder="Packed in trays, still warm" />
        </label>
        <label className="field"><span>Quantity</span>
          <input value={form.quantity} onChange={set('quantity')} placeholder="Feeds 25 people" />
        </label>
        <div className="row">
          <label className="field"><span>City</span>
            <input value={form.city} onChange={set('city')} />
          </label>
          <label className="field"><span>Area</span>
            <input value={form.area} onChange={set('area')} placeholder="Gulshan-e-Iqbal" />
          </label>
        </div>
        <label className="field"><span>Pickup address</span>
          <input value={form.address} onChange={set('address')} placeholder="Block 5, near Aladin Park" />
        </label>
        <label className="field"><span>Best before</span>
          <input type="datetime-local" min={min} value={form.expires} onChange={set('expires')} />
        </label>
        <p className="error-text" role="alert">{error}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <LoadingButton type="submit" busy={busy} busyText="Submitting...">Submit for approval</LoadingButton>
        </div>
      </form>
    </Modal>
  );
}
