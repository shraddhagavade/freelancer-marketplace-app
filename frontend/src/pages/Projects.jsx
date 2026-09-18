import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineSearch, HiOutlineCurrencyDollar, HiOutlineClock, HiOutlineTag, HiOutlineArrowRight } from 'react-icons/hi';
import { searchProjects } from '../services/projectService';
import { getCategories } from '../services/profileService';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    categoryId: '',
    minBudget: '',
    maxBudget: '',
    page: 0,
  });

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [filters.page]);

  async function fetchProjects() {
    setLoading(true);
    try {
      const data = await searchProjects({
        keyword: filters.keyword || undefined,
        categoryId: filters.categoryId || undefined,
        minBudget: filters.minBudget || undefined,
        maxBudget: filters.maxBudget || undefined,
        page: filters.page,
        size: 9,
      });
      setProjects(data.content);
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
    fetchProjects();
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  return (
    <div className="section py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-hero font-bold text-brand-ink">Browse Projects</h1>
        <p className="text-brand-muted mt-2">Find your next opportunity</p>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="bg-brand-hover rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              placeholder="Search by keyword..."
              className="input-field pl-12"
            />
          </div>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            className="input-field md:w-48"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={filters.minBudget}
            onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
            placeholder="Min $"
            className="input-field md:w-28"
          />
          <input
            type="number"
            value={filters.maxBudget}
            onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
            placeholder="Max $"
            className="input-field md:w-28"
          />
          <button type="submit" className="btn-primary !px-6">
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16 text-brand-muted">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl font-semibold text-brand-ink">No projects found</p>
          <p className="text-brand-muted mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link to={`/projects/${project.id}`} className="block">
                  <div className="card bg-white border border-gray-100 p-6 h-full flex flex-col">
                    {/* Category badge */}
                    {project.categoryName && (
                      <span className="tag mb-3 text-xs">
                        <HiOutlineTag className="w-3 h-3 mr-1" />
                        {project.categoryName}
                      </span>
                    )}

                    <h3 className="font-bold text-brand-ink text-lg mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
                      {project.title}
                    </h3>

                    <p className="text-sm text-brand-muted mb-4 line-clamp-3 flex-1">
                      {project.description}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {[...project.skills].slice(0, 4).map((skill) => (
                        <span key={skill} className="text-xs bg-brand-hover text-brand-muted px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                      {project.skills.length > 4 && (
                        <span className="text-xs text-brand-muted">+{project.skills.length - 4}</span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-brand-ink font-bold">
                        &#8377;{project.budget}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-brand-muted">
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        {timeAgo(project.createdAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters({ ...filters, page: i })}
                  className={`w-10 h-10 rounded font-medium text-sm transition-colors ${
                    filters.page === i
                      ? 'bg-brand-primary text-white'
                      : 'bg-white border border-brand-border text-brand-muted hover:bg-brand-hover'
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
