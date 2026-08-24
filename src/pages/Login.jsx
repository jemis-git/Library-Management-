import { useState } from 'react'

export default function Login({ onLogin }) {

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter both username and password!')
      return
    }

    setLoading(true)

    // Simulate a brief loading delay
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        onLogin()
      } else {
        setError('Invalid username or password!')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">📖</div>
          <h1>LibraryPro</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-box">⚠️ {error}</div>}

          <div className="form-group">
            <label>Username</label>
            <input
              className="form-control"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button className="btn btn-blue login-btn" type="submit" disabled={loading}>
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Default credentials: <strong>admin</strong> / <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  )
}
