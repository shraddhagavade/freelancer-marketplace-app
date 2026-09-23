import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowRight,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineCash,
  HiOutlineStar,
  HiOutlineCheckCircle,
  HiOutlineBriefcase,
} from 'react-icons/hi';

// Brands for the "trusted by" marquee (rendered as text logos, no external images)
const trustedBy = ['TechCorp', 'Nimbus', 'Stackly', 'PixelWorks', 'DataForge', 'Loopware', 'Vertex', 'Brightlab'];

const categories = [
  { name: 'Web Development', count: '2,400+ projects', icon: '💻' },
  { name: 'Mobile Apps', count: '1,200+ projects', icon: '📱' },
  { name: 'UI/UX Design', count: '890+ projects', icon: '🎨' },
  { name: 'Data Science', count: '650+ projects', icon: '📊' },
  { name: 'DevOps & Cloud', count: '430+ projects', icon: '☁️' },
  { name: 'AI & Machine Learning', count: '380+ projects', icon: '🤖' },
];

const features = [
  {
    icon: <HiOutlineLightningBolt className="w-7 h-7" />,
    title: 'Fast Matching',
    description: 'Get matched with the right freelancer within hours, not days.',
  },
  {
    icon: <HiOutlineShieldCheck className="w-7 h-7" />,
    title: 'Secure Payments',
    description: 'Milestone-based payments with escrow protection via PayPal.',
  },
  {
    icon: <HiOutlineCash className="w-7 h-7" />,
    title: 'Fair Commission',
    description: 'Competitive platform fees. Freelancers keep more of what they earn.',
  },
];

export default function Home() {
  return (
    <>
      {/* Hero Section - copy left, animated visual right */}
      <section className="relative overflow-hidden">
        {/* Soft animated gradient orbs in the background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-brand-primary/10 blur-3xl animate-blob" />
          <div className="absolute top-40 right-0 w-[24rem] h-[24rem] rounded-full bg-brand-primaryLight/10 blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
          <div className="absolute -bottom-24 left-1/3 w-[22rem] h-[22rem] rounded-full bg-brand-accentBorder/20 blur-3xl animate-blob" style={{ animationDelay: '6s' }} />
        </div>

        <div className="section relative pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <motion.span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-hover border border-brand-accentBorder text-brand-primary text-xs font-semibold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <HiOutlineLightningBolt className="w-4 h-4" />
                Trusted by 12,000+ freelancers worldwide
              </motion.span>

              <motion.h1
                className="mt-5 text-5xl md:text-hero font-bold tracking-tight text-brand-ink leading-[1.05]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Find the perfect
                <br />
                <span className="text-brand-primary">freelance</span> talent.
              </motion.h1>

              <motion.p
                className="mt-6 text-lg md:text-xl text-brand-muted max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                Work with skilled professionals from around the world.
                Post your project, receive proposals, and get it done.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link to="/register">
                  <button className="btn-primary text-base">
                    Get Started &mdash; It's Free
                    <HiOutlineArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </Link>
                <Link to="/projects">
                  <button className="btn-secondary text-base">
                    Browse Projects
                  </button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                className="mt-14 flex flex-wrap gap-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
              >
                <div>
                  <p className="text-3xl font-bold text-brand-ink">12K+</p>
                  <p className="text-sm text-brand-muted mt-1">Freelancers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-brand-ink">8.5K+</p>
                  <p className="text-sm text-brand-muted mt-1">Projects Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-brand-ink">&#8377;35Cr+</p>
                  <p className="text-sm text-brand-muted mt-1">Paid to Freelancers</p>
                </div>
              </motion.div>
            </div>

            {/* Right: animated floating card visual */}
            <motion.div
              className="relative h-[26rem] hidden lg:block"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {/* Big featured freelancer card */}
              <div className="absolute top-6 left-6 w-72 card bg-white shadow-menu p-5 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-primaryLight flex items-center justify-center text-white font-bold text-lg">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-brand-ink leading-tight">Aarav Sharma</p>
                    <p className="text-xs text-brand-muted">Senior Full-Stack Developer</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="tag">React</span>
                  <span className="tag">Spring Boot</span>
                  <span className="tag">AWS</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-status-warning">
                    <HiOutlineStar className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold text-brand-ink">4.9</span>
                    <span className="text-xs text-brand-muted">(128)</span>
                  </div>
                  <span className="text-sm font-bold text-brand-ink">&#8377;3,000/hr</span>
                </div>
              </div>

              {/* Proposal accepted notification */}
              <div className="absolute top-0 right-2 w-60 card bg-white shadow-menu p-4 animate-float-slow" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-status-success">
                    <HiOutlineCheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-ink leading-tight">Proposal accepted</p>
                    <p className="text-xs text-brand-muted">E-commerce Redesign</p>
                  </div>
                </div>
              </div>

              {/* Active project card */}
              <div className="absolute bottom-4 right-8 w-64 card bg-white shadow-menu p-5 animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-2 text-brand-primary">
                  <HiOutlineBriefcase className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">New project</span>
                </div>
                <p className="mt-2 font-semibold text-brand-ink leading-snug">Build a mobile app for food delivery</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="status-pill status-open">Open</span>
                  <span className="text-sm font-bold text-brand-ink">&#8377;1.2L</span>
                </div>
              </div>

              {/* Small stat bubble */}
              <div className="absolute bottom-24 left-0 card bg-brand-ink text-white shadow-menu px-5 py-4 animate-float-slow" style={{ animationDelay: '0.5s' }}>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-gray-300">Success rate</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted-by marquee */}
      <section className="border-y border-brand-divider bg-white py-6 overflow-hidden">
        <p className="section text-center text-xs font-semibold uppercase tracking-widest text-brand-muted mb-5">
          Teams that hire on FreelancerHub
        </p>
        <div className="relative flex overflow-hidden">
          <div className="flex shrink-0 items-center gap-16 pr-16 animate-marquee whitespace-nowrap">
            {[...trustedBy, ...trustedBy].map((brand, i) => (
              <span key={i} className="text-xl font-bold text-grey-4 hover:text-brand-primary transition-colors">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Categories - Nike card grid style */}
      <section className="bg-brand-hover py-20">
        <div className="section">
          <h2 className="text-hero text-brand-ink mb-2">Popular Categories</h2>
          <p className="text-brand-muted mb-10">Explore projects across top skills</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <motion.div
                key={cat.name}
                className="card bg-white p-6 flex items-center gap-4 cursor-pointer group"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-3xl">{cat.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-brand-ink group-hover:text-brand-primary transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-brand-muted">{cat.count}</p>
                </div>
                <HiOutlineArrowRight className="w-5 h-5 text-brand-muted group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section py-20">
        <div className="text-center mb-14">
          <h2 className="text-hero text-brand-ink">Why FreelancerHub</h2>
          <p className="text-brand-muted mt-2 text-lg">Built for modern teams and freelancers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              className="text-center p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-hover rounded-full mb-5 text-brand-ink">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-brand-ink mb-2">{feature.title}</h3>
              <p className="text-brand-muted text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-brand-ink">
        <div className="section py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start your next project?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands of clients and freelancers already on the platform.
          </p>
          <Link to="/register">
            <button className="btn-primary text-base">
              Create Free Account
              <HiOutlineArrowRight className="ml-2 w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>
    </>
  );
}
