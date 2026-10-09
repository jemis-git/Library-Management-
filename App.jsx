import { useState, useEffect } from 'react'
import './styles.css'
import Dashboard from './src/pages/Dashboard'
import Books from './src/pages/Books'
import Students from './src/pages/Students'
import IssueBook from './src/pages/IssueBook'
import History from './src/pages/History'
import Login from './src/pages/Login'
import Register from './src/pages/Register'
import AdminAccounts from './src/pages/AdminAccounts'

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

  // Theme state: 'light' or 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('library_theme') || 'dark'
  })

  // Apply theme to html root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('library_theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Mobile sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Admin profile shutter state
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileTab, setProfileTab] = useState('info') // 'info' or 'password'

  // Auth screen mode: 'login' or 'register'
  const [authMode, setAuthMode] = useState('login')
  const [prefillUsername, setPrefillUsername] = useState('')
  const [registrationSuccessMsg, setRegistrationSuccessMsg] = useState('')

  // Registered company name state (persisted)
  const [registeredCompany, setRegisteredCompany] = useState(() => {
    const saved = localStorage.getItem('registered_company')
    if (!saved || saved === 'LibraryPro' || saved === 'Apex University Library' || saved === 'Vivekanand College Library') {
      return 'Library Management'
    }
    return saved
  })

  // Registered company logo state (persisted)
  const [registeredLogo, setRegisteredLogo] = useState(() => {
    return localStorage.getItem('registered_logo') || ''
  })

  // Current logged in user object
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('current_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return null
  })

  // Login state: true if currentUser exists
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('current_user'))
  })

  // Admin user profile info
  const [adminProfile, setAdminProfile] = useState(() => {
    const savedUser = localStorage.getItem('current_user')
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser)
        return {
          username: u.username,
          name: u.companyName || u.username,
          email: u.email,
          companyName: u.companyName,
          logo: u.logo || '',
          role: u.role || 'Admin'
        }
      } catch (e) {}
    }
    const saved = localStorage.getItem('admin_profile')
    return saved ? JSON.parse(saved) : {
      username: 'admin',
      name: 'Administrator',
      email: 'admin@library.edu',
      companyName: 'Library Management',
      logo: '',
      role: 'Super Admin'
    }
  })

  // Synchronize document title with company name
  useEffect(() => {
    const activeName = (currentUser && currentUser.companyName) || registeredCompany || 'Library Management'
    document.title = `${activeName} - System`
  }, [currentUser, registeredCompany])

  // Fetch registered company name and logo from backend
  useEffect(() => {
    fetch(`${API}/company`)
      .then(res => res.json())
      .then(data => {
        if (data && data.companyName) {
          setRegisteredCompany(data.companyName)
          localStorage.setItem('registered_company', data.companyName)
        }
        if (data && data.logo) {
          setRegisteredLogo(data.logo)
          localStorage.setItem('registered_logo', data.logo)
        }
      })
      .catch(() => {})
  }, [])

  // Password fields for Change Password tab
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' })

  // Track current page
  const [page, setPage] = useState('dashboard')

  // Computed Super Admin flag
  const isSuperAdmin = Boolean(
    currentUser && (
      currentUser.isSuperAdmin ||
      currentUser.role === 'Super Admin' ||
      currentUser.username?.toLowerCase() === 'superadmin' ||
      currentUser.username?.toLowerCase() === 'admin'
    )
  )

  // Data states
  const [books, setBooks] = useState([])
  const [students, setStudents] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  // Toast messages
  const [toasts, setToasts] = useState([])

  // Load data on start or when user changes
  useEffect(() => {
    if (isLoggedIn) {
      loadAllData()
    }
  }, [isLoggedIn, currentUser?.username])

  // Fetch all data from MongoDB (Isolated per account for tenants, all for Superadmin)
  async function loadAllData() {
    setLoading(true)
    try {
      const isSuper = Boolean(
        currentUser && (
          currentUser.isSuperAdmin ||
          currentUser.role === 'Super Admin' ||
          currentUser.username?.toLowerCase() === 'superadmin'
        )
      )

      let queryParam = ''
      if (!isSuper && currentUser?.username) {
        // Regular user: strict isolation by their username
        queryParam = `?account=${encodeURIComponent(currentUser.username)}`
      }

      const [booksRes, studentsRes, txnRes] = await Promise.all([
        fetch(`${API}/books${queryParam}`),
        fetch(`${API}/students${queryParam}`),
        fetch(`${API}/transactions${queryParam}`)
      ])
      const [booksData, studentsData, txnData] = await Promise.all([
        booksRes.json(),
        studentsRes.json(),
        txnRes.json()
      ])

      const today = new Date().toISOString().split('T')[0]
      const sanitizedTxns = Array.isArray(txnData) ? txnData.map(t => {
        if (t.status === 'issued' && t.dueDate && t.dueDate < today) {
          return { ...t, status: 'overdue' }
        }
        return t
      }) : []

      setBooks(Array.isArray(booksData) ? booksData : [])
      setStudents(Array.isArray(studentsData) ? studentsData : [])
      setTransactions(sanitizedTxns)
    } catch (err) {
      showToast('Could not connect to server. Please run start.bat!', 'error')
      setBooks([])
      setStudents([])
      setTransactions([])
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

  // Handle successful login
  function handleLogin(userData) {
    setCurrentUser(userData)
    localStorage.setItem('current_user', JSON.stringify(userData))
    if (userData.companyName) {
      setRegisteredCompany(userData.companyName)
      localStorage.setItem('registered_company', userData.companyName)
    }
    if (userData.logo) {
      setRegisteredLogo(userData.logo)
      localStorage.setItem('registered_logo', userData.logo)
    }
    setAdminProfile({
      username: userData.username,
      name: userData.companyName || userData.username,
      email: userData.email,
      companyName: userData.companyName || registeredCompany || 'Library Management',
      logo: userData.logo || registeredLogo || '',
      role: userData.role || 'Admin'
    })
    setIsLoggedIn(true)
    showToast(`Welcome, ${userData.username}! 🎉`, 'success')
  }

  // Handle successful registration
  function handleRegisterSuccess(userData) {
    if (userData.companyName) {
      setRegisteredCompany(userData.companyName)
      localStorage.setItem('registered_company', userData.companyName)
    }
    if (userData.logo) {
      setRegisteredLogo(userData.logo)
      localStorage.setItem('registered_logo', userData.logo)
    }
    setPrefillUsername(userData.username)
    setRegistrationSuccessMsg(userData.message || 'Registration stored in database successfully! Please sign in with your credentials.')
    setAuthMode('login')
    showToast('Registration successful! Please sign in.', 'success')
  }

  // Handle password change from shutter
  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMsg({ text: '', type: '' })

    const activeUsername = (currentUser && currentUser.username) || 'admin'
    const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
    const userIndex = localUsers.findIndex(u => u.username.toLowerCase() === activeUsername.toLowerCase())

    let storedPass = localStorage.getItem('admin_password') || 'admin123'
    if (userIndex !== -1 && localUsers[userIndex].password) {
      storedPass = localUsers[userIndex].password
    }

    if (currentPassword !== storedPass) {
      setPasswordMsg({ text: 'Current password is incorrect!', type: 'error' })
      return
    }
    if (!newPassword || newPassword.length < 4) {
      setPasswordMsg({ text: 'New password must be at least 4 characters!', type: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match!', type: 'error' })
      return
    }

    try {
      await fetch(`${API}/users/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: activeUsername,
          currentPassword,
          newPassword
        })
      })
    } catch (err) {
      console.warn('Backend password sync error (continuing with local update):', err)
    }

    if (userIndex !== -1) {
      localUsers[userIndex].password = newPassword
      localStorage.setItem('registered_users', JSON.stringify(localUsers))
    }
    localStorage.setItem('admin_password', newPassword)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMsg({ text: 'Password changed successfully! ✅', type: 'success' })
    showToast('Password changed successfully!')
  }

  // Handle logout -> directly redirect to default login page
  function handleLogout() {
    localStorage.removeItem('current_user')
    localStorage.removeItem('registered_company')
    localStorage.removeItem('registered_logo')
    setCurrentUser(null)
    setRegisteredCompany('Library Management')
    setRegisteredLogo('')
    setPrefillUsername('')
    setRegistrationSuccessMsg('')
    setIsLoggedIn(false)
    setAuthMode('login')
    setPage('dashboard')
    setSidebarOpen(false)
    setProfileOpen(false)
    showToast('Signed out successfully. Returned to login page.')
  }

  // If not logged in, show Login or Register page with theme toggle
  if (!isLoggedIn) {
    if (authMode === 'register') {
      return (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => {
            setAuthMode('login')
            setRegistrationSuccessMsg('')
          }}
          registeredCompany={registeredCompany}
          registeredLogo={registeredLogo}
          API={API}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )
    }

    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => {
          setAuthMode('register')
          setRegistrationSuccessMsg('')
        }}
        registeredCompany={registeredCompany}
        registeredLogo={registeredLogo}
        prefillUsername={prefillUsername}
        successMsg={registrationSuccessMsg}
        API={API}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  // Dashboard stats
  const totalBooks = books.reduce((sum, b) => sum + (b.copies || 0), 0)
  const availableBooks = books.reduce((sum, b) => sum + (b.available || 0), 0)
  const issuedCount = transactions.filter(t => t.status === 'issued' || t.status === 'overdue').length
  const overdueCount = transactions.filter(t => t.status === 'overdue').length

  // Sidebar navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', desc: 'Overview & recent activity' },
    { id: 'books', label: 'Books', icon: '📚', desc: 'Manage catalogue & stock' },
    { id: 'students', label: 'Students', icon: '🎓', desc: 'Registered students' },
    { id: 'issue', label: 'Issue Book', icon: '📤', desc: 'Borrow & return processing' },
    { id: 'history', label: 'History', icon: '📋', desc: 'Transaction logs & auditing' },
    ...(isSuperAdmin ? [
      { id: 'admin-accounts', label: 'Registered Accounts', icon: '👑', desc: 'Manage all accounts & tenant records' }
    ] : [])
  ]

  const currentPage = navItems.find(n => n.id === page) || navItems[0]

  if (loading) {
    return (
      <div className="loading">
        <span>⏳</span> Loading library data...
      </div>
    )
  }

  function handleNavigate(newPageId) {
    setPage(newPageId)
    setSidebarOpen(false)
  }

  return (
    <div className="app">

      {/* Backdrop for mobile sidebar drawer */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ---- LEFT SIDEBAR ---- */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <img
                src={currentUser?.logo || registeredLogo || '/library-logo.svg'}
                alt="Logo"
                className="brand-logo-img"
              />
            </div>
            <div className="sidebar-brand-text">
              <h2 title={(currentUser && currentUser.companyName) || registeredCompany || 'Library Management'}>
                {(currentUser && currentUser.companyName) || registeredCompany || 'Library Management'}
              </h2>
              <span>Management</span>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-section-title">Navigation</div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${page === item.id ? 'active' : ''}`}
              onClick={() => handleNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </aside>

      {/* ---- RIGHT MAIN AREA ---- */}
      <div className="main">

        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle-btn"
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle navigation drawer"
            >
              ☰
            </button>
            <div className="topbar-title">
              <h1>{currentPage.icon} {currentPage.label}</h1>
              <p>{currentPage.desc}</p>
            </div>
          </div>

          <div className="topbar-right">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="theme-toggle-pill">
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
              <span className="theme-toggle-text">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            {/* Interactive Admin Profile Shutter Trigger & Dropdown */}
            <div className="profile-dropdown-wrapper">
              {profileOpen && (
                <div
                  className="profile-shutter-backdrop"
                  onClick={() => setProfileOpen(false)}
                />
              )}

              <button
                type="button"
                className={`profile-trigger-btn ${profileOpen ? 'active' : ''}`}
                onClick={() => setProfileOpen(prev => !prev)}
                aria-label="Admin profile shutter menu"
              >
                <div className="user-avatar">
                  {(adminProfile.logo || registeredLogo) ? (
                    <img src={adminProfile.logo || registeredLogo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    adminProfile.name ? adminProfile.name[0].toUpperCase() : 'A'
                  )}
                </div>
                <span>{adminProfile.companyName || adminProfile.name || 'Admin'}</span>
                <span className="profile-chevron">▼</span>
              </button>

              {profileOpen && (
                <div className="profile-shutter">
                  {/* Shutter Header */}
                  <div className="profile-shutter-header">
                    <div className="profile-shutter-avatar">
                      {(adminProfile.logo || registeredLogo) ? (
                        <img src={adminProfile.logo || registeredLogo} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        adminProfile.name ? adminProfile.name[0].toUpperCase() : 'A'
                      )}
                    </div>
                    <div className="profile-shutter-details">
                      <div className="profile-shutter-name">{adminProfile.companyName || adminProfile.name}</div>
                      <div className="profile-shutter-email">{adminProfile.email}</div>
                      <span className="profile-shutter-role">{adminProfile.role}</span>
                    </div>
                  </div>

                  {/* Shutter Navigation Tabs */}
                  <div className="profile-shutter-tabs">
                    <button
                      type="button"
                      className={`profile-tab-btn ${profileTab === 'info' ? 'active' : ''}`}
                      onClick={() => {
                        setProfileTab('info')
                        setPasswordMsg({ text: '', type: '' })
                      }}
                    >
                      👤 User Info
                    </button>
                    <button
                      type="button"
                      className={`profile-tab-btn ${profileTab === 'password' ? 'active' : ''}`}
                      onClick={() => {
                        setProfileTab('password')
                        setPasswordMsg({ text: '', type: '' })
                      }}
                    >
                      🔑 Change Password
                    </button>
                  </div>

                  {/* Shutter Body */}
                  <div className="profile-shutter-body">
                    {profileTab === 'info' ? (
                      <div>
                        <div className="profile-info-row">
                          <span className="profile-info-label">Organization</span>
                          <span className="profile-info-val" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            {adminProfile.companyName || (currentUser && currentUser.companyName) || registeredCompany || 'Library Management'}
                          </span>
                        </div>
                        <div className="profile-info-row">
                          <span className="profile-info-label">Username</span>
                          <span className="profile-info-val">@{adminProfile.username}</span>
                        </div>
                        <div className="profile-info-row">
                          <span className="profile-info-label">Contact / Name</span>
                          <span className="profile-info-val">{adminProfile.name}</span>
                        </div>
                        <div className="profile-info-row">
                          <span className="profile-info-label">Email Address</span>
                          <span className="profile-info-val">{adminProfile.email}</span>
                        </div>
                        <div className="profile-info-row">
                          <span className="profile-info-label">Role / Level</span>
                          <span className="profile-info-val" style={{ color: 'var(--primary)' }}>
                            {adminProfile.role}
                          </span>
                        </div>
                        <div className="profile-info-row">
                          <span className="profile-info-label">Account Status</span>
                          <span className="profile-info-val" style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
                            Active & Verified
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleChangePassword}>
                        {passwordMsg.text && (
                          <div className={`profile-msg ${passwordMsg.type}`}>
                            {passwordMsg.type === 'success' ? '✅' : '⚠️'} {passwordMsg.text}
                          </div>
                        )}
                        <div className="form-group" style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11 }}>Current Password</label>
                          <input
                            type="password"
                            className="form-control"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            style={{ padding: '8px 10px', fontSize: 13 }}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 11 }}>New Password</label>
                          <input
                            type="password"
                            className="form-control"
                            placeholder="Min. 4 characters"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            style={{ padding: '8px 10px', fontSize: 13 }}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11 }}>Confirm New Password</label>
                          <input
                            type="password"
                            className="form-control"
                            placeholder="Re-type new password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            style={{ padding: '8px 10px', fontSize: 13 }}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-blue"
                          style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: 13 }}
                        >
                          💾 Save New Password
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Shutter Footer with Logout */}
                  <div className="profile-shutter-footer">
                    <button
                      type="button"
                      className="btn profile-shutter-logout"
                      onClick={() => {
                        setProfileOpen(false)
                        handleLogout()
                      }}
                    >
                      Sign Out / Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

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
              currentUser={currentUser}
            />
          )}
          {page === 'students' && (
            <Students
              students={students}
              setStudents={setStudents}
              showToast={showToast}
              API={API}
              currentUser={currentUser}
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
              currentUser={currentUser}
            />
          )}
          {page === 'history' && (
            <History
              transactions={transactions}
              currentUser={currentUser}
            />
          )}
          {page === 'admin-accounts' && (
            <AdminAccounts
              API={API}
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  )
}
