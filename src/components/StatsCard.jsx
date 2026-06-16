const StatsCard = ({ label, value, change, icon: Icon, changeType = 'up', color = '#6366f1' }) => (
  <div className="stat-card" style={{ '--card-accent': color }}>
    <div className="stat-card-inner">
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {change !== undefined && (
          <div className={`stat-change ${changeType}`}>
            <span className="stat-change-arrow">{changeType === 'up' ? '↑' : '↓'}</span>
            {change}
          </div>
        )}
      </div>
      {Icon && (
        <div className="stat-icon-wrapper" style={{ background: `${color}15` }}>
          <Icon size={28} color={color} />
        </div>
      )}
    </div>
  </div>
)

export default StatsCard
