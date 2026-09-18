import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft, HiOutlineBriefcase,
  HiOutlineClock, HiOutlineStar, HiOutlineGlobe, HiOutlineExternalLink,
  HiOutlineMail, HiOutlineX,
} from 'react-icons/hi';
import { getFreelancerById } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function FreelancerDetails() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getFreelancerById(id);
        setProfile(data);
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

  if (!profile) {
    return (
      <div className="section py-20 text-center">
        <h2 className="text-2xl font-bold text-brand-ink">Freelancer not found</h2>
        <Link to="/freelancers" className="text-brand-primary mt-4 inline-block">Back to freelancers</Link>
      </div>
    );
  }

  return (
    <div className="section py-12">
      <Link to="/freelancers" className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-ink mb-6 transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to freelancers
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <Avatar src={profile.avatarUrl} name={`${profile.firstName} ${profile.lastName}`} size={80} />
              <div>
                <h1 className="text-2xl font-bold text-brand-ink">{profile.firstName} {profile.lastName}</h1>
                <p className="text-brand-muted">{profile.title || 'Freelancer'}</p>
              </div>
            </div>

            {profile.overview && (
              <>
                <h3 className="text-sm font-semibold text-brand-ink uppercase tracking-wider mb-2">Overview</h3>
                <p className="text-brand-muted leading-relaxed whitespace-pre-line">{profile.overview}</p>
              </>
            )}

            {profile.skills?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-brand-ink uppercase tracking-wider mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {[...profile.skills].map((skill) => (
                    <span key={skill} className="tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {(profile.portfolioUrl || profile.linkedinUrl || profile.githubUrl) && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-brand-ink uppercase tracking-wider mb-3">Links</h3>
                <div className="flex flex-col gap-2">
                  {profile.portfolioUrl && (
                    <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-primary hover:underline">
                      <HiOutlineGlobe className="w-4 h-4" /> Portfolio <HiOutlineExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-primary hover:underline">
                      LinkedIn <HiOutlineExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-primary hover:underline">
                      GitHub <HiOutlineExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white border border-gray-100 rounded-lg p-6 space-y-4">
            {profile.hourlyRate && (
              <div className="text-center pb-4 border-b border-gray-100">
                <p className="text-sm text-brand-muted">Hourly Rate</p>
                <p className="text-3xl font-bold text-brand-ink flex items-center justify-center gap-0.5">
                  <span>&#8377;</span>{profile.hourlyRate}
                  <span className="text-lg text-brand-muted font-normal">/hr</span>
                </p>
              </div>
            )}

            <div className="space-y-3 text-sm">
              {profile.experienceLevel && (
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted flex items-center gap-1"><HiOutlineBriefcase className="w-4 h-4" /> Level</span>
                  <span className="font-medium text-brand-ink">{profile.experienceLevel.toLowerCase()}</span>
                </div>
              )}
              {profile.availability && (
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted flex items-center gap-1"><HiOutlineClock className="w-4 h-4" /> Availability</span>
                  <span className="font-medium text-brand-ink">{profile.availability.replace('_', ' ').toLowerCase()}</span>
                </div>
              )}
              {profile.yearsOfExperience != null && (
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted">Experience</span>
                  <span className="font-medium text-brand-ink">{profile.yearsOfExperience} years</span>
                </div>
              )}
              {profile.averageRating != null && (
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted flex items-center gap-1"><HiOutlineStar className="w-4 h-4" /> Rating</span>
                  <span className="font-medium text-brand-ink">{profile.averageRating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">Completed Projects</span>
                <span className="font-medium text-brand-ink">{profile.completedProjects || 0}</span>
              </div>
            </div>

            {/* Contact Freelancer */}
            <button
              onClick={() => setShowContact(true)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <HiOutlineMail className="w-4 h-4" /> Contact Freelancer
            </button>
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
              <h2 className="text-xl font-bold text-brand-ink">Contact {profile.firstName}</h2>
              <button onClick={() => setShowContact(false)} className="p-2 hover:bg-brand-hover rounded-full">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-sm text-brand-muted">
                  Reach out to {profile.firstName} directly to discuss your project.
                </p>
                <div className="bg-brand-hover rounded-xl p-4">
                  <p className="text-xs text-brand-muted uppercase tracking-wider mb-1">Email</p>
                  <p className="font-medium text-brand-ink break-all">{profile.email}</p>
                </div>
                <a href={`mailto:${profile.email}?subject=Project opportunity on FreelancerHub`}>
                  <button className="btn-primary w-full flex items-center justify-center gap-2">
                    <HiOutlineMail className="w-4 h-4" /> Send Email
                  </button>
                </a>
                <p className="text-xs text-brand-muted text-center">
                  Tip: Share your project details and timeline to get a quick response.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-brand-muted">Sign in to view contact details and reach out to this freelancer.</p>
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
