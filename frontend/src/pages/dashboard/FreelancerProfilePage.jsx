import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineBriefcase, HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineGlobe, HiOutlineCode, HiOutlineStar, HiOutlineCheck } from 'react-icons/hi';
import { getFreelancerProfile, updateFreelancerProfile, getSkills } from '../../services/profileService';
import AvatarUpload from '../../components/AvatarUpload';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';

const EXPERIENCE_LEVELS = ['ENTRY', 'INTERMEDIATE', 'EXPERT'];
const AVAILABILITY_OPTIONS = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'NOT_AVAILABLE'];

export default function FreelancerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    title: '',
    overview: '',
    hourlyRate: '',
    experienceLevel: 'INTERMEDIATE',
    availability: 'FULL_TIME',
    yearsOfExperience: '',
    portfolioUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    avatarUrl: '',
    skills: [],
  });

  useEffect(() => {
    async function load() {
      try {
        const [profileData, skillsData] = await Promise.all([
          getFreelancerProfile(),
          getSkills(),
        ]);
        setProfile(profileData);
        setAllSkills(skillsData);
        setForm({
          title: profileData.title || '',
          overview: profileData.overview || '',
          hourlyRate: profileData.hourlyRate || '',
          experienceLevel: profileData.experienceLevel || 'INTERMEDIATE',
          availability: profileData.availability || 'FULL_TIME',
          yearsOfExperience: profileData.yearsOfExperience || '',
          portfolioUrl: profileData.portfolioUrl || '',
          linkedinUrl: profileData.linkedinUrl || '',
          githubUrl: profileData.githubUrl || '',
          avatarUrl: profileData.avatarUrl || '',
          skills: profileData.skills ? [...profileData.skills] : [],
        });
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleSkill(skillName) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillName)
        ? prev.skills.filter((s) => s !== skillName)
        : [...prev.skills, skillName],
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const updated = await updateFreelancerProfile({
        ...form,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
        yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience) : null,
      });
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-brand-ink">Edit Profile</h1>
          <p className="text-brand-muted mt-1">Make your profile stand out to attract clients</p>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Photo */}
            <div className="bg-white border border-gray-100 rounded-lg p-6">
              <h2 className="text-lg font-bold text-brand-ink mb-4">Profile Photo</h2>
              <AvatarUpload
                value={form.avatarUrl}
                name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                onChange={(dataUrl) => setForm({ ...form, avatarUrl: dataUrl })}
              />
            </div>

            {/* Professional Title */}
            <div className="bg-white border border-gray-100 rounded-lg p-6">
              <h2 className="text-lg font-bold text-brand-ink mb-4 flex items-center gap-2">
                <HiOutlineBriefcase /> Professional Info
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1.5">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Senior Full-Stack Developer"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1.5">Overview</label>
                  <textarea
                    value={form.overview}
                    onChange={(e) => setForm({ ...form, overview: e.target.value })}
                    placeholder="Describe your experience, strengths, and what you bring to projects..."
                    rows={5}
                    className="input-field resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-1.5">
                      <span className="inline font-semibold">&#8377;</span> Hourly Rate (&#8377;)
                    </label>
                    <input
                      type="number"
                      value={form.hourlyRate}
                      onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                      placeholder="50"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-1.5">
                      <HiOutlineStar className="inline w-4 h-4" /> Experience Level
                    </label>
                    <select
                      value={form.experienceLevel}
                      onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                      className="input-field"
                    >
                      {EXPERIENCE_LEVELS.map((l) => (
                        <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-1.5">
                      <HiOutlineClock className="inline w-4 h-4" /> Years of Experience
                    </label>
                    <input
                      type="number"
                      value={form.yearsOfExperience}
                      onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                      placeholder="5"
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1.5">Availability</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, availability: opt })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          form.availability === opt
                            ? 'bg-brand-ink text-white'
                            : 'bg-brand-hover text-brand-muted hover:text-brand-ink'
                        }`}
                      >
                        {opt.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="bg-white border border-gray-100 rounded-lg p-6">
              <h2 className="text-lg font-bold text-brand-ink mb-4 flex items-center gap-2">
                <HiOutlineGlobe /> Links & Portfolio
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1.5">Portfolio URL</label>
                  <input
                    type="url"
                    value={form.portfolioUrl}
                    onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
                    placeholder="https://your-portfolio.com"
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-1.5">LinkedIn</label>
                    <input
                      type="url"
                      value={form.linkedinUrl}
                      onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/you"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-1.5">GitHub</label>
                    <input
                      type="url"
                      value={form.githubUrl}
                      onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                      placeholder="https://github.com/you"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white border border-gray-100 rounded-lg p-6">
              <h2 className="text-lg font-bold text-brand-ink mb-4 flex items-center gap-2">
                <HiOutlineCode /> Skills
              </h2>
              <p className="text-sm text-brand-muted mb-4">Select skills that match your expertise</p>
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.name)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      form.skills.includes(skill.name)
                        ? 'bg-brand-ink text-white'
                        : 'bg-brand-hover text-brand-muted hover:text-brand-ink hover:bg-gray-200'
                    }`}
                  >
                    {form.skills.includes(skill.name) && <HiOutlineCheck className="inline w-3.5 h-3.5 mr-1" />}
                    {skill.name}
                  </button>
                ))}
              </div>
              {form.skills.length > 0 && (
                <p className="text-xs text-brand-muted mt-3">{form.skills.length} skills selected</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <div className="bg-white border border-gray-100 rounded-lg p-6 sticky top-20">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Profile Preview</h3>
              <div className="text-center">
                <div className="mx-auto mb-3 w-fit">
                  <Avatar src={form.avatarUrl} name={`${profile?.firstName || ''} ${profile?.lastName || ''}`} size={64} />
                </div>
                <h4 className="font-bold text-brand-ink">{profile?.firstName} {profile?.lastName}</h4>
                <p className="text-sm text-brand-muted mt-0.5">{form.title || 'No title set'}</p>
                {form.hourlyRate && (
                  <p className="text-lg font-bold text-brand-ink mt-2">&#8377;{form.hourlyRate}/hr</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Level</span>
                  <span className="font-medium">{form.experienceLevel?.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Availability</span>
                  <span className="font-medium">{form.availability?.replace('_', ' ').toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Skills</span>
                  <span className="font-medium">{form.skills.length}</span>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6">
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>
                )}
                {success && (
                  <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg mb-3 flex items-center gap-1">
                    <HiOutlineCheck /> Profile saved!
                  </div>
                )}
                <button type="submit" className="btn-primary w-full" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
