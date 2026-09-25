import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft, HiOutlineOfficeBuilding, HiOutlineLocationMarker,
  HiOutlineGlobe, HiOutlineMail, HiOutlineBriefcase, HiOutlineExternalLink,
  HiOutlineCalendar, HiOutlineX, HiOutlineChatAlt2,
} from 'react-icons/hi';
import { getPublicClientProfile } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const STATUS_STYLES = {
  OPEN: 'bg-green-50 text-green-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-purple-50 text-purple-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function ClientDetails() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicClientProfile(id);
        setClient(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="section py-20 text-center text-brand-muted">Loading...</div>;
  }

  if (!client) {
    return (
      <div className="section py-20 text-center">
        <h2 className="text-2xl font-bold text-brand-ink">Client not found</h2>
        <Link to="/projects" className="text-brand-primary mt-4 inline-block">Back to projects</Link>
      </div>
    );
  }

  const displayName = client.companyName || `${client.firstName} ${client.lastName}`;
  const openProjects = (client.projects || []).filter((p) => p.status === 'OPEN');

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
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company header */}
          <div className="bg-white border border-gray-100 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <Avatar src={client.avatarUrl} name={displayName} size={80} rounded="rounded-lg" />

              <div>
                <h1 className="text-2xl font-bold text-brand-ink">{displayName}</h1>
                <p className="text-brand-muted">{client.firstName} {client.lastName}</p>
                {client.industry && (
                  <span className="tag text-xs mt-2 inline-flex">{client.industry}</span>
                )}
              </div>
            </div>

            {client.description && (
              <>
                <h3 className="text-sm font-semibold text-brand-ink uppercase tracking-wider mb-2">About</h3>
                <p className="text-brand-muted leading-relaxed whitespace-pre-line">{client.description}</p>
              </>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {client.location && (
                <div className="flex items-center gap-2 text-brand-muted">
                  <HiOutlineLocationMarker className="w-4 h-4" /> {client.location}
                </div>
              )}
              {client.companyWebsite && (
                <a href={client.companyWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-primary hover:underline">
                  <HiOutlineGlobe className="w-4 h-4" /> Website <HiOutlineExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Posted projects */}
          <div className="bg-white border border-gray-100 rounded-lg p-8">
            <h2 className="text-lg font-bold text-brand-ink mb-1">
              Projects by {displayName}
            </h2>
            <p className="text-sm text-brand-muted mb-5">
              {openProjects.length} open &middot; {client.projects?.length || 0} total
            </p>

            {client.projects?.length === 0 ? (
              <p className="text-brand-muted text-sm py-6 text-center">No projects posted yet</p>
            ) : (
              <div className="space-y-3">
                {client.projects.map((p) => (
                  <Link key={p.id} to={`/projects/${p.id}`} className="block">
                    <div className="border border-gray-100 rounded-xl p-4 hover:border-brand-ink transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-brand-ink">{p.title}</h3>
                          <p className="text-sm text-brand-muted mt-1 line-clamp-1">{p.description}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[p.status]}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-brand-muted">
                        <span className="font-bold text-brand-ink">&#8377;{p.budget}</span>
                        {p.categoryName && <span>{p.categoryName}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Client Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-brand-muted flex items-center gap-1"><HiOutlineBriefcase className="w-4 h-4" /> Projects Posted</span>
                <span className="font-medium text-brand-ink">{client.totalProjectsPosted || client.projects?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-muted flex items-center gap-1"><HiOutlineOfficeBuilding className="w-4 h-4" /> Open Projects</span>
                <span className="font-medium text-brand-ink">{openProjects.length}</span>
              </div>
              {client.memberSince && (
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted flex items-center gap-1"><HiOutlineCalendar className="w-4 h-4" /> Member Since</span>
                  <span className="font-medium text-brand-ink">
                    {new Date(client.memberSince).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}
            </div>

            {/* Contact Client */}
            <button
              onClick={() => setShowContact(true)}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              <HiOutlineMail className="w-4 h-4" /> Contact Client
            </button>

            {isAuthenticated && String(user?.userId) !== String(id) && (
              <Link to={`/messages?with=${id}`}>
                <button className="btn-secondary w-full mt-3 flex items-center justify-center gap-2">
                  <HiOutlineChatAlt2 className="w-4 h-4" /> Message
                </button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Contact Modal */}
      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowContact(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-lg w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-brand-ink">Contact {displayName}</h2>
              <button onClick={() => setShowContact(false)} className="p-2 hover:bg-brand-hover rounded-full">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-sm text-brand-muted">
                  Reach out to {client.firstName} directly to discuss your proposal.
                </p>
                <div className="bg-brand-hover rounded-xl p-4">
                  <p className="text-xs text-brand-muted uppercase tracking-wider mb-1">Email</p>
                  <p className="font-medium text-brand-ink break-all">{client.email}</p>
                </div>
                <a href={`mailto:${client.email}?subject=Regarding your project on FreelancerHub`}>
                  <button className="btn-primary w-full flex items-center justify-center gap-2">
                    <HiOutlineMail className="w-4 h-4" /> Send Email
                  </button>
                </a>
                <p className="text-xs text-brand-muted text-center">
                  Tip: The best way to connect is to submit a strong proposal on one of their projects.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-brand-muted">Sign in to view contact details and reach out to this client.</p>
                <Link to="/login">
                  <button className="btn-primary w-full">Sign In</button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
