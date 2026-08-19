import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosClient from '../axios/axiosClient'
import { PageHeader, LoadingState, EmptyState, ErrorBanner, Pagination, formatDate } from '../components/DoctorUI'
import getImageUrl from '../utils/imageUrl'
import './DoctorCommon.css'

const AdminEMR = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const search = searchParams.get('search') || ''
  const doctorId = searchParams.get('doctorId') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const updateParams = (updates) => {
    const params = Object.fromEntries(searchParams)
    const merged = { ...params, ...updates }
    Object.keys(merged).forEach((k) => {
      if (!merged[k]) delete merged[k]
    })
    setSearchParams(merged)
  }

  const fetchDoctors = async () => {
    try {
      const { data } = await axiosClient.get('/admin/doctors', { params: { limit: 200 } })
      const res = data.data || data
      setDoctors(res.doctors || res || [])
    } catch {
      setDoctors([])
    }
  }

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit }
      if (search) params.search = search
      if (doctorId) params.doctorId = doctorId
      const { data } = await axiosClient.get('/emr/records', { params })
      const res = data.data || data
      setRecords(res.records || [])
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load medical records')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [searchParams])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParams({ search: e.target.search.value, page: 1 })
  }

  return (
    <div>
      <PageHeader title="Medical Records" subtitle={`${pagination.total} record${pagination.total !== 1 ? 's' : ''} found (read-only)`} />

      <div className="d-filters-bar">
        <form className="d-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            name="search"
            placeholder="Search by patient name, email or phone..."
            defaultValue={search}
            className="d-search-input"
          />
          <button type="submit" className="d-btn-search">Search</button>
        </form>
        <div className="d-filter-group">
          <select
            value={doctorId}
            onChange={(e) => updateParams({ doctorId: e.target.value, page: 1 })}
            className="d-select"
          >
            <option value="">All doctors</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>{d.name} — {d.specialization}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="d-table-wrap">
        {loading ? (
          <LoadingState text="Loading medical records..." />
        ) : records.length === 0 ? (
          <EmptyState text="No medical records found" />
        ) : (
          <table className="d-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Visit Date</th>
                <th>Diagnosis</th>
                <th>Medications</th>
                <th>Reports</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const patient = record.userId || {}
                const doctor = record.doctorId || {}
                return (
                  <tr key={record._id}>
                    <td>
                      <div className="d-user-cell">
                        <img
                          src={getImageUrl(patient.image) || 'https://via.placeholder.com/40?text=P'}
                          alt={patient.name}
                          className="d-avatar"
                        />
                        <div>
                          <div className="d-user-name">{patient.name || 'Unknown'}</div>
                          <div className="d-user-sub">{patient.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-user-cell">
                        <img
                          src={getImageUrl(doctor.image) || 'https://via.placeholder.com/40?text=D'}
                          alt={doctor.name}
                          className="d-avatar"
                        />
                        <div>
                          <div className="d-user-name">{doctor.name || 'N/A'}</div>
                          <div className="d-user-sub">{doctor.specialization || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(record.visitDate)}</td>
                    <td style={{ maxWidth: 240 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {record.diagnosis || '—'}
                      </span>
                    </td>
                    <td>{(record.prescriptions || []).length}</td>
                    <td>{(record.reports || []).length}</td>
                    <td>
                      <div className="d-actions">
                        <Link to={`/emr/${record._id}`} className="d-btn d-btn-outline d-btn-sm">View</Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} pages={pagination.pages} onPageChange={(p) => updateParams({ page: p })} />
    </div>
  )
}

export default AdminEMR
