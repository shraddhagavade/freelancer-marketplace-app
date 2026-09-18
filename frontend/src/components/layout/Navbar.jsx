import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineLogout, HiOutlineViewGrid, HiOutlineUser, HiOutlineChevronDown } from 'react-icons/hi';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../Avatar';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  }

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-ink'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-brand-divider">
      <div className="section flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1">
          <span className="text-xl font-bold tracking-tight text-brand-ink">
            Freelancer<span className="text-brand-primary">Hub</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/projects" className={navLinkClass}>
            Find Work
          </NavLink>
          <NavLink to="/freelancers" className={navLinkClass}>
            Find Talent
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
          {user?.role === 'CLIENT' && (
            <NavLink to="/projects/new" className={navLinkClass}>
              Post a Project
            </NavLink>
          )}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-brand-hover rounded text-brand-muted transition-colors">
            <HiOutlineSearch className="w-5 h-5" />
          </button>

          {isAuthenticated ? (
            /* User menu */
            <div className="hidden md:block relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded hover:bg-brand-hover transition-colors"
              >
                <Avatar src={user?.avatarUrl} name={`${user?.firstName || ''} ${user?.lastName || ''}`} size={32} />
                <span className="text-sm font-medium text-brand-ink">{user?.firstName}</span>
                <HiOutlineChevronDown className="w-4 h-4 text-brand-muted" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-grey-1 rounded-lg shadow-menu py-2">
                  <div className="px-4 py-2 border-b border-grey-1">
                    <p className="font-semibold text-brand-ink text-sm">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-brand-muted">{user?.email}</p>
                    <span className="tag-neutral mt-1.5">{user?.role}</span>
                  </div>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-muted hover:bg-brand-hover hover:text-brand-ink transition-colors">
                    <HiOutlineViewGrid className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link
                    to={user?.role === 'CLIENT' ? '/dashboard/company' : '/dashboard/profile'}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-muted hover:bg-brand-hover hover:text-brand-ink transition-colors"
                  >
                    <HiOutlineUser className="w-4 h-4" /> {user?.role === 'CLIENT' ? 'Company Profile' : 'My Profile'}
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-status-error hover:bg-red-50 transition-colors">
                    <HiOutlineLogout className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="hidden md:block">
                <button className="btn-secondary text-sm">
                  Sign In
                </button>
              </Link>
              <Link to="/register" className="hidden md:block">
                <button className="btn-primary text-sm">
                  Join Free
                </button>
              </Link>
            </>
          )}

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <div className="w-5 flex flex-col gap-1">
              <span className={`block h-0.5 bg-brand-ink transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-brand-ink transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-brand-ink transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brand-divider bg-white">
          <div className="section py-4 flex flex-col gap-4">
            <NavLink to="/projects" className="text-sm font-medium py-2 text-brand-ink" onClick={() => setMobileOpen(false)}>
              Find Work
            </NavLink>
            <NavLink to="/freelancers" className="text-sm font-medium py-2 text-brand-ink" onClick={() => setMobileOpen(false)}>
              Find Talent
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className="text-sm font-medium py-2 text-brand-ink" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink
                  to={user?.role === 'CLIENT' ? '/dashboard/company' : '/dashboard/profile'}
                  className="text-sm font-medium py-2 text-brand-ink"
                  onClick={() => setMobileOpen(false)}
                >
                  {user?.role === 'CLIENT' ? 'Company Profile' : 'My Profile'}
                </NavLink>
                {user?.role === 'CLIENT' && (
                  <NavLink to="/projects/new" className="text-sm font-medium py-2 text-brand-ink" onClick={() => setMobileOpen(false)}>
                    Post a Project
                  </NavLink>
                )}
                <button onClick={handleLogout} className="text-sm font-medium py-2 text-status-error text-left">
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1">
                  <button className="btn-secondary w-full text-sm">Sign In</button>
                </Link>
                <Link to="/register" className="flex-1">
                  <button className="btn-primary w-full text-sm">Join Free</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
