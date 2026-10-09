import { useState } from 'react'

export default function Register({
  onRegisterSuccess,
  onSwitchToLogin,
  registeredCompany,
  API = 'http://localhost:5000/api',
  theme,
  onToggleTheme
}) {
  const [companyName, setCompanyName] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle company logo file selection
  function handleLogoChange(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, SVG, WebP)!')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Logo size exceeds 5MB! Please upload a smaller image.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoPreview(event.target.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveLogo() {
    setLogoPreview('')
  }

  // Password match status
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Basic client validations
    if (!companyName.trim()) {
      setError('Please enter your Company / Organization name!')
      return
    }
    if (!username.trim()) {
      setError('Please choose a username!')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address!')
      return
    }
    if (!password) {
      setError('Please enter a password!')
      return
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long!')
      return
    }
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match!')
      return
    }

    setLoading(true)

    const payload = {
      companyName: companyName.trim(),
      logo: logoPreview || '',
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword
    }

    try {
      // 1. Attempt storing in MongoDB Database via Backend
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register. Please try again.')
      }

      // Update local storage cache for smooth offline/instant sync
      localStorage.setItem('registered_company', payload.companyName)
      if (payload.logo) {
        localStorage.setItem('registered_logo', payload.logo)
      }
      
      const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
      const filtered = localUsers.filter(u => u.username.toLowerCase() !== payload.username.toLowerCase())
      filtered.push({
        username: payload.username,
        email: payload.email,
        password: payload.password,
        companyName: payload.companyName,
        logo: payload.logo || '',
        role: 'Admin'
      })
      localStorage.setItem('registered_users', JSON.stringify(filtered))

      setLoading(false)
      onRegisterSuccess({
        username: payload.username,
        companyName: payload.companyName,
        logo: payload.logo || '',
        email: payload.email,
        role: 'Admin',
        message: 'Registration stored in database successfully! Please sign in with your credentials.'
      })
    } catch (err) {
      console.warn('Backend registration error or offline:', err)

      // If backend network error (offline), fallback gracefully to localStorage
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.name === 'TypeError')) {
        const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]')
        const exists = localUsers.some(u => u.username.toLowerCase() === payload.username.toLowerCase())
        if (exists) {
          setError('Username already exists locally! Please choose another.')
          setLoading(false)
          return
        }

        localUsers.push({
          username: payload.username,
          email: payload.email,
          password: payload.password,
          companyName: payload.companyName,
          logo: payload.logo || '',
          role: 'Admin'
        })
        localStorage.setItem('registered_users', JSON.stringify(localUsers))
        localStorage.setItem('registered_company', payload.companyName)
        if (payload.logo) {
          localStorage.setItem('registered_logo', payload.logo)
        }

        setLoading(false)
        onRegisterSuccess({
          username: payload.username,
          companyName: payload.companyName,
          logo: payload.logo || '',
          email: payload.email,
          role: 'Admin',
          message: 'Account registered successfully! Please sign in.'
        })
      } else {
        setError(err.message || 'Registration failed!')
        setLoading(false)
      }
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

      <div className="login-card register-card">
        <div className="login-header">
          <div className="app-logo-badge">
            <img src={logoPreview || '/library-logo.svg'} alt="Logo Preview" className="app-logo-img" />
          </div>
          <h1>{companyName || registeredCompany || 'Library Management'}</h1>
          <p>Create your library administration account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-box">⚠️ {error}</div>}

          {/* Company Name */}
          <div className="form-group">
            <label>Library / Organization Name</label>
            <input
              className="form-control"
              type="text"
              placeholder="e.g. City Central Library, Tech Institute"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Company Logo Upload */}
          <div className="form-group logo-upload-group">
            <label>Company / Organization Logo (Optional)</label>
            <div className="logo-upload-wrapper">
              {logoPreview ? (
                <div className="logo-preview-box">
                  <img src={logoPreview} alt="Selected Logo" className="logo-preview-img" />
                  <div className="logo-preview-info">
                    <span className="logo-preview-badge">✓ Custom Logo Selected</span>
                    <button
                      type="button"
                      className="btn-remove-logo"
                      onClick={handleRemoveLogo}
                    >
                      ✕ Remove Logo
                    </button>
                  </div>
                </div>
              ) : (
                <label className="logo-dropzone">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                  <div className="logo-dropzone-content">
                    <span className="logo-upload-icon">📷</span>
                    <div className="logo-dropzone-text">
                      <strong>Click to upload company logo</strong>
                      <span>PNG, JPG, SVG, or WebP (Max 5MB)</span>
                    </div>
                    <span className="btn-upload-browse">Browse File</span>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="register-grid">
            {/* Username */}
            <div className="form-group">
              <label>Username</label>
              <input
                className="form-control"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email Address</label>
              <input
                className="form-control"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="register-grid">
            {/* Password */}
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
                placeholder="Min. 4 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                className={`form-control ${passwordsMismatch ? 'input-error' : ''} ${passwordsMatch ? 'input-success' : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              {passwordsMismatch && (
                <span className="field-hint hint-error">Passwords do not match</span>
              )}
              {passwordsMatch && (
                <span className="field-hint hint-success">✓ Passwords match</span>
              )}
            </div>
          </div>

          <button className="btn btn-blue login-btn" type="submit" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '✨ Register Account'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={onSwitchToLogin}
            >
              Sign In here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
