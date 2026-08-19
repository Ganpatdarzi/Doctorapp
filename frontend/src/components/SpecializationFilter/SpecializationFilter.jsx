import './SpecializationFilter.css'

const SpecializationFilter = ({ specializations, selected, onSelect }) => {
  return (
    <div className="specialization-filter">
      <button
        className={`filter-chip ${selected === '' ? 'active' : ''}`}
        onClick={() => onSelect('')}
      >
        All
      </button>
      {specializations.map((spec) => (
        <button
          key={spec}
          className={`filter-chip ${selected === spec ? 'active' : ''}`}
          onClick={() => onSelect(spec)}
        >
          {spec}
        </button>
      ))}
    </div>
  )
}

export default SpecializationFilter
