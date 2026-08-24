import { useState, useEffect } from 'react'
import './styles.css'
import Dashboard from './src/pages/Dashboard'
import Books from './src/pages/Books'
import Students from './src/pages/Students'
import IssueBook from './src/pages/IssueBook'
import History from './src/pages/History'
import Login from './src/pages/Login'

// Backend API URL
const API = 'http://localhost:5000/api'

// =============================================
// Toast Notification (Small popup message)
// =============================================
function Toast({ toasts }) {
  return (
    <div className="toast-box">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' ? '✅' : '❌'} {t.msg}
        </div>
      ))}
    </div>
  )
}

// =============================================
// Main App Component
// =============================================
export default function App() {

  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Track current page
  const [page, setPage] = useState('dashboard')

  // Data states
  const [books, setBooks] = useState([])
  const [students, setStudents] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Toast messages
  const [toasts, setToasts] = useState([])

  // Load data on start
  useEffect(() => {
    if (isLoggedIn) {
      loadAllData()
    }
  }, [isLoggedIn])

  // Fetch all data from MongoDB
  async function loadAllData() {
    setLoading(true)
    try {
      const [booksRes, studentsRes, txnRes] = await Promise.all([
        fetch(`${API}/books`),
        fetch(`${API}/students`),
        fetch(`${API}/transactions`)
      ])
      setBooks(await booksRes.json())
      setStudents(await studentsRes.json())
      setTransactions(await txnRes.json())
    } catch (err) {
      showToast('Could not connect to server. Please run start.bat!', 'error')
    }
    setLoading(false)
  }

  // Show toast notification (disappears after 3 seconds)
  function showToast(msg, type = 'success') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  // Handle logout
  function handleLogout() {
    setIsLoggedIn(false)
    setPage('dashboard')
  }

  // If not logged in, show Login page
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  // Dashboard stats
  const totalBooks = books.reduce((sum, b) => sum + (b.copies || 0), 0)
  const availableBooks = books.reduce((sum, b) => sum + (b.available || 0), 0)
  const issuedCount = transactions.filter(t => t.status === 'issued' || t.status === 'overdue').length
  const overdueCount = transactions.filter(t => t.status === 'overdue').length

  // Sidebar navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'books', label: 'Books', icon: '📚' },
    { id: 'students', label: 'Students', icon: '🎓' },
    { id: 'issue', label: 'Issue Book', icon: '📤' },
    { id: 'history', label: 'History', icon: '📋' },
  ]

  if (loading) {
    return <div className="loading">⏳ Loading data...</div>
  }

  return (
    <div className="app">

      {/* ---- LEFT SIDEBAR ---- */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>📖 LibraryPro</h2>
        </div>
        <div className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: '15px 10px' }}>
          <button className="nav-btn" style={{ color: '#e57373' }} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ---- RIGHT MAIN AREA ---- */}
      <div className="main">

        {/* Top Bar */}
        <div className="topbar">
          <div>
            <h1>{navItems.find(n => n.id === page)?.icon} {navItems.find(n => n.id === page)?.label}</h1>
          </div>
        </div>

        {/* Page Content */}
        <div className="content">
          {page === 'dashboard' && (
            <Dashboard
              books={books}
              students={students}
              transactions={transactions}
              totalBooks={totalBooks}
              availableBooks={availableBooks}
              issuedCount={issuedCount}
              overdueCount={overdueCount}
              setPage={setPage}
            />
          )}
          {page === 'books' && (
            <Books
              books={books}
              setBooks={setBooks}
              showToast={showToast}
              API={API}
            />
          )}
          {page === 'students' && (
            <Students
              students={students}
              setStudents={setStudents}
              showToast={showToast}
              API={API}
            />
          )}
          {page === 'issue' && (
            <IssueBook
              books={books}
              setBooks={setBooks}
              students={students}
              transactions={transactions}
              setTransactions={setTransactions}
              showToast={showToast}
              API={API}
            />
          )}
          {page === 'history' && (
            <History transactions={transactions} />
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  )
}
