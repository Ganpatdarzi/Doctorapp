import './EmptyState.css'

const EmptyState = ({ icon = '📋', title = 'No data found', description = 'There is nothing to display here yet.' }) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
    </div>
  )
}

export default EmptyState
