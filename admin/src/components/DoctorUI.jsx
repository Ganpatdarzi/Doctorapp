export const StatusBadge = ({ status }) => {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
  return <span className={`d-status-badge d-status-${status}`}>{label}</span>
}

export const StatCard = ({ icon, label, value, color = 'blue' }) => (
  <div className={`d-stat-card d-stat-${color}`}>
    <div className="d-stat-icon">{icon}</div>
    <div className="d-stat-body">
      <span className="d-stat-value">{value}</span>
      <span className="d-stat-label">{label}</span>
    </div>
  </div>
)

export const LoadingState = ({ text = 'Loading...' }) => (
  <div className="d-loading">
    <span className="d-spinner" />
    <span>{text}</span>
  </div>
)

export const EmptyState = ({ text = 'No data found' }) => (
  <div className="d-empty">{text}</div>
)

export const ErrorBanner = ({ message }) => (
  <div className="d-error-banner">{message}</div>
)

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="d-page-header">
    <div>
      <h1 className="d-page-title">{title}</h1>
      {subtitle && <p className="d-page-subtitle">{subtitle}</p>}
    </div>
    {children}
  </div>
)

export const Section = ({ title, subtitle, action, children }) => (
  <div className="d-section">
    {(title || subtitle || action) && (
      <div className="d-section-header">
        <div>
          <h3 className="d-section-title">{title}</h3>
          {subtitle && <p className="d-section-subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
)

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    })
  }
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatTime = (slot) => slot || 'N/A'

export const formatCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

export const Pagination = ({ page, pages, onPageChange }) => {
  if (!pages || pages <= 1) return null
  const pagesArray = Array.from({ length: pages }, (_, i) => i + 1)
  return (
    <div className="d-pagination">
      <button className="d-page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      {pagesArray.map((p) => (
        <button
          key={p}
          className={`d-page-btn ${p === page ? 'active' : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button className="d-page-btn" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  )
}

export const TableSkeleton = ({ rows = 5, cols = 6 }) => (
  <div className="d-table-wrap" aria-busy="true" aria-label="Loading">
    <table className="d-table">
      <tbody>
        {Array.from({ length: rows }, (_, i) => (
          <tr key={i}>
            {Array.from({ length: cols }, (_, j) => (
              <td key={j}>
                <div
                  className={j === 0 ? 'd-skeleton-cell d-skeleton-avatar' : 'd-skeleton-cell'}
                  style={j === 0 ? { width: 40, height: 40, borderRadius: '50%' } : { maxWidth: j === cols - 1 ? 120 : 220 }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const ConfirmDialog = ({ open, title = 'Confirm', message, confirmText = 'Delete', onCancel, onConfirm, busy = false }) => {
  if (!open) return null
  return (
    <div className="d-modal-overlay" onClick={onCancel}>
      <div className="d-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="d-modal-header">{title}</div>
        <div className="d-modal-body">{message}</div>
        <div className="d-modal-actions">
          <button className="d-btn d-btn-outline" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="d-btn d-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
