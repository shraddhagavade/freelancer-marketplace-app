import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineBriefcase, HiOutlineDocumentText, HiOutlineCheckCircle,
  HiOutlineClock, HiOutlineArrowRight, HiOutlineUser, HiOutlineSearch,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { getMyProposals, withdrawProposal } from '../../services/proposalService';
import { getFreelancerProfile } from '../../services/profileService';

const STATUS_STYLES = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  SHORTLISTED: 'bg-purple-50 text-purple-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);

  async function loadData() {
    try {
      const [props, prof] = await Promise.all([
        getMyProposals(),
        getFreelancerProfile(),
      ]);
      setProposals(props);
      setProfile(prof);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleWithdraw(proposalId) {
    if (!window.confirm('Withdraw this proposal? This cannot be undone.')) return;
    setWithdrawingId(proposalId);
    try {
      await withdrawProposal(proposalId);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw proposal');
    } finally {
      setWithdrawingId(null);
    }
  }

  const stats = {
    total: proposals.length,
    accepted: proposals.filter((p) => p.status === 'ACCEPTED').length,
    pending: proposals.filter((p) => p.status === 'SUBMITTED').length,
    rejected: proposals.filter((p) => p.status === 'REJECTED').length,
  };

  return (
    <div className="section py-10">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <p className="text-brand-muted">Welcome back,</p>
        <h1 className="text-3xl font-bold text-brand-ink">{user?.firstName} {user?.lastName}</h1>
        <span className="inline-block mt-2 tag text-xs">Freelancer</span>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={<HiOutlineDocumentText />} label="Total Proposals" value={stats.total} />
        <StatCard icon={<HiOutlineClock />} label="Pending" value={stats.pending} color="text-blue-600" />
        <StatCard icon={<HiOutlineCheckCircle />} label="Accepted" value={stats.accepted} color="text-green-600" />
        <StatCard icon={<HiOutlineBriefcase />} label="Active Projects" value={stats.accepted} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Proposals */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-brand-ink">My Proposals</h2>
              <Link to="/projects" className="text-sm text-brand-primary font-medium flex items-center gap-1">
                Find Work <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <p className="text-brand-muted text-sm py-8 text-center">Loading...</p>
            ) : proposals.length === 0 ? (
              <div className="text-center py-10">
                <HiOutlineSearch className="w-10 h-10 text-brand-muted mx-auto mb-3" />
                <p className="text-brand-ink font-medium">No proposals yet</p>
                <p className="text-sm text-brand-muted mt-1">Browse projects and submit your first proposal</p>
                <Link to="/projects">
                  <button className="btn-primary mt-4 !py-2.5 !px-6 text-sm">Browse Projects</button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((p) => (
                  <div key={p.id} className="border border-gray-100 rounded-xl p-4 hover:border-brand-ink transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/projects/${p.projectId}`} className="flex-1 group">
                        <h3 className="font-semibold text-brand-ink group-hover:text-brand-primary transition-colors">{p.projectTitle}</h3>
                        <p className="text-sm text-brand-muted mt-1 line-clamp-1">{p.coverLetter}</p>
                      </Link>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[p.status]}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-sm text-brand-muted">
                        <span className="font-bold text-brand-ink">&#8377;{p.proposedPrice}</span>
                        <span>{p.estimatedDays} days</span>
                      </div>
                      {p.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleWithdraw(p.id)}
                          disabled={withdrawingId === p.id}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {withdrawingId === p.id ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      )}
                      {p.status === 'REJECTED' && (
                        <span className="text-xs text-red-500">Rejected by client</span>
                      )}
                      {p.status === 'ACCEPTED' && (
                        <span className="text-xs text-green-600 font-medium">Won this project</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile card */}
        <div>
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-hover rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-brand-ink">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <h3 className="font-bold text-brand-ink">{user?.firstName} {user?.lastName}</h3>
              <p className="text-sm text-brand-muted">{profile?.title || 'Add your title'}</p>
              {profile?.hourlyRate && (
                <p className="text-lg font-bold text-brand-ink mt-2">&#8377;{profile.hourlyRate}/hr</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-muted">Skills</span>
                <span className="font-medium">{profile?.skills?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Availability</span>
                <span className="font-medium">{profile?.availability?.replace('_', ' ').toLowerCase() || '-'}</span>
              </div>
            </div>

            <Link to="/dashboard/profile">
              <button className="btn-secondary w-full mt-5 !py-2.5 text-sm flex items-center justify-center gap-2">
                <HiOutlineUser className="w-4 h-4" /> Edit Profile
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = 'text-brand-ink' }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-5">
      <div className={`text-2xl mb-2 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold text-brand-ink">{value}</p>
      <p className="text-sm text-brand-muted">{label}</p>
    </div>
  );
}
