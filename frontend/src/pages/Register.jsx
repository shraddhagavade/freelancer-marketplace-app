import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'FREELANCER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0];
        setError(firstError);
      } else if (data?.message) {
        setError(data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section py-16 md:py-24">
      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-brand-ink">Create your account</h1>
          <p className="text-brand-muted mt-2">Join the largest freelance marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection */}
          <div className="flex bg-brand-hover rounded-full p-1 mb-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'FREELANCER' })}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                form.role === 'FREELANCER'
                  ? 'bg-brand-ink text-white'
                  : 'text-brand-muted hover:text-brand-ink'
              }`}
            >
              I'm a Freelancer
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'CLIENT' })}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                form.role === 'CLIENT'
                  ? 'bg-brand-ink text-white'
                  : 'text-brand-muted hover:text-brand-ink'
              }`}
            >
              I'm a Client
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">First Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1.5">Email</label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1.5">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className="input-field pl-11"
                minLength={8}
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <p className="text-xs text-brand-muted">
            By creating an account, you agree to our{' '}
            <Link to="#" className="underline">Terms of Service</Link> and{' '}
            <Link to="#" className="underline">Privacy Policy</Link>.
          </p>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-brand-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-ink font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
