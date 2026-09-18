import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineSearch, HiOutlineStar, HiOutlineBriefcase } from 'react-icons/hi';
import { browseFreelancers } from '../services/profileService';
import Avatar from '../components/Avatar';

const EXPERIENCE_LEVELS = ['ENTRY', 'INTERMEDIATE', 'EXPERT'];
const AVAILABILITY = ['FULL_TIME', 'PART_TIME', 'CONTRACT'];

export default function Freelancers() {
  const [freelancers, setFreelancers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    experienceLevel: '',
    availability: '',
    maxRate: '',
    page: 0,
  });

  useEffect(() => {
    fetchFreelancers();
  }, [filters.page]);

  async function fetchFreelancers() {
    setLoading(true);
    try {
      const data = await browseFreelancers({
        keyword: filters.keyword || undefined,
        experienceLevel: filters.experienceLevel || undefined,
        availability: filters.availability || undefined,
        maxRate: filters.maxRate || undefined,
        page: filters.page,
        size: 12,
      });
      setFreelancers(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setFilters({ ...filters, page: 0 });
    fetchFreelancers();
  }

  return (
    <div className="section py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-hero font-bold text-brand-ink">Find Talent</h1>
        <p className="text-brand-muted mt-2">Browse skilled freelancers for your next project</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-brand-hover rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              placeholder="Search by skill, title, or keyword..."
              className="input-field pl-12"
            />
          </div>
          <select
            value={filters.experienceLevel}
            onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
            className="input-field md:w-44"
          >
            <option value="">Any Level</option>
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <select
            value={filters.availability}
            onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
            className="input-field md:w-44"
          >
            <option value="">Any Availability</option>
            {AVAILABILITY.map((a) => (
              <option key={a} value={a}>{a.replace('_', ' ')}</option>
            ))}
          </select>
          <input
            type="number"
            value={filters.maxRate}
            onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
            placeholder="Max $/hr"
            className="input-field md:w-32"
          />
          <button type="submit" className="btn-primary !rounded-xl !px-6">Search</button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16 text-brand-muted">Loading freelancers...</div>
      ) : freelancers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl font-semibold text-brand-ink">No freelancers found</p>
          <p className="text-brand-muted mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {freelancers.map((f, idx) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link to={`/freelancers/${f.id}`} className="block">
                  <div className="card bg-white border border-gray-100 p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar src={f.avatarUrl} name={`${f.firstName} ${f.lastName}`} size={48} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-brand-ink truncate">{f.firstName} {f.lastName}</h3>
                        <p className="text-sm text-brand-muted truncate">{f.title}</p>
                      </div>
                    </div>

                    {f.overview && (
                      <p className="text-sm text-brand-muted mb-4 line-clamp-2">{f.overview}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {[...(f.skills || [])].slice(0, 4).map((skill) => (
                        <span key={skill} className="text-xs bg-brand-hover text-brand-muted px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                      {f.skills?.length > 4 && (
                        <span className="text-xs text-brand-muted">+{f.skills.length - 4}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
                      {f.hourlyRate ? (
                        <span className="flex items-center gap-1 font-bold text-brand-ink">
                          &#8377;{f.hourlyRate}/hr
                        </span>
                      ) : <span className="text-brand-muted text-xs">Rate not set</span>}
                      {f.experienceLevel && (
                        <span className="flex items-center gap-1 text-brand-muted text-xs">
                          <HiOutlineBriefcase className="w-3.5 h-3.5" />
                          {f.experienceLevel.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters({ ...filters, page: i })}
                  className={`w-10 h-10 rounded-full font-medium text-sm transition-all ${
                    filters.page === i ? 'bg-brand-ink text-white' : 'bg-brand-hover text-brand-muted hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
