import { useEffect, useState } from 'react';
import { api, upload } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Modal from './Modal.jsx';
import { LoadingButton } from './ui.jsx';

const MAX_MB = 5;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
  const [photosOn, setPhotosOn] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState(''); // '' (idle), 'upload' or 'save'
  const busy = stage !== '';

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  // The server says whether photo uploads are switched on
  useEffect(() => {
    api('/config').then((c) => setPhotosOn(!!c.photos)).catch(() => {});
  }, []);

  // Free the preview image from memory when it changes or the box closes
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pickPhoto = (e) => {
    const chosen = e.target.files[0];
    e.target.value = '';
    if (!chosen) return;
    if (!TYPES.includes(chosen.type)) { setError('Please choose a JPG, PNG or WebP photo.'); return; }
    if (chosen.size > MAX_MB * 1024 * 1024) { setError(`That photo is too large. The limit is ${MAX_MB} MB.`); return; }
    setError('');
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  };

  const removePhoto = () => {
    setFile(null);
    setPreview('');
  };

  // datetime-local expects local time without a timezone suffix
  const soon = new Date(Date.now() + 60 * 60 * 1000);
  const min = new Date(soon.getTime() - soon.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setStage(file ? 'upload' : 'save');
    try {
      const photo = file ? await upload(file) : null;
      setStage('save');
      const created = await api('/posts', 'POST', {
        title: form.title.trim(),
        description: form.description.trim(),
        quantity: form.quantity.trim(),
        city: form.city.trim(),
        area: form.area.trim(),
        address: form.address.trim(),
        expiresAt: form.expires ? new Date(form.expires).toISOString() : '',
        ...(photo ? { imageUrl: photo.url, imagePublicId: photo.publicId } : {}),
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
      setStage('');
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

        {photosOn && (
          <div className="field">
            <span>Photo (optional)</span>
            {preview ? (
              <div className="photo-preview">
                <img src={preview} alt="The food you chose" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={removePhoto} disabled={busy}>Remove</button>
              </div>
            ) : (
              <label className="photo-drop">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} hidden />
                Add a photo of the food
                <small>JPG, PNG or WebP, up to {MAX_MB} MB</small>
              </label>
            )}
          </div>
        )}

        <p className="error-text" role="alert">{error}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <LoadingButton type="submit" busy={busy} busyText={stage === 'upload' ? 'Uploading photo...' : 'Submitting...'}>
            Submit for approval
          </LoadingButton>
        </div>
      </form>
    </Modal>
  );
}
