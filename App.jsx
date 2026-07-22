import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowRight, BrainCircuit, CheckCircle2, ChevronRight,
  CircleUserRound, Gauge, LogOut, Plus, Sparkles, Target, TrendingUp
} from 'lucide-react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { supabase } from './supabase'

const demo = {
  capacity: 74,
  dna: 'Architect',
  constraint: 'Leadership Multiplication',
  stage: 'Systemizing',
}

function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return <div className="auth-shell">
    <div className="auth-card">
      <div className="monogram">AE</div>
      <p className="eyebrow">EXECUTIVE INTELLIGENCE PLATFORM</p>
      <h1>Lead with clarity.<br/>Build with intelligence.<br/>Live with freedom.</h1>
      <p className="muted">Enter your email to access your personalized executive operating system.</p>
      {sent ? <div className="success"><CheckCircle2/> Check your email for your secure login link.</div> :
      <form onSubmit={submit}>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
          placeholder="you@company.com" required />
        <button disabled={loading}>{loading ? 'Sending…' : 'Access My Dashboard'} <ArrowRight size={18}/></button>
      </form>}
      {error && <p className="error">{error}</p>}
    </div>
  </div>
}

function MetricCard({icon: Icon,label,value,sub}) {
  return <article className="metric-card">
    <div className="metric-icon"><Icon size={20}/></div>
    <div><p>{label}</p><strong>{value}</strong><span>{sub}</span></div>
  </article>
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [diagnostic, setDiagnostic] = useState(null)
  const [priorities, setPriorities] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [newPriority, setNewPriority] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      setSession(data.session); setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) return
    loadDashboard()
  }, [session?.user?.id])

  async function loadDashboard() {
    const uid = session.user.id
    const [p,d,pr,r] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('diagnostic_submissions').select('*').eq('user_id', uid).order('completed_at',{ascending:false}).limit(1).maybeSingle(),
      supabase.from('executive_priorities').select('*').eq('user_id', uid).neq('status','archived').order('priority_order'),
      supabase.from('executive_recommendations').select('*').eq('user_id', uid).in('status',['unread','viewed']).order('created_at',{ascending:false}).limit(4)
    ])
    setProfile(p.data)
    setDiagnostic(d.data)
    setPriorities(pr.data || [])
    setRecommendations(r.data || [])
    await track('dashboard_viewed')
  }

  async function track(event_name, properties={}) {
    if (!session?.user) return
    await supabase.from('behavior_events').insert({
      user_id: session.user.id,
      event_name,
      page_url: window.location.href,
      properties
    })
  }

  async function addPriority(e) {
    e.preventDefault()
    const title = newPriority.trim()
    if (!title) return
    const { data, error } = await supabase.from('executive_priorities').insert({
      user_id: session.user.id, title, priority_order: priorities.length
    }).select().single()
    if (!error) {
      setPriorities(v => [...v, data]); setNewPriority('')
      track('priority_created',{priority_id:data.id})
    }
  }

  async function completePriority(item) {
    const { error } = await supabase.from('executive_priorities')
      .update({status:'completed', completed_at:new Date().toISOString()})
      .eq('id',item.id)
    if (!error) {
      setPriorities(v=>v.map(x=>x.id===item.id?{...x,status:'completed'}:x))
      track('priority_completed',{priority_id:item.id})
    }
  }

  const data = useMemo(()=>({
    capacity: diagnostic?.executive_capacity_score ?? demo.capacity,
    dna: diagnostic?.executive_dna ?? demo.dna,
    constraint: diagnostic?.primary_constraint ?? demo.constraint,
    stage: diagnostic?.evolution_stage ?? demo.stage,
  }),[diagnostic])

  if (loading) return <><div className="loading">Loading intelligence…</div><SpeedInsights /></>
  if (!session) return <><Login/><SpeedInsights /></>

  const firstName = profile?.first_name || session.user.email?.split('@')[0] || 'Executive'
  const active = priorities.filter(x=>x.status==='active')
  const completed = priorities.filter(x=>x.status==='completed')

  return <div className="app-shell">
    <aside>
      <div className="brand"><span>AE</span><div>AI EXECUTIVE<small>INTELLIGENCE PLATFORM</small></div></div>
      <nav>
        <a className="active"><Gauge/> Command Center</a>
        <a><BrainCircuit/> Executive Intelligence</a>
        <a><Target/> Priorities</a>
        <a><TrendingUp/> Progress</a>
        <a><CircleUserRound/> Profile</a>
      </nav>
      <button className="signout" onClick={()=>supabase.auth.signOut()}><LogOut size={17}/> Sign out</button>
    </aside>

    <main>
      <header>
        <div><p className="eyebrow">YOUR EXECUTIVE COMMAND CENTER</p><h1>Good morning, {firstName}.</h1>
        <p className="muted">Here is where your leadership deserves attention today.</p></div>
        <div className="status-pill"><span/> Intelligence active</div>
      </header>

      <section className="metrics">
        <MetricCard icon={Gauge} label="Executive Capacity" value={data.capacity} sub="Current score"/>
        <MetricCard icon={Sparkles} label="Executive DNA" value={data.dna} sub="Leadership pattern"/>
        <MetricCard icon={Activity} label="Evolution Stage" value={data.stage} sub="Current operating level"/>
      </section>

      <section className="grid">
        <article className="hero-card">
          <p className="eyebrow">TODAY'S EXECUTIVE FOCUS</p>
          <h2>{data.constraint}</h2>
          <p>Your next level will not come from doing more yourself. Identify one decision, process, or responsibility that can be transferred without lowering the standard.</p>
          <button onClick={()=>track('daily_focus_opened')}>Open Executive Guidance <ChevronRight size={17}/></button>
        </article>

        <article className="score-card">
          <div className="ring" style={{'--score':`${data.capacity * 3.6}deg`}}><span>{data.capacity}</span></div>
          <div><p className="eyebrow">CAPACITY SIGNAL</p><h3>Strong foundation.<br/>Leverage is the next move.</h3>
          <p className="muted">Your score suggests strategic strength with opportunity to reduce operational dependence.</p></div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-head"><div><p className="eyebrow">EXECUTIVE PRIORITIES</p><h2>What matters now</h2></div><span>{active.length} active</span></div>
          <form className="priority-form" onSubmit={addPriority}>
            <input value={newPriority} onChange={e=>setNewPriority(e.target.value)} placeholder="Add a high-leverage priority"/>
            <button><Plus size={18}/></button>
          </form>
          <div className="priority-list">
            {active.length === 0 && <p className="empty">Add the one outcome that would make this week meaningful.</p>}
            {active.map(item=><button className="priority" key={item.id} onClick={()=>completePriority(item)}>
              <span className="check"/><div><strong>{item.title}</strong><small>{item.category}</small></div><ChevronRight size={17}/>
            </button>)}
            {completed.slice(0,2).map(item=><div className="priority done" key={item.id}>
              <CheckCircle2 size={20}/><div><strong>{item.title}</strong><small>Completed</small></div>
            </div>)}
          </div>
        </article>

        <article className="panel intelligence">
          <div className="panel-head"><div><p className="eyebrow">EXECUTIVE INTELLIGENCE</p><h2>Signals and recommendations</h2></div><BrainCircuit/></div>
          {recommendations.length ? recommendations.map(r=><div className="insight" key={r.id}>
            <span><Sparkles size={16}/></span><div><strong>{r.title}</strong><p>{r.insight}</p>{r.action_text&&<button>{r.action_text} <ArrowRight size={15}/></button>}</div>
          </div>) : <>
            <div className="insight"><span><Sparkles size={16}/></span><div><strong>Protect your strategic capacity</strong><p>Block one uninterrupted hour before responding to messages or operational requests.</p></div></div>
            <div className="insight"><span><Sparkles size={16}/></span><div><strong>Convert repetition into intelligence</strong><p>Choose one task you have repeated three times and document the decision rules behind it.</p></div></div>
          </>}
        </article>
      </section>
    </main>
    <SpeedInsights />
  </div>
}
