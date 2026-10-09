// Dashboard - Library overview page
export default function Dashboard({ books, students, transactions, totalBooks, availableBooks, issuedCount, overdueCount, setPage }) {

  // Show last 5 transactions
  const recentTxns = [...transactions]
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
    .slice(0, 5)

  return (
    <div>

      {/* ---- 4 STATS CARDS ---- */}
      <div className="stats-row">
        <div className="stat-card stat-books">
          <div className="stat-icon">📚</div>
          <div>
            <div className="stat-number">{totalBooks}</div>
            <div className="stat-label">Total Books</div>
          </div>
        </div>
        <div className="stat-card stat-available">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-number">{availableBooks}</div>
            <div className="stat-label">Available</div>
          </div>
        </div>
        <div className="stat-card stat-issued">
          <div className="stat-icon">📤</div>
          <div>
            <div className="stat-number">{issuedCount}</div>
            <div className="stat-label">Issued</div>
          </div>
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-icon">⚠️</div>
          <div>
            <div className="stat-number">{overdueCount}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      </div>

      {/* ---- 2 COLUMN RESPONSIVE GRID ---- */}
      <div className="dashboard-grid">

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3>📋 Recent Transactions</h3>
            <button className="btn btn-gray" onClick={() => setPage('history')}>
              View All
            </button>
          </div>
          {recentTxns.length === 0 ? (
            <div className="empty-box">
              <div className="empty-icon">📭</div>
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Book</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map(t => (
                    <tr key={t._id}>
                      <td><strong>{t.studentName}</strong><br /><small style={{ color: 'var(--text-muted)' }}>{t.rollNo}</small></td>
                      <td>{t.bookTitle}</td>
                      <td style={{ color: t.status === 'overdue' ? 'var(--danger)' : 'var(--text-muted)' }}>{t.dueDate}</td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h3>⚡ Quick Actions</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-blue" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setPage('books')}>
                ➕ Add New Book
              </button>
              <button className="btn btn-green" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setPage('students')}>
                🎓 Add Student
              </button>
              <button className="btn btn-orange" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setPage('issue')}>
                📤 Issue a Book
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>📊 Library Summary</h3></div>
            <div className="card-body" style={{ padding: '8px 18px' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Total Students</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{students.length}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Total Book Titles</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{books.length}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Currently Borrowed</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--warning)' }}>{issuedCount}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Overdue Books</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--danger)' }}>{overdueCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
