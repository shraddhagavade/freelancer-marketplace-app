import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX, HiOutlineClock } from 'react-icons/hi';
import { submitProposal } from '../services/proposalService';

export default function ProposalModal({ project, isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    coverLetter: '',
    proposedPrice: '',
    estimatedDays: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await submitProposal(project.id, {
        coverLetter: form.coverLetter,
        proposedPrice: parseFloat(form.proposedPrice),
        estimatedDays: parseInt(form.estimatedDays),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-brand-ink">Submit a Proposal</h2>
                <p className="text-sm text-brand-muted mt-0.5 line-clamp-1">{project.title}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-brand-hover rounded-full transition-colors">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1.5">
                    Your Bid (&#8377;)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted font-semibold">&#8377;</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={form.proposedPrice}
                      onChange={(e) => setForm({ ...form, proposedPrice: e.target.value })}
                      placeholder={project.budget}
                      className="input-field pl-9"
                      required
                    />
                  </div>
                  <p className="text-xs text-brand-muted mt-1">Client's budget: &#8377;{project.budget}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1.5">
                    Delivery (days)
                  </label>
                  <div className="relative">
                    <HiOutlineClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                    <input
                      type="number"
                      min="1"
                      value={form.estimatedDays}
                      onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                      placeholder="14"
                      className="input-field pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1.5">
                  Cover Letter
                </label>
                <textarea
                  value={form.coverLetter}
                  onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
                  placeholder="Introduce yourself, explain why you're a great fit, and describe your approach..."
                  rows={6}
                  className="input-field resize-none"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="btn-secondary flex-1 !py-3">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 !py-3" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
