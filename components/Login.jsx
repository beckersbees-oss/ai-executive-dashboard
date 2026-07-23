import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="monogram">AE</div>

        <p className="eyebrow">EXECUTIVE INTELLIGENCE PLATFORM</p>

        <h1>
          Lead with clarity.
          <br />
          Build with intelligence.
          <br />
          Live with freedom.
        </h1>

        <p className="muted">
          Enter your email to access your personalized executive operating system.
        </p>

        {sent ? (
          <div className="success">
            <CheckCircle2 />
            Check your email for your secure login link.
          </div>
        ) : (
          <form onSubmit={submit}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Access My Dashboard'}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
