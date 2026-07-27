const SKELETON_ROWS = 7

const DataTable = ({ columns, data, onRowClick, loading }) => {
  if (loading) {
    return (
      <div className="table-container">
        <table className="data-table skeleton-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={col.width ? { width: col.width } : undefined}>
                  <div className="skeleton skeleton-cell skeleton-cell--sm" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx}>
                    {col.header === 'Image' || col.header === 'logo'
                      ? <div className="skeleton skeleton-avatar" />
                      : col.header === 'Actions'
                        ? <div style={{ display: 'flex', gap: 6 }}><div className="skeleton skeleton-btn" /><div className="skeleton skeleton-btn" /></div>
                        : <div className={`skeleton skeleton-cell ${colIdx % 3 === 0 ? 'skeleton-cell--md' : 'skeleton-cell--sm'}`} />
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <div className="empty-state"><div className="empty-icon">📭</div><h3>No data found</h3></div>
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row._id || rowIdx}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : undefined }}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
