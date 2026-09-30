import { useState, useEffect, useRef } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePhotograph, HiOutlineExternalLink, HiOutlineX } from 'react-icons/hi';
import {
  getFreelancerPortfolio,
  addPortfolioItem,
  deletePortfolioItem,
} from '../services/profileService';

const MAX_IMAGE_BYTES = 1_500_000; // ~1.5MB before base64

export default function PortfolioManager({ userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', projectUrl: '', imageUrl: '' });
  const fileRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    getFreelancerPortfolio(userId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [userId]);

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is too large (max ~1.5MB). Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const created = await addPortfolioItem(form);
      setItems((prev) => [created, ...prev]);
      setForm({ title: '', description: '', projectUrl: '', imageUrl: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this portfolio item?')) return;
    try {
      await deletePortfolioItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert('Failed to delete item');
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-brand-ink flex items-center gap-2">
          <HiOutlinePhotograph /> Portfolio &amp; Work Samples
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => { setShowForm(true); setError(''); }}
            className="btn-secondary !py-2 !px-3 text-sm flex items-center gap-1"
          >
            <HiOutlinePlus className="w-4 h-4" /> Add Work
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-gray-100 rounded-xl p-4 mb-5 bg-brand-hover/40">
          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}
          <div className="space-y-3">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Project title *"
              className="input-field"
              maxLength={150}
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of the work..."
              rows={3}
              className="input-field resize-none"
              maxLength={1000}
            />
            <input
              type="url"
              value={form.projectUrl}
              onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
              placeholder="Live link / repo (optional)"
              className="input-field"
            />

            {/* Image picker */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-secondary !py-2 !px-3 text-sm flex items-center gap-1"
              >
                <HiOutlinePhotograph className="w-4 h-4" /> {form.imageUrl ? 'Change image' : 'Add image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              {form.imageUrl && (
                <div className="relative">
                  <img src={form.imageUrl} alt="preview" className="h-12 w-16 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: '' })}
                    className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5"
                  >
                    <HiOutlineX className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleAdd} disabled={saving} className="btn-primary !py-2 text-sm">
                {saving ? 'Adding...' : 'Add to Portfolio'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); setForm({ title: '', description: '', projectUrl: '', imageUrl: '' }); }}
                className="btn-secondary !py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing items */}
      {loading ? (
        <p className="text-sm text-brand-muted py-4 text-center">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-brand-muted py-6 text-center">
          No work samples yet. Add your best projects so clients can see what you can do.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden relative group">
              {item.imageUrl ? (
                <div className="aspect-video overflow-hidden bg-brand-hover">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-brand-primary/20 to-brand-primaryLight/20 flex items-center justify-center">
                  <HiOutlinePhotograph className="w-8 h-8 text-brand-primary/50" />
                </div>
              )}
              <div className="p-3">
                <h4 className="font-semibold text-brand-ink text-sm">{item.title}</h4>
                {item.description && <p className="text-xs text-brand-muted mt-1 line-clamp-2">{item.description}</p>}
                {item.projectUrl && (
                  <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline mt-1">
                    View <HiOutlineExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 bg-white/90 border border-gray-200 rounded-full p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
