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
import { getPaymentSummary } from '../../services/paymentService';

const STATUS_STYLES = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  SHORTLISTED: 'bg-purple-50 text-purple-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

// Each tab has a predicate over a proposal
const PROPOSAL_TABS = [
  { key: 'ALL', label: 'All', match: () => true },
  { key: 'PENDING', label: 'Pending', match: (p) => p.status === 'SUBMITTED' },
  { key: 'ACTIVE', label: 'Active', match: (p) => p.status === 'ACCEPTED' && p.projectStatus === 'IN_PROGRESS' },
  { key: 'COMPLETED', label: 'Completed', match: (p) => p.status === 'ACCEPTED' && p.projectStatus === 'COMPLETED' },
  { key: 'REJECTED', label: 'Rejected', match: (p) => p.status === 'REJECTED' },
];

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  async function loadData() {
    try {
      const [props, prof, sum] = await Promise.all([
        getMyProposals(),
        getFreelancerProfile(),
        getPaymentSummary().catch(() => null),
      ]);
      setProposals(props);
      setProfile(prof);
      setSummary(sum);
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
    pending: proposals.filter((p) => p.status === 'SUBMITTED').length,
    // Accepted and the project is still being worked on
    active: proposals.filter((p) => p.status === 'ACCEPTED' && p.projectStatus === 'IN_PROGRESS').length,
    // Accepted and the client marked the project completed
    completed: proposals.filter((p) => p.status === 'ACCEPTED' && p.projectStatus === 'COMPLETED').length,
  };

  const currentTab = PROPOSAL_TABS.find((t) => t.key === activeTab) || PROPOSAL_TABS[0];
  const tabCount = (tab) => proposals.filter(tab.match).length;
  const filteredProposals = proposals.filter(currentTab.match);

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
        <StatCard icon={<HiOutlineBriefcase />} label="Active Projects" value={stats.active} color="text-green-600" />
        <StatCard icon={<HiOutlineCheckCircle />} label="Completed" value={stats.completed} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Proposals */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-ink">My Proposals</h2>
              <Link to="/projects" className="text-sm text-brand-primary font-medium flex items-center gap-1">
                Find Work <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-5 border-b border-gray-100 pb-3">
              {PROPOSAL_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                    activeTab === tab.key
                      ? 'bg-brand-ink text-white'
                      : 'text-brand-muted hover:bg-brand-hover'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 ${activeTab === tab.key ? 'text-white/80' : 'text-brand-muted'}`}>
                    {tabCount(tab)}
                  </span>
                </button>
              ))}
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
            ) : filteredProposals.length === 0 ? (
              <p className="text-brand-muted text-sm py-10 text-center">No proposals in this category.</p>
            ) : (
              <div className="space-y-3">
                {filteredProposals.map((p) => (
                  <div key={p.id} className="border border-gray-100 rounded-xl p-4 hover:border-brand-ink transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/projects/${p.projectId}`} className="flex-1 group">
                        <h3 className="font-semibold text-brand-ink group-hover:text-brand-primary transition-colors">{p.projectTitle}</h3>
                        <p className="text-sm text-brand-muted mt-1 line-clamp-1">{p.coverLetter}</p>
                      </Link>
                      {p.status === 'ACCEPTED' && p.projectStatus === 'COMPLETED' ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap bg-purple-50 text-purple-700">
                          COMPLETED
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[p.status]}`}>
                          {p.status}
                        </span>
                      )}
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
                      {p.status === 'ACCEPTED' && p.projectStatus === 'IN_PROGRESS' && (
                        <span className="text-xs text-green-600 font-medium">In progress &mdash; you won this project</span>
                      )}
                      {p.status === 'ACCEPTED' && p.projectStatus === 'COMPLETED' && (
                        <span className="text-xs text-purple-700 font-medium">Completed &amp; paid out</span>
                      )}
                      {p.status === 'ACCEPTED' && p.projectStatus === 'CANCELLED' && (
                        <span className="text-xs text-brand-muted font-medium">Project cancelled</span>
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

          {/* Earnings / escrow card */}
          {summary && (
            <div className="bg-white border border-gray-100 rounded-lg p-6 mt-6">
              <h3 className="font-bold text-brand-ink mb-4">Earnings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Pending in escrow</span>
                  <span className="font-bold text-status-warning">&#8377;{Number(summary.pendingAsFreelancer || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Total earned</span>
                  <span className="font-bold text-status-success">&#8377;{Number(summary.earnedAsFreelancer || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="text-xs text-brand-muted mt-4 leading-relaxed">
                When a client accepts your proposal, the amount is held in escrow and paid out once they mark the project completed.
              </p>
            </div>
          )}
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
