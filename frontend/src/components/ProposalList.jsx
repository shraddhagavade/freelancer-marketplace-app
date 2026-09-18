import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlineClock, HiOutlineCheck, HiOutlineX, HiOutlineStar } from 'react-icons/hi';
import { getProjectProposals, acceptProposal, rejectProposal } from '../services/proposalService';

const STATUS_STYLES = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  SHORTLISTED: 'bg-purple-50 text-purple-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

export default function ProposalList({ projectId, projectStatus, onUpdate }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProposals();
  }, [projectId]);

  async function loadProposals() {
    try {
      const data = await getProjectProposals(projectId);
      setProposals(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(id) {
    setActioningId(id);
    setError('');
    try {
      await acceptProposal(id);
      await loadProposals();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept proposal');
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(id) {
    setActioningId(id);
    setError('');
    try {
      await rejectProposal(id);
      await loadProposals();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject proposal');
    } finally {
      setActioningId(null);
    }
  }

  if (loading) {
    return <p className="text-brand-muted text-sm py-6 text-center">Loading proposals...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-brand-ink">
          Proposals <span className="text-brand-muted font-normal">({proposals.length})</span>
        </h3>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      {proposals.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
          <HiOutlineUser className="w-10 h-10 text-brand-muted mx-auto mb-2" />
          <p className="text-brand-ink font-medium">No proposals yet</p>
          <p className="text-sm text-brand-muted mt-1">Freelancers will appear here when they apply</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-100 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-brand-ink rounded-full flex items-center justify-center text-white font-bold">
                    {p.freelancerName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-ink">{p.freelancerName}</p>
                    <p className="text-xs text-brand-muted">{p.freelancerTitle || 'Freelancer'}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[p.status]}`}>
                  {p.status}
                </span>
              </div>

              <p className="text-sm text-brand-muted leading-relaxed mb-3">{p.coverLetter}</p>

              <div className="flex items-center gap-5 text-sm mb-4">
                <span className="flex items-center gap-1 font-bold text-brand-ink">
                  &#8377;{p.proposedPrice}
                </span>
                <span className="flex items-center gap-1 text-brand-muted">
                  <HiOutlineClock className="w-4 h-4" /> {p.estimatedDays} days
                </span>
                {p.freelancerRating && (
                  <span className="flex items-center gap-1 text-brand-muted">
                    <HiOutlineStar className="w-4 h-4" /> {p.freelancerRating.toFixed(1)}
                  </span>
                )}
              </div>

              {/* Action buttons - only for SUBMITTED proposals on OPEN projects */}
              {p.status === 'SUBMITTED' && projectStatus === 'OPEN' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(p.id)}
                    disabled={actioningId === p.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-ink text-white rounded-lg text-sm font-semibold hover:bg-grey-8 transition-colors disabled:opacity-50"
                  >
                    <HiOutlineCheck className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    disabled={actioningId === p.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border-2 border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <HiOutlineX className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}

              {p.status === 'ACCEPTED' && (
                <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg font-medium">
                  You accepted this proposal. The project is now in progress.
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
