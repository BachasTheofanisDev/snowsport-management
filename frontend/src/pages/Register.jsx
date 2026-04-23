import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { loginUser } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await axios.post('http://localhost:5000/api/customer/register', form)
            loginUser(res.data.user, res.data.role, res.data.token)
            navigate('/customer')
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
                        Δημιουργία λογαριασμού πελάτη
                    </p>
                </div>

                <div className="card">
                    <div className="card-body">
                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Ονοματεπώνυμο</label>
                                <input className="form-input" type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Γιώργος Παπαδόπουλος"
                                    required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="email@example.com"
                                    required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Κωδικός</label>
                                <input className="form-input" type="password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••"
                                    required />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">Τηλέφωνο</label>
                                <input className="form-input" type="text"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="69XXXXXXXX" />
                            </div>

                            <button type="submit" className="btn btn-primary"
                                disabled={loading}
                                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                                {loading ? 'Δημιουργία...' : 'Δημιουργία Λογαριασμού'}
                            </button>
                        </form>
                    </div>
                </div>

                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: '1.5rem' }}>
                    Έχεις ήδη λογαριασμό; <Link to="/" style={{ color: 'var(--navy)' }}>Σύνδεση</Link>
                </p>

            </div>
        </div>
    )
}

export default Register