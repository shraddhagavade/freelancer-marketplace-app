import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineArrowRight, HiOutlineLightningBolt, HiOutlineShieldCheck, HiOutlineCash } from 'react-icons/hi';

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
      {/* Hero Section - Nike-style bold typography */}
      <section className="section pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-4xl">
          <motion.h1
            className="text-5xl md:text-hero font-bold tracking-tight text-brand-ink leading-[1.05]"
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
            className="mt-16 flex flex-wrap gap-12"
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
