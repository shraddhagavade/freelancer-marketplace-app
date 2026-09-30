import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft, HiOutlineBriefcase,
  HiOutlineClock, HiOutlineStar, HiOutlineGlobe, HiOutlineExternalLink,
  HiOutlineMail, HiOutlineX, HiOutlineChatAlt2, HiOutlineCheckCircle,
} from 'react-icons/hi';
import { getFreelancerById, getFreelancerPortfolio } from '../services/profileService';
import { getFreelancerReviews } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import StarRating from '../components/StarRating';

export default function FreelancerDetails() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getFreelancerById(id);
        setProfile(data);
        if (data?.userId) {
          getFreelancerReviews(data.userId).then(setReviews).catch(() => setReviews([]));
          getFreelancerPortfolio(data.userId).then(setPortfolio).catch(() => setPortfolio([]));
        }
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

  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div>
      {/* Animated hero header */}
      <section className="relative overflow-hidden bg-brand-ink text-white">
        {/* Background glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-20 left-1/4 w-96 h-96 rounded-full bg-brand-primary/30 blur-3xl animate-blob" />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 rounded-full bg-brand-primaryLight/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        </div>

        <div className="section relative py-14">
          <Link to="/freelancers" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white mb-8 transition-colors">
            <HiOutlineArrowLeft className="w-4 h-4" /> Back to freelancers
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {/* Rotating glowing avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative shrink-0"
            >
              <div
                className="absolute -inset-2 rounded-full animate-spin-slow"
                style={{ background: 'conic-gradient(from 0deg, #2A609D, #1976D2, #ACCAE8, #2A609D)' }}
              />
              <div className="absolute -inset-4 rounded-full bg-brand-primaryLight/40 blur-2xl animate-glow-pulse" />
              <div className="relative rounded-full ring-4 ring-brand-ink">
                <Avatar src={profile.avatarUrl} name={fullName} size={128} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-center md:text-left flex-1"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow">{fullName}</h1>
              <p className="text-lg text-white/90 mt-1">{profile.title || 'Freelancer'}</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                {profile.averageRating != null && (
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                    <HiOutlineStar className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-sm font-semibold">{profile.averageRating.toFixed(1)}</span>
                    <span className="text-xs text-white/60">({reviews.length})</span>
                  </div>
                )}
                {profile.experienceLevel && (
                  <span className="bg-white/10 rounded-full px-3 py-1 text-sm capitalize">{profile.experienceLevel.toLowerCase()}</span>
                )}
                <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-sm">
                  <HiOutlineCheckCircle className="w-4 h-4 text-green-400" /> {profile.completedProjects || 0} completed
                </span>
                {profile.hourlyRate && (
                  <span className="bg-brand-primary rounded-full px-3 py-1 text-sm font-semibold">&#8377;{profile.hourlyRate}/hr</span>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="section py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview + skills + links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white border border-gray-100 rounded-lg p-8"
            >
              {profile.overview ? (
                <>
                  <h3 className="text-sm font-semibold text-brand-ink uppercase tracking-wider mb-2">Overview</h3>
                  <p className="text-brand-muted leading-relaxed whitespace-pre-line">{profile.overview}</p>
                </>
              ) : (
                <p className="text-brand-muted italic">This freelancer hasn't added an overview yet.</p>
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
            </motion.div>

            {/* Portfolio gallery */}
            {portfolio.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white border border-gray-100 rounded-lg p-8"
              >
                <h3 className="text-lg font-bold text-brand-ink mb-5">Work &amp; Portfolio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {portfolio.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -4 }}
                      className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-menu transition-shadow"
                    >
                      {item.imageUrl ? (
                        <button
                          onClick={() => setLightbox(item.imageUrl)}
                          className="block w-full aspect-video overflow-hidden bg-brand-hover"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </button>
                      ) : (
                        <div className="w-full aspect-video bg-gradient-to-br from-brand-primary/20 to-brand-primaryLight/20 flex items-center justify-center">
                          <HiOutlineBriefcase className="w-10 h-10 text-brand-primary/50" />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-brand-ink">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-brand-muted mt-1 line-clamp-3">{item.description}</p>
                        )}
                        {item.projectUrl && (
                          <a
                            href={item.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-brand-primary hover:underline mt-2"
                          >
                            View project <HiOutlineExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-white border border-gray-100 rounded-lg p-8"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-brand-ink">
                  Reviews {reviews.length > 0 && <span className="text-brand-muted font-normal">({reviews.length})</span>}
                </h3>
                {profile.averageRating != null && (
                  <StarRating value={profile.averageRating} size={18} showValue />
                )}
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-brand-muted py-4 text-center">No reviews yet.</p>
              ) : (
                <div className="space-y-5">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-gray-100 last:border-0 pb-5 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StarRating value={rev.rating} size={16} />
                          <span className="text-sm font-semibold text-brand-ink">{rev.reviewerName}</span>
                        </div>
                        <span className="text-xs text-brand-muted">
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN') : ''}
                        </span>
                      </div>
                      {rev.comment && (
                        <p className="text-sm text-brand-muted leading-relaxed whitespace-pre-line">{rev.comment}</p>
                      )}
                      {rev.projectTitle && (
                        <p className="text-xs text-brand-muted mt-1">Project: {rev.projectTitle}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white border border-gray-100 rounded-lg p-6 space-y-4 lg:sticky lg:top-24">
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
                    <span className="font-medium text-brand-ink capitalize">{profile.experienceLevel.toLowerCase()}</span>
                  </div>
                )}
                {profile.availability && (
                  <div className="flex items-center justify-between">
                    <span className="text-brand-muted flex items-center gap-1"><HiOutlineClock className="w-4 h-4" /> Availability</span>
                    <span className="font-medium text-brand-ink capitalize">{profile.availability.replace('_', ' ').toLowerCase()}</span>
                  </div>
                )}
                {profile.yearsOfExperience != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-brand-muted">Experience</span>
                    <span className="font-medium text-brand-ink">{profile.yearsOfExperience} years</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-brand-muted">Completed Projects</span>
                  <span className="font-medium text-brand-ink">{profile.completedProjects || 0}</span>
                </div>
              </div>

              <button
                onClick={() => setShowContact(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <HiOutlineMail className="w-4 h-4" /> Contact Freelancer
              </button>

              {isAuthenticated && user?.userId !== profile.userId && (
                <Link to={`/messages?with=${profile.userId}`}>
                  <button className="btn-secondary w-full flex items-center justify-center gap-2">
                    <HiOutlineChatAlt2 className="w-4 h-4" /> Message
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setLightbox(null)}>
            <HiOutlineX className="w-8 h-8" />
          </button>
          <img src={lightbox} alt="Portfolio work" className="max-w-full max-h-[90vh] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

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
