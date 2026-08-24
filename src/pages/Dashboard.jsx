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
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div>
            <div className="stat-number">{totalBooks}</div>
            <div className="stat-label">Total Books</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-number" style={{ color: '#4caf50' }}>{availableBooks}</div>
            <div className="stat-label">Available</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📤</div>
          <div>
            <div className="stat-number" style={{ color: '#ff9800' }}>{issuedCount}</div>
            <div className="stat-label">Issued</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div>
            <div className="stat-number" style={{ color: '#e57373' }}>{overdueCount}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
      </div>

      {/* ---- 2 COLUMN ROW ---- */}
      <div style={{ display: 'flex', gap: 20 }}>

        {/* Recent Transactions */}
        <div className="card" style={{ flex: 2 }}>
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
                      <td><strong>{t.studentName}</strong><br /><small style={{ color: '#888' }}>{t.rollNo}</small></td>
                      <td style={{ fontSize: 12 }}>{t.bookTitle}</td>
                      <td style={{ fontSize: 12, color: t.status === 'overdue' ? '#e57373' : '#888' }}>{t.dueDate}</td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <div className="card-header"><h3>📊 Summary</h3></div>
            <div className="card-body">
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#888', fontSize: 13 }}>Total Students</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{students.length}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', fontSize: 13 }}>Total Titles</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{books.length}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#888', fontSize: 13 }}>Issued Now</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ff9800' }}>{issuedCount}</td>
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
