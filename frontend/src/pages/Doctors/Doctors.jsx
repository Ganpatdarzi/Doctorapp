import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getDoctors, getSpecializations } from '../../api/doctors'
import SearchBar from '../../components/SearchBar/SearchBar'
import SpecializationFilter from '../../components/SpecializationFilter/SpecializationFilter'
import DoctorCard from '../../components/DoctorCard/DoctorCard'
import EmptyState from '../../components/EmptyState/EmptyState'
import Error from '../../components/Error/Error'
import './Doctors.css'

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'experience', label: 'Experience (High to Low)' },
  { value: 'fees', label: 'Fee (Low to High)' },
  { value: 'fees-desc', label: 'Fee (High to Low)' },
  { value: 'rating', label: 'Rating (High to Low)' },
]

const Doctors = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get('search') || ''
  const selectedSpec = searchParams.get('specialization') || ''
  const maxFee = searchParams.get('fee') || ''
  const minExperience = searchParams.get('experience') || ''
  const sortBy = searchParams.get('sort') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [doctors, setDoctors] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const updateParams = (updates) => {
    const params = Object.fromEntries(searchParams)
    const merged = { ...params, ...updates }
    Object.keys(merged).forEach((k) => {
      if (!merged[k]) delete merged[k]
    })
    setSearchParams(merged)
  }

  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getDoctors({
        search: searchTerm,
        specialization: selectedSpec,
        fee: maxFee,
        experience: minExperience,
        sort: sortBy,
        page,
        limit: 9,
      })
      setDoctors(res.doctors)
      setPagination(res.pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors. Please try again.')
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedSpec, maxFee, minExperience, sortBy, page])

  useEffect(() => {
    getSpecializations()
      .then((res) => setSpecializations(res))
      .catch(() => setSpecializations([]))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors()
    }, searchTerm ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchDoctors, searchTerm])

  const activeFilters = []
  if (searchTerm) activeFilters.push({ key: 'search', label: `Search: "${searchTerm}"` })
  if (selectedSpec) activeFilters.push({ key: 'specialization', label: selectedSpec })
  if (maxFee) activeFilters.push({ key: 'fee', label: `Max fee Rs. ${maxFee}` })
  if (minExperience) activeFilters.push({ key: 'experience', label: `${minExperience}+ yrs exp` })
  if (sortBy) activeFilters.push({ key: 'sort', label: SORT_OPTIONS.find((o) => o.value === sortBy)?.label || sortBy })
  const hasActiveFilters = activeFilters.length > 0

  const clearFilter = (key) => {
    updateParams({ [key]: '', page: 1 })
  }

  const clearAllFilters = () => {
    updateParams({ search: '', specialization: '', fee: '', experience: '', sort: '', page: 1 })
  }

  const handleSearchChange = (val) => {
    updateParams({ search: val, page: 1 })
  }

  const handleSpecChange = (val) => {
    updateParams({ specialization: val, page: 1 })
  }

  const handleFeeChange = (e) => {
    updateParams({ fee: e.target.value, page: 1 })
  }

  const handleExperienceChange = (e) => {
    updateParams({ experience: e.target.value, page: 1 })
  }

  const handleSortChange = (e) => {
    updateParams({ sort: e.target.value, page: 1 })
  }

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderPagination = () => {
    if (pagination.pages <= 1) return null
    const pages = []
    for (let i = 1; i <= pagination.pages; i++) {
      pages.push(i)
    }
    return (
      <div className="pagination">
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => handlePageChange(page - 1)}
        >
          &laquo; Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`page-btn ${p === page ? 'active' : ''}`}
            onClick={() => handlePageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="page-btn"
          disabled={page === pagination.pages}
          onClick={() => handlePageChange(page + 1)}
        >
          Next &raquo;
        </button>
      </div>
    )
  }

  return (
    <div className="doctors-page">
      <section className="doctors-hero">
        <div className="doctors-hero-container">
          <h1>Our Doctors</h1>
          <p>Browse our team of experienced and verified healthcare professionals</p>
        </div>
      </section>

      <section className="doctors-content">
        <div className="doctors-container">
          <div className="doctors-toolbar">
            <SearchBar
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search doctors by name..."
            />
          </div>

          <SpecializationFilter
            specializations={specializations}
            selected={selectedSpec}
            onSelect={handleSpecChange}
          />

          <div className="doctors-filters-row">
            <div className="filter-group">
              <label className="filter-label">Max Fee (Rs)</label>
              <input
                type="number"
                className="filter-input"
                placeholder="e.g. 2000"
                value={maxFee}
                onChange={handleFeeChange}
                min="0"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Min Experience (yrs)</label>
              <select className="filter-select" value={minExperience} onChange={handleExperienceChange}>
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="5">5+</option>
                <option value="10">10+</option>
                <option value="15">15+</option>
                <option value="20">20+</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Sort By</label>
              <select className="filter-select" value={sortBy} onChange={handleSortChange}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="active-filters">
              <span className="active-filters-label">Active filters:</span>
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className="filter-chip"
                  onClick={() => clearFilter(f.key)}
                  title={`Remove ${f.label}`}
                >
                  {f.label} <span className="filter-chip-x">×</span>
                </button>
              ))}
              <button type="button" className="clear-filters" onClick={clearAllFilters}>
                Clear all
              </button>
            </div>
          )}

          <div className="doctors-results-info">
            {!loading && !error && (
              <span>
                Showing {doctors.length} of {pagination.total} doctor{pagination.total !== 1 ? 's' : ''}
                {hasActiveFilters && ` with active filters`}
              </span>
            )}
          </div>

          {loading ? (
            <div className="doctors-loading">
              <div className="loading-spinner"></div>
              <p>Finding doctors...</p>
            </div>
          ) : error ? (
            <Error message={error} onRetry={fetchDoctors} />
          ) : doctors.length > 0 ? (
            <>
              <div className="doctors-grid">
                {doctors.map((doctor) => (
                  <DoctorCard key={doctor._id} doctor={doctor} />
                ))}
              </div>
              {renderPagination()}
            </>
          ) : (
            <EmptyState
              icon="🔍"
              title="No doctors found"
              description="Try adjusting your search or filter to find what you're looking for."
            />
          )}
        </div>
      </section>
    </div>
  )
}

export default Doctors
