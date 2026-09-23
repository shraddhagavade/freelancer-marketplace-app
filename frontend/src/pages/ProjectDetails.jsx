import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineCalendar, HiOutlineTag,
  HiOutlineBriefcase, HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { getProject, updateProjectStatus } from '../services/projectService';
import { getMyProposals } from '../services/proposalService';
import { getProjectPayment } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import ProposalModal from '../components/ProposalModal';
import ProposalList from '../components/ProposalList';

const PROPOSAL_STATUS_STYLES = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-600',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
};

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [myProposal, setMyProposal] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [payment, setPayment] = useState(null);

  const isClient = user?.role === 'CLIENT';
  const isFreelancer = user?.role === 'FREELANCER';

  useEffect(() => {
    loadProject();
  }, [id]);

  useEffect(() => {
    // If a freelancer, check whether they already applied
    if (isFreelancer) {
      getMyProposals()
        .then((props) => {
          const existing = props.find((p) => String(p.projectId) === String(id));
          setMyProposal(existing || null);
        })
        .catch(() => {});
    }
  }, [id, isFreelancer]);

  async function loadProject() {
    try {
      const data = await getProject(id);
      setProject(data);
      // Escrow status (null if none yet); ignore errors so the page still renders
      getProjectPayment(id).then(setPayment).catch(() => setPayment(null));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleProposalSuccess() {
    // Refresh both project and my proposal state
    loadProject();
    getMyProposals()
      .then((props) => {
        const existing = props.find((p) => String(p.projectId) === String(id));
        setMyProposal(existing || null);
      })
      .catch(() => {});
  }

  async function handleStatusChange(newStatus) {
    const label = newStatus === 'CANCELLED' ? 'cancel' : 'mark complete';
    if (!window.confirm(`Are you sure you want to ${label} this project?`)) return;
    setStatusUpdating(true);
    try {
      await updateProjectStatus(id, newStatus);
      await loadProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update project status');
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) {
    return <div className="section py-20 text-center text-brand-muted">Loading...</div>;
  }

  if (!project) {
    return (
      <div className="section py-20 text-center">
        <h2 className="text-2xl font-bold text-brand-ink">Project not found</h2>
        <Link to="/projects" className="text-brand-primary mt-4 inline-block">Back to projects</Link>
      </div>
    );
  }

  // Determine ownership using clientId (backend sends clientId + clientName)
  const ownerView = isClient && project.clientId === user?.userId;

  return (
    <div className="section py-12">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-ink mb-6 transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to projects
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-lg p-8">
            <div className="flex items-center gap-2 mb-4">
              {project.categoryName && (
                <span className="tag text-xs">
                  <HiOutlineTag className="w-3 h-3 mr-1" />
                  {project.categoryName}
                </span>
              )}
              <span className={`tag text-xs ${project.status === 'OPEN' ? '!bg-green-50 !text-green-700' : project.status === 'IN_PROGRESS' ? '!bg-blue-50 !text-blue-700' : '!bg-gray-100'}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-brand-ink mb-4">
              {project.title}
            </h1>

            <p className="text-brand-muted leading-relaxed whitespace-pre-line">
              {project.description}
            </p>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-brand-ink uppercase tracking-wider mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {[...(project.skills || [])].map((skill) => (
                  <span key={skill} className="tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          {/* CLIENT (owner): proposal management */}
          {ownerView && (
            <div className="bg-white border border-gray-100 rounded-lg p-8">
              <ProposalList
                projectId={project.id}
                projectStatus={project.status}
                onUpdate={loadProject}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Budget card */}
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="text-center mb-4">
              <p className="text-sm text-brand-muted">Budget</p>
              <p className="text-3xl font-bold text-brand-ink flex items-center justify-center gap-0.5">
                <span>&#8377;</span>
                {project.budget}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              {project.deadline && (
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted flex items-center gap-1"><HiOutlineCalendar className="w-4 h-4" /> Deadline</span>
                  <span className="font-medium text-brand-ink">{project.deadline}</span>
                </div>
              )}
              {project.experienceLevel && (
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted flex items-center gap-1"><HiOutlineBriefcase className="w-4 h-4" /> Level</span>
                  <span className="font-medium text-brand-ink">{project.experienceLevel}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">Proposals</span>
                <span className="font-medium text-brand-ink">{project.proposalCount || 0}</span>
              </div>
            </div>

            {/* Action area - depends on role and state */}
            <div className="mt-6">
              {!isAuthenticated && (
                <button onClick={() => navigate('/login')} className="btn-primary w-full">
                  Sign in to Apply
                </button>
              )}

              {isFreelancer && !myProposal && project.status === 'OPEN' && (
                <button onClick={() => setModalOpen(true)} className="btn-primary w-full">
                  Submit Proposal
                </button>
              )}

              {isFreelancer && !myProposal && project.status !== 'OPEN' && (
                <div className="text-center text-sm text-brand-muted bg-brand-hover rounded-lg py-3">
                  This project is no longer accepting proposals
                </div>
              )}

              {isFreelancer && myProposal && (
                <div className={`text-center text-sm font-medium rounded-lg py-3 px-3 ${PROPOSAL_STATUS_STYLES[myProposal.status]}`}>
                  {myProposal.status === 'SUBMITTED' && (
                    <><HiOutlineClock className="inline w-4 h-4 mr-1" /> Proposal submitted &mdash; awaiting client review</>
                  )}
                  {myProposal.status === 'ACCEPTED' && (
                    <><HiOutlineCheckCircle className="inline w-4 h-4 mr-1" /> Your proposal was accepted!</>
                  )}
                  {myProposal.status === 'REJECTED' && (
                    <>Your proposal was rejected by the client</>
                  )}
                  {myProposal.status === 'WITHDRAWN' && (
                    <>You withdrew this proposal</>
                  )}
                </div>
              )}

              {ownerView && (
                <div className="space-y-2">
                  <div className="text-center text-sm text-brand-muted bg-brand-hover rounded-lg py-2">
                    This is your project
                  </div>
                  {project.status === 'IN_PROGRESS' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange('COMPLETED')}
                        disabled={statusUpdating}
                        className="flex-1 py-2.5 bg-brand-ink text-white rounded-lg text-sm font-semibold hover:bg-grey-8 transition-colors disabled:opacity-50"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}
                  {(project.status === 'OPEN' || project.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => handleStatusChange('CANCELLED')}
                      disabled={statusUpdating}
                      className="w-full py-2.5 border-2 border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Cancel Project
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Escrow status */}
          {payment && (
            <div className="bg-white border border-gray-100 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">Escrow</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand-muted">Amount</span>
                <span className="font-bold text-brand-ink">&#8377;{Number(payment.amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="mt-3">
                {payment.status === 'HELD' && (
                  <div className="flex items-center gap-2 text-sm font-medium text-status-warning bg-amber-50 rounded-lg py-2.5 px-3">
                    <HiOutlineClock className="w-4 h-4" /> Funds held in escrow
                  </div>
                )}
                {payment.status === 'RELEASED' && (
                  <div className="flex items-center gap-2 text-sm font-medium text-status-success bg-green-50 rounded-lg py-2.5 px-3">
                    <HiOutlineCheckCircle className="w-4 h-4" /> Released to freelancer
                  </div>
                )}
                {payment.status === 'REFUNDED' && (
                  <div className="text-sm font-medium text-brand-muted bg-brand-hover rounded-lg py-2.5 px-3">
                    Refunded to client
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client info */}
          <Link
            to={`/clients/${project.clientId}`}
            className="block bg-white border border-gray-100 rounded-lg p-6 hover:border-brand-ink transition-colors group"
          >
            <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">About the Client</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-ink rounded-full flex items-center justify-center text-white font-bold text-sm">
                {project.clientName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-brand-ink group-hover:text-brand-primary transition-colors">{project.clientName}</p>
                <p className="text-xs text-brand-muted">Client</p>
              </div>
              <HiOutlineArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-brand-primary mt-3 font-medium">View profile &amp; projects</p>
          </Link>
        </div>
      </motion.div>

      {/* Proposal Modal */}
      <ProposalModal
        project={project}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleProposalSuccess}
      />
    </div>
  );
}
