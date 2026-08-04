import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import backImg from '../assets/back.jpg'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { loginUser, user, role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && role) {
      if (role === 'superadmin') navigate('/superadmin')
      else if (role === 'resort') navigate('/resort')
      else if (role === 'school') navigate('/school')
      else if (role === 'instructor') navigate('/instructor')
      else if (role === 'customer') navigate('/customer')
    }
  }, [user, role])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login({ email, password })
      loginUser(res.data.user, res.data.role, res.data.token)
      if (res.data.role === 'superadmin') navigate('/superadmin')
      else if (res.data.role === 'resort') navigate('/resort')
      else if (res.data.role === 'school') navigate('/school')
      else if (res.data.role === 'instructor') navigate('/instructor')
      else if (res.data.role === 'customer') navigate('/customer')
    } catch (err) {
      setError(err.response?.data?.error || 'Κάτι πήγε στραβά')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `url(${backImg}) center/cover`,
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <button onClick={toggleTheme} title={theme === 'dark' ? 'Φωτεινό' : 'Σκοτεινό'}
        style={{ position: 'absolute', top: 20, right: 20, zIndex: 2, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: 18, cursor: 'pointer' }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Διακοσμητικοί κύκλοι */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -120, right: -100 }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -80, left: -60 }} />

      <div style={{ width: '100%', maxWidth: 410, position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 48, marginBottom: '0.5rem' }}>🏔</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            SNOWSPORT <span style={{ fontWeight: 300 }}>MANAGEMENT</span>
          </h1>
        </div>

        <div style={{ background: 'var(--snow)', borderRadius: 20, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Κωδικός</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {loading ? 'Σύνδεση...' : 'Σύνδεση'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: '1.5rem', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
          Δεν έχεις λογαριασμό; <a href="/register" style={{ color: '#fff', fontWeight: 600 }}>Εγγραφή</a>
        </p>

      </div>
    </div>
  )
}

export default Login