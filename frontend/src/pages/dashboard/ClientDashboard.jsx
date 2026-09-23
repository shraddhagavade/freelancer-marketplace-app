import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineBriefcase, HiOutlineDocumentAdd, HiOutlineClipboardList,
  HiOutlineCheckCircle, HiOutlineArrowRight, HiOutlineOfficeBuilding, HiOutlinePlus,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { getMyProjects } from '../../services/projectService';
import { getPaymentSummary } from '../../services/paymentService';
import StatusPill from '../../components/ui/StatusPill';

const PROJECT_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    async function load() {
      try {
        const [data, sum] = await Promise.all([
          getMyProjects(),
          getPaymentSummary().catch(() => null),
        ]);
        setProjects(data);
        setSummary(sum);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = {
    total: projects.length,
    open: projects.filter((p) => p.status === 'OPEN').length,
    inProgress: projects.filter((p) => p.status === 'IN_PROGRESS').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
  };

  const tabCount = (key) => (key === 'ALL' ? projects.length : projects.filter((p) => p.status === key).length);
  const filteredProjects = activeTab === 'ALL' ? projects : projects.filter((p) => p.status === activeTab);

  return (
    <div className="section py-10">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <p className="text-brand-muted">Welcome back,</p>
          <h1 className="text-3xl font-bold text-brand-ink">{user?.firstName} {user?.lastName}</h1>
          <span className="inline-block mt-2 tag text-xs">Client</span>
        </div>
        <Link to="/projects/new">
          <button className="btn-primary !py-3 !px-6 text-sm flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> Post a Project
          </button>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={<HiOutlineBriefcase />} label="Total Projects" value={stats.total} />
        <StatCard icon={<HiOutlineClipboardList />} label="Open" value={stats.open} color="text-green-600" />
        <StatCard icon={<HiOutlineDocumentAdd />} label="In Progress" value={stats.inProgress} color="text-blue-600" />
        <StatCard icon={<HiOutlineCheckCircle />} label="Completed" value={stats.completed} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Projects */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-ink">My Projects</h2>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-5 border-b border-gray-100 pb-3">
              {PROJECT_TABS.map((tab) => (
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
                    {tabCount(tab.key)}
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-brand-muted text-sm py-8 text-center">Loading...</p>
            ) : projects.length === 0 ? (
              <div className="text-center py-10">
                <HiOutlineBriefcase className="w-10 h-10 text-brand-muted mx-auto mb-3" />
                <p className="text-brand-ink font-medium">No projects yet</p>
                <p className="text-sm text-brand-muted mt-1">Post your first project to start receiving proposals</p>
                <Link to="/projects/new">
                  <button className="btn-primary mt-4 !py-2.5 !px-6 text-sm">Post a Project</button>
                </Link>
              </div>
            ) : filteredProjects.length === 0 ? (
              <p className="text-brand-muted text-sm py-10 text-center">No projects in this category.</p>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((p) => (
                  <Link key={p.id} to={`/projects/${p.id}`} className="block">
                    <div className="border border-grey-1 rounded-lg p-4 hover:border-brand-primary hover:bg-brand-hover transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-brand-ink">{p.title}</h3>
                          <p className="text-sm text-brand-muted mt-1 line-clamp-1">{p.description}</p>
                        </div>
                        <StatusPill status={p.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-brand-muted">
                        <span className="font-bold text-brand-ink">&#8377;{p.budget}</span>
                        <span>{p.proposalCount || 0} proposals</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Company card */}
        <div>
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-hover rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-brand-ink">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <h3 className="font-bold text-brand-ink">{user?.firstName} {user?.lastName}</h3>
              <p className="text-sm text-brand-muted">Client Account</p>
            </div>

            <Link to="/dashboard/company">
              <button className="btn-secondary w-full mt-5 !py-2.5 text-sm flex items-center justify-center gap-2">
                <HiOutlineOfficeBuilding className="w-4 h-4" /> Company Profile
              </button>
            </Link>
          </div>

          {/* Escrow / payments card */}
          {summary && (
            <div className="bg-white border border-gray-100 rounded-lg p-6 mt-6">
              <h3 className="font-bold text-brand-ink mb-4">Payments</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">In escrow (held)</span>
                  <span className="font-bold text-status-warning">&#8377;{Number(summary.heldAsClient || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-muted">Total released</span>
                  <span className="font-bold text-status-success">&#8377;{Number(summary.spentAsClient || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="text-xs text-brand-muted mt-4 leading-relaxed">
                Funds are held in escrow when you accept a proposal and released to the freelancer when you mark the project completed.
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
