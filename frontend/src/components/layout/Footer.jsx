import { Link } from 'react-router-dom';
import { HiOutlineGlobeAlt } from 'react-icons/hi';

export default function Footer() {
  return (
    <footer className="bg-grey-9 text-white">
      <div className="section py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold tracking-tight mb-4 text-white">
              Freelancer<span className="text-brand-accentBorder">Hub</span>
            </h3>
            <p className="text-sm text-grey-3 leading-relaxed">
              Connect with world-class freelancers and bring your projects to life.
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 text-grey-2">
              For Clients
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/projects" className="text-sm text-grey-3 hover:text-white transition-colors">Post a Project</Link></li>
              <li><Link to="/freelancers" className="text-sm text-grey-3 hover:text-white transition-colors">Browse Talent</Link></li>
              <li><Link to="/how-it-works" className="text-sm text-grey-3 hover:text-white transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* For Freelancers */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 text-grey-2">
              For Freelancers
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/projects" className="text-sm text-grey-3 hover:text-white transition-colors">Find Work</Link></li>
              <li><Link to="/register" className="text-sm text-grey-3 hover:text-white transition-colors">Create Profile</Link></li>
              <li><Link to="#" className="text-sm text-grey-3 hover:text-white transition-colors">Resources</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 text-grey-2">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="#" className="text-sm text-grey-3 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="#" className="text-sm text-grey-3 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="#" className="text-sm text-grey-3 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="text-sm text-grey-3 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-grey-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-grey-3">
            <HiOutlineGlobeAlt className="w-4 h-4" />
            <span>India</span>
          </div>
          <p className="text-sm text-grey-4">
            &copy; {new Date().getFullYear()} FreelancerHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
