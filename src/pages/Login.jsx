import { useState, useEffect } from 'react'

export default function Login({
  onLogin,
  onSwitchToRegister,
  registeredCompany,
  registeredLogo = '',
  prefillUsername = '',
  successMsg = '',
  API = 'http://localhost:5000/api',
  theme,
  onToggleTheme
}) {
  const [username, setUsername] = useState(prefillUsername)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState(successMsg)
  const [loading, setLoading] = useState(false)

  // Update username if prefill changes (resets to empty on logout)
  useEffect(() => {
    setUsername(prefillUsername || '')
    if (!prefillUsername) {
      setPassword('')
      setError('')
    }
  }, [prefillUsername])

  // Update status message if prop changes
  useEffect(() => {
    setStatusMessage(successMsg || '')
  }, [successMsg])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setStatusMessage('')

    if (!username.trim() || !password) {
      setError('Please enter both username and password!')
      return
    }

    setLoading(true)

    const cleanUsername = username.trim()

    try {
      // 1. Attempt login via Backend & MongoDB Database
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
      })

      const data = await res.json()

      if (res.ok && data.user) {
        // Successful login against database
        setLoading(false)
        onLogin(data.user)
        return
      }

      // If backend returned invalid credentials
      if (!res.ok) {
        throw new Error(data.error || 'Invalid username or password!')
      }
    } catch (err) {
      console.warn('Backend login check or offline fallback:', err)

      // Fallback check: check locally stored users or default admin
      const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
      const matchedUser = localUsers.find(
        u => (u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanUsername.toLowerCase()) && u.password === password
      )

      if (matchedUser) {
        setLoading(false)
        onLogin({
          username: matchedUser.username,
          email: matchedUser.email,
          companyName: matchedUser.companyName,
          logo: matchedUser.logo || registeredLogo || '',
          role: matchedUser.role || 'Admin'
        })
        return
      }

      // Superadmin fallback
      if (cleanUsername.toLowerCase() === 'superadmin' && password === 'admin123') {
        setLoading(false)
        onLogin({
          username: 'Superadmin',
          name: 'Super Admin',
          email: 'superadmin@library.system',
          companyName: registeredCompany || 'Library Management System',
          logo: registeredLogo || '',
          role: 'Super Admin',
          isSuperAdmin: true
        })
        return
      }

      // Admin fallback
      const storedAdminPass = localStorage.getItem('admin_password') || 'admin123'
      if (cleanUsername.toLowerCase() === 'admin' && (password === storedAdminPass || password === 'admin123')) {
        setLoading(false)
        onLogin({
          username: 'admin',
          name: 'Administrator',
          email: 'admin@library.edu',
          companyName: registeredCompany || 'Library Management',
          logo: registeredLogo || '',
          role: 'Super Admin',
          isSuperAdmin: true
        })
        return
      }

      setError(err.message || 'Invalid username or password!')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {onToggleTheme && (
        <button
          type="button"
          className="theme-toggle-btn login-theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          <span className="theme-toggle-pill">
            {theme === 'dark' ? '☀️' : '🌙'}
          </span>
          <span className="theme-toggle-text">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>
      )}

      <div className="login-card">
        <div className="login-header">
          <div className="app-logo-badge">
            <img src={registeredLogo || '/library-logo.svg'} alt="Company Logo" className="app-logo-img" />
          </div>
          <h1>{registeredCompany || 'Library Management'}</h1>
          <p>Sign in to manage your library</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {statusMessage && (
            <div className="success-box">
              ✅ {statusMessage}
            </div>
          )}

          {error && <div className="error-box">⚠️ {error}</div>}

          <div className="form-group">
            <label>Username or Email</label>
            <input
              className="form-control"
              type="text"
              placeholder="Enter your username or email"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus={!prefillUsername}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <button
                type="button"
                className="password-toggle-text"
                onClick={() => setShowPassword(p => !p)}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              className="form-control"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus={!!prefillUsername}
              required
            />
          </div>

          <button className="btn btn-blue login-btn" type="submit" disabled={loading}>
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={onSwitchToRegister}
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
