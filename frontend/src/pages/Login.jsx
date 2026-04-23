import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../context/AuthContext'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { loginUser, user, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && role) {
      if (role === 'resort') navigate('/resort')
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
      if (res.data.role === 'resort') navigate('/resort')
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ice)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 1rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 40, marginBottom: '0.75rem' }}>🏔</div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--navy)', letterSpacing: 1 }}>
            SNOWSPORT MANAGEMENT
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Σύνδεση στο σύστημα διαχείρισης
          </p>
        </div>

        <div className="card">
          <div className="card-body">
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
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                {loading ? 'Σύνδεση...' : 'Σύνδεση'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: '1.5rem' }}>
          Δεν έχεις λογαριασμό; <a href="/register" style={{ color: 'var(--navy)' }}>Εγγραφή</a>
        </p>

      </div>
    </div>
  )
}

export default Login