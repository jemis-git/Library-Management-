import { useState } from 'react'

export default function IssueBook({ books, setBooks, students, transactions, setTransactions, showToast, API, currentUser }) {

  // Tab: 'issue' or 'return'
  const [tab, setTab] = useState('issue')

  // Issue form values
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedBook, setSelectedBook] = useState('')

  // Default due date is 14 days ahead
  const defaultDueDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  }
  const [dueDate, setDueDate] = useState(defaultDueDate)

  // Search for return tab
  const [returnSearch, setReturnSearch] = useState('')

  // Currently issued books (not yet returned)
  const activeTransactions = transactions.filter(t => t.status === 'issued' || t.status === 'overdue')

  // Available books only (can be issued)
  const availableBooks = books.filter(b => b.available > 0)

  // Return search filter
  const filteredForReturn = activeTransactions.filter(t =>
    t.studentName.toLowerCase().includes(returnSearch.toLowerCase()) ||
    t.rollNo.toLowerCase().includes(returnSearch.toLowerCase()) ||
    t.bookTitle.toLowerCase().includes(returnSearch.toLowerCase())
  )

  // Issue a book
  async function handleIssue() {
    if (!selectedStudent || !selectedBook) {
      showToast('Please select both a student and a book!', 'error')
      return
    }

    const student = students.find(s => s._id === selectedStudent)
    const book = books.find(b => b._id === selectedBook)

    if (!student || !book) {
      showToast('Invalid selection!', 'error')
      return
    }

    if (book.available <= 0) {
      showToast(`"${book.title}" is currently out of stock!`, 'error')
      return
    }

    // Check if already issued to this student
    const alreadyIssued = transactions.find(
      t => t.studentId === student._id && t.bookId === book._id && t.status !== 'returned'
    )
    if (alreadyIssued) {
      showToast(`${student.name} already has this book!`, 'error')
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const txnData = {
      bookId: book._id,
      studentId: student._id,
      bookTitle: book.title,
      studentName: student.name,
      rollNo: student.rollNo,
      issueDate: today,
      dueDate: dueDate,
      returnDate: null,
      status: 'issued',
      accountUsername: currentUser?.username || ''
    }

    try {
      // Save transaction
      const res = await fetch(`${API}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txnData)
      })
      const newTxn = await res.json()
      setTransactions(prev => [...prev, newTxn])

      // Decrease available count
      const updatedBook = { ...book, available: book.available - 1 }
      await fetch(`${API}/books/${book._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBook)
      })
      setBooks(prev => prev.map(b => b._id === book._id ? updatedBook : b))

      showToast(`"${book.title}" has been issued to ${student.name}! ✅`)
      setSelectedStudent('')
      setSelectedBook('')

    } catch {
      showToast('Failed to issue book!', 'error')
    }
  }

  // Return a book
  async function handleReturn(txn) {
    const today = new Date().toISOString().split('T')[0]

    try {
      // Update transaction
      const res = await fetch(`${API}/transactions/${txn._id}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnDate: today })
      })
      const updatedTxn = await res.json()
      setTransactions(prev => prev.map(t => t._id === txn._id ? updatedTxn : t))

      // Increase available count (clamped to total copies)
      const book = books.find(b => b._id === txn.bookId)
      if (book) {
        const newAvailable = Math.min(book.copies, (book.available || 0) + 1)
        const updatedBook = { ...book, available: newAvailable }
        await fetch(`${API}/books/${book._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedBook)
        })
        setBooks(prev => prev.map(b => b._id === book._id ? updatedBook : b))
      }

      showToast(`"${txn.bookTitle}" has been returned successfully! ✅`)

    } catch {
      showToast('Failed to process return!', 'error')
    }
  }

  return (
    <div>
      {/* Tab Buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className={`btn ${tab === 'issue' ? 'btn-blue' : 'btn-gray'}`} onClick={() => setTab('issue')}>
          📤 Issue Book
        </button>
        <button className={`btn ${tab === 'return' ? 'btn-orange' : 'btn-gray'}`} onClick={() => setTab('return')}>
          📥 Return Book
        </button>
      </div>

      {/* ---- ISSUE TAB ---- */}
      {tab === 'issue' && (
        <div className="issue-grid">

          {/* Issue Form */}
          <div className="card">
            <div className="card-header"><h3>📤 Issue a Book</h3></div>
            <div className="card-body">

              <div className="form-group">
                <label>Select Student *</label>
                <select className="form-control" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                  <option value="">-- Choose a student --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.rollNo}) - {s.branch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Book *</label>
                <select className="form-control" value={selectedBook} onChange={e => setSelectedBook(e.target.value)}>
                  <option value="">-- Choose a book --</option>
                  {availableBooks.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.title} ({b.available} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input className="form-control" type="date"
                  value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>

              <button className="btn btn-blue" style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleIssue}>
                📤 Confirm Issue
              </button>
            </div>
          </div>

          {/* Currently Issued List */}
          <div className="card">
            <div className="card-header">
              <h3>📋 Currently Issued ({activeTransactions.length})</h3>
            </div>
            <div className="table-wrap">
              {activeTransactions.length === 0 ? (
                <div className="empty-box">
                  <div className="empty-icon">✅</div>
                  <p>All books have been returned!</p>
                </div>
              ) : (
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
                    {activeTransactions.map(t => (
                      <tr key={t._id}>
                        <td><strong>{t.studentName}</strong></td>
                        <td>{t.bookTitle}</td>
                        <td style={{ color: t.status === 'overdue' ? 'var(--danger)' : 'var(--text-muted)' }}>{t.dueDate}</td>
                        <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- RETURN TAB ---- */}
      {tab === 'return' && (
        <div className="card">
          <div className="card-header"><h3>📥 Return a Book</h3></div>

          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="search-box">
              🔍 <input placeholder="Search by student or book..."
                value={returnSearch} onChange={e => setReturnSearch(e.target.value)} />
            </div>
          </div>

          <div className="table-wrap">
            {filteredForReturn.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon">📭</div>
                <p>{activeTransactions.length === 0 ? 'No books are currently issued' : 'No results found'}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Book</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Return</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForReturn.map(t => (
                    <tr key={t._id}>
                      <td><strong>{t.studentName}</strong></td>
                      <td>
                        <code style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                          {t.rollNo}
                        </code>
                      </td>
                      <td style={{ fontSize: 13 }}>{t.bookTitle}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.issueDate}</td>
                      <td style={{ color: t.status === 'overdue' ? 'var(--danger)' : 'var(--text-muted)', fontSize: 12, fontWeight: t.status === 'overdue' ? 'bold' : 'normal' }}>
                        {t.dueDate}
                        {t.status === 'overdue' && <><br /><small style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Overdue</small></>}
                      </td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td>
                        <button className="btn btn-green" style={{ padding: '5px 12px', fontSize: 12 }}
                          onClick={() => handleReturn(t)}>
                          📥 Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
