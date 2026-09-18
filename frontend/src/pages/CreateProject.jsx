import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineCheck } from 'react-icons/hi';
import { createProject } from '../services/projectService';
import { getCategories, getSkills } from '../services/profileService';

const EXPERIENCE_LEVELS = ['ENTRY', 'INTERMEDIATE', 'EXPERT'];

export default function CreateProject() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    experienceLevel: 'INTERMEDIATE',
    categoryId: '',
    skills: [],
  });

  useEffect(() => {
    Promise.all([getCategories(), getSkills()]).then(([cats, skills]) => {
      setCategories(cats);
      setAllSkills(skills);
    });
  }, []);

  function toggleSkill(name) {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(name)
        ? prev.skills.filter((s) => s !== name)
        : [...prev.skills, name],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        budget: parseFloat(form.budget),
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        deadline: form.deadline || null,
      };
      const project = await createProject(payload);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section py-12 md:py-16">
      <motion.div
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-brand-ink">Post a Project</h1>
          <p className="text-brand-muted mt-1">Describe your project and find the right freelancer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title & Description */}
          <div className="bg-white border border-gray-100 rounded-lg p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">Project Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Build a React Admin Dashboard"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what you need, your requirements, deliverables, and any relevant details..."
                rows={6}
                className="input-field resize-none"
                required
              />
            </div>
          </div>

          {/* Budget, Deadline, Level */}
          <div className="bg-white border border-gray-100 rounded-lg p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1.5">Budget (&#8377;)</label>
                <input
                  type="number"
                  min="5"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="500"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1.5">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1.5">Experience Level</label>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="input-field"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <label className="block text-sm font-medium text-brand-ink mb-3">Required Skills</label>
            <div className="flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    form.skills.includes(skill.name)
                      ? 'bg-brand-ink text-white'
                      : 'bg-brand-hover text-brand-muted hover:text-brand-ink'
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

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <button type="submit" className="btn-primary w-full text-base" disabled={loading}>
            {loading ? 'Creating...' : 'Post Project'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
