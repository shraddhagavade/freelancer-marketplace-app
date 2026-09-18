import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineOfficeBuilding, HiOutlineGlobe, HiOutlineLocationMarker, HiOutlineCheck } from 'react-icons/hi';
import { getClientProfile, updateClientProfile } from '../../services/profileService';
import AvatarUpload from '../../components/AvatarUpload';
import { useAuth } from '../../context/AuthContext';

export default function ClientProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    companyWebsite: '',
    description: '',
    location: '',
    avatarUrl: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await getClientProfile();
        setProfile(data);
        setForm({
          companyName: data.companyName || '',
          industry: data.industry || '',
          companyWebsite: data.companyWebsite || '',
          description: data.description || '',
          location: data.location || '',
          avatarUrl: data.avatarUrl || '',
        });
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const updated = await updateClientProfile(form);
      setProfile(updated);
      if (refreshUser) refreshUser({ avatarUrl: updated.avatarUrl });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="section py-20 text-center">
        <div className="animate-pulse text-brand-muted">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="section py-12 md:py-16">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-brand-ink">Company Profile</h1>
          <p className="text-brand-muted mt-1">Help freelancers know about your company</p>
        </div>

        <form onSubmit={handleSave} className="bg-white border border-gray-100 rounded-lg p-8 space-y-6">
          <div className="pb-2">
            <label className="block text-sm font-medium text-brand-ink mb-3">Profile Photo</label>
            <AvatarUpload
              value={form.avatarUrl}
              name={form.companyName || `${user?.firstName || ''} ${user?.lastName || ''}`}
              onChange={(dataUrl) => setForm({ ...form, avatarUrl: dataUrl })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1.5 flex items-center gap-1">
              <HiOutlineOfficeBuilding className="w-4 h-4" /> Company Name
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Your Company Inc."
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">Industry</label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Technology, Finance, Healthcare..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5 flex items-center gap-1">
                <HiOutlineLocationMarker className="w-4 h-4" /> Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Mumbai, India"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1.5 flex items-center gap-1">
              <HiOutlineGlobe className="w-4 h-4" /> Company Website
            </label>
            <input
              type="url"
              value={form.companyWebsite}
              onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
              placeholder="https://yourcompany.com"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1.5">About Your Company</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tell freelancers about your company, culture, and what kind of projects you work on..."
              rows={5}
              className="input-field resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg flex items-center gap-1">
              <HiOutlineCheck /> Profile saved successfully!
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
