import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowRight, BrainCircuit, CalendarDays, CheckCircle2, ChevronRight,
  CircleUserRound, Clock3, Gauge, Lightbulb, LogOut, Menu, MessageSquareText,
  Plus, ShieldAlert, Sparkles, Target, TrendingUp, X
} from 'lucide-react'
import { supabase } from './supabase'

const demo = { capacity: 81, dna: 'Architect', constraint: 'Leadership Multiplication', stage: 'Systemizing' }

const fallbackSignals = [
  { title: 'Protect strategic capacity', insight: 'Your highest-value work needs a protected 90-minute block before operational requests begin.', tone: 'gold' },
  { title: 'Delegation opportunity detected', insight: 'One recurring responsibility has appeared three times this week. Convert it into a documented ownership handoff.', tone: 'blue' },
  { title: 'Decision velocity is strong', insight: 'Your current priorities are moving. Preserve momentum by resolving the oldest open decision today.', tone: 'green' },
]

const fallbackTimeline = [
  { time: '8:05 AM', title: 'Morning brief prepared', detail: 'Your focus, priorities, and capacity signals are ready.' },
  { time: '8:42 AM', title: 'Strategic capacity protected', detail: 'A 90-minute focus block is recommended before midday.' },
  { time: '9:10 AM', title: 'Leadership signal identified', detail: 'Delegation remains the highest-leverage move for today.' },
]

function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return <div className="auth-shell"><div className="auth-card">
    <div className="monogram">AE</div>
    <p className="eyebrow">EXECUTIVE INTELLIGENCE PLATFORM</p>
    <h1>Lead with clarity.<br/>Build with intelligence.<br/>Live with freedom.</h1>
    <p className="muted">Enter your email to access your personalized executive operating system.</p>
    {sent ? <div className="success"><CheckCircle2/> Check your email for your secure login link.</div> :
      <form onSubmit={submit}><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required/><button disabled={loading}>{loading ? 'Sending…' : 'Access My Dashboard'} <ArrowRight size={18}/></button></form>}
    {error && <p className="error">{error}</p>}
  </div></div>
}

function PanelHeader({ eyebrow, title, action }) {
  return <div className="panel-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [diagnostic, setDiagnostic] = useState(null)
  const [priorities, setPriorities] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [newPriority, setNewPriority] = useState('')
  const [chiefPrompt, setChiefPrompt] = useState('')
  const [chiefResponse, setChiefResponse] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { if (session?.user) loadDashboard() }, [session?.user?.id])

  async function loadDashboard() {
    const uid = session.user.id
    const [p, d, pr, r] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('diagnostic_submissions').select('*').eq('user_id', uid).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('executive_priorities').select('*').eq('user_id', uid).neq('status', 'archived').order('priority_order'),
      supabase.from('executive_recommendations').select('*').eq('user_id', uid).in('status', ['unread', 'viewed']).order('created_at', { ascending: false }).limit(4),
    ])
    setProfile(p.data); setDiagnostic(d.data); setPriorities(pr.data || []); setRecommendations(r.data || [])
    track('command_center_viewed')
  }

  async function track(event_name, properties = {}) {
    if (!session?.user) return
    await supabase.from('behavior_events').insert({ user_id: session.user.id, event_name, page_url: window.location.href, properties })
  }

  async function addPriority(e) {
    e.preventDefault()
    const title = newPriority.trim()
    if (!title) return
    const { data, error } = await supabase.from('executive_priorities').insert({ user_id: session.user.id, title, priority_order: priorities.length, status: 'active' }).select().single()
    if (!error) { setPriorities(v => [...v, data]); setNewPriority(''); track('priority_created', { priority_id: data.id }) }
  }

  async function completePriority(item) {
    if (!item?.id || String(item.id).startsWith('q')) return
    const { error } = await supabase.from('executive_priorities').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', item.id)
    if (!error) { setPriorities(v => v.map(x => x.id === item.id ? { ...x, status: 'completed' } : x)); track('priority_completed', { priority_id: item.id }) }
  }

  function submitChief(e) {
    e.preventDefault()
    const prompt = chiefPrompt.trim()
    if (!prompt) return
    setChiefResponse(`Executive direction received: “${prompt}” This command is ready for the AI Chief of Staff workflow in the next build.`)
    setChiefPrompt('')
    track('chief_of_staff_prompted', { prompt })
  }

  const data = useMemo(() => ({
    capacity: diagnostic?.executive_capacity_score ?? demo.capacity,
    dna: diagnostic?.executive_dna ?? demo.dna,
    constraint: diagnostic?.primary_constraint ?? demo.constraint,
    stage: diagnostic?.evolution_stage ?? demo.stage,
  }), [diagnostic])

  if (loading) return <div className="loading">Loading intelligence…</div>
  if (!session) return <Login/>

  const firstName = profile?.first_name || session.user.email?.split('@')[0] || 'Executive'
  const active = priorities.filter(x => x.status === 'active')
  const completed = priorities.filter(x => x.status === 'completed')
  const signals = recommendations.length ? recommendations.map((r, i) => ({ title: r.title, insight: r.insight, tone: ['gold', 'blue', 'green'][i % 3] })) : fallbackSignals
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
  const timeLabel = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())
  const executiveQuestion = data.constraint === 'Leadership Multiplication' ? 'What are you still doing that someone else should own?' : 'What is the one decision only you can make today?'

  return <div className="app-shell">
    <aside className={mobileNav ? 'open' : ''}>
      <div className="brand"><span>AE</span><div>AI EXECUTIVE<small>INTELLIGENCE PLATFORM</small></div></div>
      <button className="close-nav" onClick={() => setMobileNav(false)}><X/></button>
      <nav>
        <a className="active"><Gauge/> Command Center</a><a><BrainCircuit/> Intelligence</a><a><Target/> Priorities</a><a><CalendarDays/> Calendar</a><a><MessageSquareText/> Chief of Staff</a><a><TrendingUp/> Progress</a><a><CircleUserRound/> Profile</a>
      </nav>
      <div className="sidebar-footer"><div className="live-status"><span/> Intelligence active</div><button className="signout" onClick={() => supabase.auth.signOut()}><LogOut size={17}/> Sign out</button></div>
    </aside>

    <main>
      <button className="menu-button" onClick={() => setMobileNav(true)}><Menu/></button>
      <header className="command-header"><div><p className="eyebrow">EXECUTIVE COMMAND CENTER</p><h1>Good morning, {firstName}.</h1><p className="muted">Here is what deserves your attention today.</p></div><div className="date-block"><strong>{dateLabel}</strong><span><Clock3 size={14}/> {timeLabel}</span></div></header>

      <section className="executive-question"><div className="question-icon"><Lightbulb/></div><div><p className="eyebrow">TODAY'S EXECUTIVE QUESTION</p><h2>{executiveQuestion}</h2></div><button onClick={() => track('executive_question_reflected')}>Reflect <ArrowRight size={16}/></button></section>

      <section className="command-grid top-grid">
        <article className="panel daily-brief">
          <PanelHeader eyebrow="DAILY EXECUTIVE BRIEF" title="Your five-minute briefing" action={<span className="brief-status"><Sparkles size={14}/> Updated now</span>}/>
          <div className="mission-card"><span>Today's mission</span><h3>Advance {data.constraint.toLowerCase()} without sacrificing strategic capacity.</h3></div>
          <div className="brief-columns"><div><p className="section-label">THREE PRIORITIES</p>{(active.length ? active.slice(0, 3) : [{ id: 'd1', title: 'Protect one strategic focus block' }, { id: 'd2', title: 'Resolve the highest-impact decision' }, { id: 'd3', title: 'Transfer one recurring responsibility' }]).map(item => <div className="brief-line" key={item.id}><CheckCircle2 size={17}/><span>{item.title}</span></div>)}</div><div><p className="section-label">WATCH FOR</p><p className="brief-copy">Operational urgency can consume the hours intended for leadership. Protect the first meaningful block of your day.</p></div></div>
          <div className="ai-observation"><BrainCircuit size={18}/><div><strong>AI observation</strong><p>Your next level will come from clearer ownership, not more personal effort.</p></div></div>
        </article>

        <article className="panel decision-queue">
          <PanelHeader eyebrow="DECISION QUEUE" title="What needs your judgment" action={<span className="count-badge">{Math.max(active.length, 3)} waiting</span>}/>
          <div className="decision-list">{(active.length ? active.slice(0, 4) : [{ id: 'q1', title: 'Approve the next dashboard build', category: 'High impact' }, { id: 'q2', title: 'Choose what to delegate this week', category: 'Leadership' }, { id: 'q3', title: 'Protect tomorrow’s strategy block', category: 'Capacity' }]).map((item, index) => <button className="decision-row" key={item.id} onClick={() => completePriority(item)}><span className={`priority-dot p${index + 1}`}/><div><strong>{item.title}</strong><small>{item.category || (index === 0 ? 'High impact' : 'Executive decision')}</small></div><ChevronRight size={17}/></button>)}</div>
          <button className="text-button">Open full decision queue <ArrowRight size={15}/></button>
        </article>
      </section>

      <section className="command-grid middle-grid">
        <article className="panel capacity-panel"><PanelHeader eyebrow="EXECUTIVE CAPACITY" title="Leadership operating signal" action={<span className="trend"><TrendingUp size={14}/> +6 this week</span>}/><div className="capacity-layout"><div className="large-ring" style={{ '--score': `${data.capacity * 3.6}deg` }}><span>{data.capacity}<small>/100</small></span></div><div className="capacity-bars">{[['Focus', 89], ['Delegation', 67], ['Systems', 74], ['Decision quality', 91], ['Energy', 78]].map(([label, value]) => <div className="bar-row" key={label}><div><span>{label}</span><strong>{value}</strong></div><div className="bar"><i style={{ width: `${value}%` }}/></div></div>)}</div></div></article>
        <article className="panel intelligence-feed"><PanelHeader eyebrow="INTELLIGENCE FEED" title="Signals worth noticing" action={<BrainCircuit className="gold-icon"/>}/><div className="signal-list">{signals.slice(0, 3).map((signal, index) => <div className="signal" key={`${signal.title}-${index}`}><span className={`signal-icon ${signal.tone}`}>{index === 0 ? <ShieldAlert size={16}/> : index === 1 ? <Activity size={16}/> : <TrendingUp size={16}/>}</span><div><strong>{signal.title}</strong><p>{signal.insight}</p></div></div>)}</div></article>
      </section>

      <section className="command-grid lower-grid">
        <article className="panel priorities-panel"><PanelHeader eyebrow="TOP PRIORITIES" title="What matters now" action={<span className="count-badge">{active.length} active</span>}/><form className="priority-form" onSubmit={addPriority}><input value={newPriority} onChange={e => setNewPriority(e.target.value)} placeholder="Add a high-leverage priority"/><button aria-label="Add priority"><Plus size={18}/></button></form><div className="priority-list">{active.length === 0 && <p className="empty">Add the one outcome that would make this week meaningful.</p>}{active.slice(0, 4).map(item => <button className="priority" key={item.id} onClick={() => completePriority(item)}><span className="check"/><div><strong>{item.title}</strong><small>{item.category || 'Executive priority'}</small></div><ChevronRight size={17}/></button>)}{completed.slice(0, 1).map(item => <div className="priority done" key={item.id}><CheckCircle2 size={20}/><div><strong>{item.title}</strong><small>Completed</small></div></div>)}</div></article>
        <article className="panel chief-panel"><PanelHeader eyebrow="AI CHIEF OF STAFF" title="Give executive direction" action={<Sparkles className="gold-icon"/>}/><p className="chief-copy">Ask for preparation, synthesis, planning, or a decision brief.</p><div className="prompt-chips">{['Prepare me for today', 'Review my priorities', 'Draft my CEO update'].map(text => <button key={text} onClick={() => setChiefPrompt(text)}>{text}</button>)}</div><form className="chief-form" onSubmit={submitChief}><textarea value={chiefPrompt} onChange={e => setChiefPrompt(e.target.value)} placeholder="What should your AI Chief of Staff handle?"/><button>Send direction <ArrowRight size={16}/></button></form>{chiefResponse && <div className="chief-response"><Sparkles size={16}/><p>{chiefResponse}</p></div>}</article>
      </section>

      <section className="panel timeline-panel"><PanelHeader eyebrow="EXECUTIVE TIMELINE" title="Today’s intelligence activity" action={<span className="live-label"><span/> Live</span>}/><div className="timeline">{fallbackTimeline.map(item => <div className="timeline-item" key={item.time}><time>{item.time}</time><span className="timeline-node"/><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div></section>
    </main>
  </div>
}
