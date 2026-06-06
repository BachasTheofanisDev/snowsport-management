import { useState } from 'react'
import { evaluateLevel } from '../api'

const QUESTIONS = [
    {
        key: 'experience',
        question: 'Έχεις ξανακάνει σκι ή snowboard;',
        options: [
            { value: 'no', label: 'Όχι, ποτέ' },
            { value: 'few', label: 'Λίγες φορές' },
            { value: 'yes', label: 'Ναι, αρκετά' },
        ]
    },
    {
        key: 'frequency',
        question: 'Πόσες φορές περίπου έχεις πάει;',
        options: [
            { value: '1-3', label: '1-3 φορές' },
            { value: '4-10', label: '4-10 φορές' },
            { value: '10+', label: 'Πάνω από 10' },
        ]
    },
    {
        key: 'canStop',
        question: 'Μπορείς να σταματάς ελεγχόμενα;',
        options: [
            { value: 'no', label: 'Όχι' },
            { value: 'sometimes', label: 'Μερικές φορές' },
            { value: 'yes', label: 'Ναι, άνετα' },
        ]
    },
    {
        key: 'canTurn',
        question: 'Μπορείς να κάνεις στροφές;',
        options: [
            { value: 'no', label: 'Όχι' },
            { value: 'basic', label: 'Βασικές στροφές' },
            { value: 'yes', label: 'Ναι, με ευκολία' },
        ]
    },
    {
        key: 'slopes',
        question: 'Σε τι πίστες έχεις κατέβει;',
        options: [
            { value: 'none', label: 'Καμία ακόμα' },
            { value: 'green', label: 'Πράσινες (εύκολες)' },
            { value: 'blue', label: 'Μπλε (μεσαίες)' },
            { value: 'red_black', label: 'Κόκκινες/Μαύρες (δύσκολες)' },
        ]
    },
    {
        key: 'steepComfort',
        question: 'Πόσο άνετα νιώθεις σε απότομες κατηφόρες;',
        options: [
            { value: 'no', label: 'Καθόλου άνετα' },
            { value: 'somewhat', label: 'Λίγο' },
            { value: 'yes', label: 'Πολύ άνετα' },
        ]
    },
]

function LevelQuiz({ onResult }) {
    const [step, setStep] = useState(0)
    const [answers, setAnswers] = useState({})
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleAnswer = (value) => {
        const newAnswers = { ...answers, [QUESTIONS[step].key]: value }
        setAnswers(newAnswers)

        if (step < QUESTIONS.length - 1) {
            setStep(step + 1)
        } else {
            submitQuiz(newAnswers)
        }
    }

    const submitQuiz = async (finalAnswers) => {
        setLoading(true)
        try {
            const res = await evaluateLevel(finalAnswers)
            setResult(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setStep(0)
        setAnswers({})
        setResult(null)
    }

    const levelLabels = {
        beginner: 'Αρχάριος',
        intermediate: 'Μεσαίο',
        advanced: 'Προχωρημένο'
    }

    const levelColors = {
        beginner: '#3B6D11',
        intermediate: '#854F0B',
        advanced: '#A32D2D'
    }

    if (loading) {
        return (
            <div className="card">
                <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: 40, marginBottom: '1rem' }}>🤖</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Ανάλυση απαντήσεων...</p>
                </div>
            </div>
        )
    }

    if (result) {
        return (
            <div className="card">
                <div className="card-header" style={{ background: 'var(--navy)', color: 'white' }}>
                    <span className="card-title" style={{ color: 'white' }}>🎯 Το Επίπεδό σου</span>
                </div>
                <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '8px 24px',
                        borderRadius: 100,
                        background: levelColors[result.level] + '20',
                        color: levelColors[result.level],
                        fontSize: 24,
                        fontWeight: 700,
                        marginBottom: '1rem'
                    }}>
                        {levelLabels[result.level]}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        {result.explanation}
                    </p>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        ⚡ Powered by Groq
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={() => onResult(result.level)}>
                            Χρησιμοποίησε αυτό το επίπεδο
                        </button>
                        <button className="btn" style={{ background: 'var(--ice)', color: 'var(--text-secondary)' }} onClick={reset}>
                            Επανάληψη
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const q = QUESTIONS[step]

    return (
        <div className="card">
            <div className="card-header" style={{ background: 'var(--navy)', color: 'white' }}>
                <span className="card-title" style={{ color: 'white' }}>🤖 Ανακάλυψε το Επίπεδό σου</span>
                <span style={{ fontSize: 12, color: '#93c5fd' }}>{step + 1} / {QUESTIONS.length}</span>
            </div>
            <div className="card-body">
                {/* Progress bar */}
                <div style={{ height: 6, background: 'var(--ice)', borderRadius: 100, marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${((step + 1) / QUESTIONS.length) * 100}%`,
                        background: 'var(--accent)',
                        transition: 'width 0.3s'
                    }} />
                </div>

                <h3 style={{ fontSize: 18, marginBottom: '1.5rem', color: 'var(--navy)' }}>{q.question}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {q.options.map(opt => (
                        <button key={opt.value}
                            onClick={() => handleAnswer(opt.value)}
                            style={{
                                padding: '1rem',
                                border: '0.5px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: 15,
                                textAlign: 'left',
                                transition: 'all 0.15s',
                                fontFamily: 'inherit'
                            }}
                            onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'var(--ice)' }}
                            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'white' }}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LevelQuiz