import { useState } from 'react'

export default function History({ transactions, currentUser }) {

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const isSuperAdmin = currentUser?.isSuperAdmin || currentUser?.role === 'Super Admin' || currentUser?.username?.toLowerCase() === 'superadmin'

  // Sorting + filtering
  const filtered = [...transactions]
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
    .filter(t => {
      const matchSearch =
        t.studentName.toLowerCase().includes(search.toLowerCase()) ||
        t.rollNo.toLowerCase().includes(search.toLowerCase()) ||
        t.bookTitle.toLowerCase().includes(search.toLowerCase()) ||
        (isSuperAdmin && t.accountUsername && t.accountUsername.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      return matchSearch && matchStatus
    })

  // Count for each status
  const issued = transactions.filter(t => t.status === 'issued').length
  const returned = transactions.filter(t => t.status === 'returned').length
  const overdue = transactions.filter(t => t.status === 'overdue').length

  return (
    <div>
      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className={`btn ${statusFilter === 'all' ? 'btn-blue' : 'btn-gray'}`}
          onClick={() => setStatusFilter('all')}>
          All ({transactions.length})
        </button>
        <button className={`btn ${statusFilter === 'issued' ? 'btn-orange' : 'btn-gray'}`}
          onClick={() => setStatusFilter('issued')}>
          📤 Issued ({issued})
        </button>
        <button className={`btn ${statusFilter === 'returned' ? 'btn-green' : 'btn-gray'}`}
          onClick={() => setStatusFilter('returned')}>
          ✅ Returned ({returned})
        </button>
        <button className={`btn ${statusFilter === 'overdue' ? 'btn-red' : 'btn-gray'}`}
          onClick={() => setStatusFilter('overdue')}>
          ⚠️ Overdue ({overdue})
        </button>
      </div>

      {/* Search */}
      <div className="search-box" style={{ marginBottom: 14 }}>
        🔍 <input placeholder={isSuperAdmin ? "Search by student, roll number, book, or account..." : "Search by student, roll number or book..."}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Transaction History ({filtered.length} records)</h3>
        </div>
        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-box">
              <div className="empty-icon">📭</div>
              <p>No records found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Book</th>
                  {isSuperAdmin && <th>Account</th>}
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t._id}>
                    <td style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <strong>{t.studentName}</strong>
                      <br />
                      <small style={{ color: 'var(--text-muted)' }}>{t.rollNo}</small>
                    </td>
                    <td style={{ fontSize: 13 }}>{t.bookTitle}</td>
                    {isSuperAdmin && (
                      <td>
                        <span className="badge badge-admin" style={{ fontSize: 11 }}>
                          @{t.accountUsername || 'admin'}
                        </span>
                      </td>
                    )}
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.issueDate}</td>
                    <td style={{
                      color: t.status === 'overdue' ? 'var(--danger)' : 'var(--text-muted)',
                      fontWeight: t.status === 'overdue' ? 'bold' : 'normal',
                      fontSize: 12
                    }}>
                      {t.dueDate}
                    </td>
                    <td style={{ color: t.returnDate ? 'var(--success)' : 'var(--text-subtle)', fontSize: 12 }}>
                      {t.returnDate || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${t.status}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary Cards at bottom */}
      <div className="stats-row" style={{ marginTop: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card stat-books">
          <div className="stat-icon">📊</div>
          <div>
            <div className="stat-number">{transactions.length}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>
        <div className="stat-card stat-issued">
          <div className="stat-icon">📤</div>
          <div>
            <div className="stat-number">{issued}</div>
            <div className="stat-label">Issued Now</div>
          </div>
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-icon">⚠️</div>
          <div>
            <div className="stat-number">{overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      </div>
    </div>
  )
}
