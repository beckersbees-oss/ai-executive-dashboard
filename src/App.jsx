import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowRight, BookOpen, BrainCircuit, Building2, CalendarDays,
  CheckCircle2, ChevronRight, CircleUserRound, Clock3, Gauge, Lightbulb,
  LogOut, Menu, MessageSquareText, Plus, Save, ShieldAlert, Sparkles,
  Target, Trash2, TrendingUp, Users, X
} from 'lucide-react'
import { supabase } from "./services/supabase";
import ExecutiveSidebar from "./components/layout/ExecutiveSidebar";
const demo = { capacity: 81, dna: 'Architect', constraint: 'Leadership Multiplication', stage: 'Systemizing' }
const emptyMemory = {
  mission: '', vision: '', core_values: [], leadership_philosophy: '',
  leadership_style: '', decision_style: '', communication_style: '',
  definition_of_success: '', annual_goal: '', quarterly_focus: '',
  current_constraint: '', strengths: [], blind_spots: [], companies: [],
  key_relationships: [], ai_preferences: {}, onboarding_complete: false,
}

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
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setLoading(false); if (error) setError(error.message); else setSent(true)
  }
  return <div className="auth-shell"><div className="auth-card">
    <div className="monogram">AE</div><p className="eyebrow">EXECUTIVE INTELLIGENCE PLATFORM</p>
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

function TextListInput({ label, value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  function add() {
    const next = draft.trim()
    if (!next || value.includes(next)) return
    onChange([...value, next]); setDraft('')
  }
  return <div className="memory-field">
    <label>{label}</label>
    <div className="tag-input"><input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} placeholder={placeholder}/><button type="button" onClick={add}><Plus size={16}/></button></div>
    <div className="memory-tags">{value.map(item => <span key={item}>{item}<button type="button" onClick={() => onChange(value.filter(x => x !== item))}><X size={12}/></button></span>)}</div>
  </div>
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [diagnostic, setDiagnostic] = useState(null)
  const [priorities, setPriorities] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [dailyBrief, setDailyBrief] = useState(null)
  const [decisions, setDecisions] = useState([])
  const [memory, setMemory] = useState(emptyMemory)
  const [memoryItems, setMemoryItems] = useState([])
  const [activeView, setActiveView] = useState('command')
  const [memorySaving, setMemorySaving] = useState(false)
  const [memorySaved, setMemorySaved] = useState(false)
  const [newMemory, setNewMemory] = useState({ category: 'context', title: '', content: '', importance: 3 })
  const [reflectionOpen, setReflectionOpen] = useState(false)
  const [reflectionResponse, setReflectionResponse] = useState('')
  const [reflectionSaving, setReflectionSaving] = useState(false)
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
    const [p, d, pr, r, b, dq, m, mi] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('diagnostic_submissions').select('*').eq('user_id', uid).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('executive_priorities').select('*').eq('user_id', uid).neq('status', 'archived').order('priority_order'),
      supabase.from('executive_recommendations').select('*').eq('user_id', uid).in('status', ['unread', 'viewed']).order('created_at', { ascending: false }).limit(4),
      supabase.rpc('ensure_daily_executive_brief'),
      supabase.from('executive_decisions').select('*').eq('user_id', uid).eq('status', 'open').order('created_at', { ascending: false }).limit(5),
      supabase.from('executive_memory').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('executive_memory_items').select('*').eq('user_id', uid).eq('is_active', true).order('importance', { ascending: false }).order('created_at', { ascending: false }),
    ])
    setProfile(p.data); setDiagnostic(d.data); setPriorities(pr.data || []); setRecommendations(r.data || [])
    setDailyBrief(b.data || null); setDecisions(dq.data || []); setMemory({ ...emptyMemory, ...(m.data || {}) }); setMemoryItems(mi.data || [])
    track('command_center_viewed')
  }

  async function track(event_name, properties = {}) {
    if (!session?.user) return
    await supabase.from('behavior_events').insert({ user_id: session.user.id, event_name, page_url: window.location.href, properties })
  }

  function changeView(view) { setActiveView(view); setMobileNav(false); track('navigation_viewed', { view }) }

  async function saveMemory(e) {
    e.preventDefault(); setMemorySaving(true); setMemorySaved(false)
    const payload = { ...memory, user_id: session.user.id, onboarding_complete: true }
    delete payload.id; delete payload.created_at; delete payload.updated_at
    const { data, error } = await supabase.from('executive_memory').upsert(payload, { onConflict: 'user_id' }).select().single()
    setMemorySaving(false)
    if (!error) { setMemory({ ...emptyMemory, ...data }); setMemorySaved(true); track('executive_memory_saved') }
  }

  async function addMemoryItem(e) {
    e.preventDefault()
    if (!newMemory.title.trim() || !newMemory.content.trim()) return
    const { data, error } = await supabase.from('executive_memory_items').insert({
      user_id: session.user.id, category: newMemory.category, title: newMemory.title.trim(),
      content: newMemory.content.trim(), importance: Number(newMemory.importance), source: 'manual'
    }).select().single()
    if (!error) {
      setMemoryItems(items => [data, ...items])
      setNewMemory({ category: 'context', title: '', content: '', importance: 3 })
      track('executive_memory_item_created', { category: data.category })
    }
  }

  async function removeMemoryItem(item) {
    const { error } = await supabase.from('executive_memory_items').update({ is_active: false }).eq('id', item.id)
    if (!error) setMemoryItems(items => items.filter(x => x.id !== item.id))
  }

  async function addPriority(e) {
    e.preventDefault(); const title = newPriority.trim(); if (!title) return
    const { data, error } = await supabase.from('executive_priorities').insert({ user_id: session.user.id, title, priority_order: priorities.length, status: 'active' }).select().single()
    if (!error) { setPriorities(v => [...v, data]); setNewPriority(''); track('priority_created', { priority_id: data.id }) }
  }

  async function completePriority(item) {
    if (!item?.id || String(item.id).startsWith('q')) return
    const { error } = await supabase.from('executive_priorities').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', item.id)
    if (!error) setPriorities(v => v.map(x => x.id === item.id ? { ...x, status: 'completed' } : x))
  }

  async function saveReflection(e) {
    e.preventDefault(); const response = reflectionResponse.trim(); if (!response || !dailyBrief) return
    setReflectionSaving(true)
    const { error } = await supabase.from('executive_reflections').insert({ user_id: session.user.id, brief_id: dailyBrief.id, question: dailyBrief.executive_question, response })
    setReflectionSaving(false)
    if (!error) { setReflectionResponse(''); setReflectionOpen(false); track('executive_reflection_saved', { brief_id: dailyBrief.id }) }
  }

  async function resolveDecision(item, status = 'decided') {
    if (!item?.id || String(item.id).startsWith('q')) return
    const { error } = await supabase.from('executive_decisions').update({ status, decided_at: new Date().toISOString(), decision: 'Resolved from Command Center' }).eq('id', item.id)
    if (!error) setDecisions(current => current.filter(decision => decision.id !== item.id))
  }

  function submitChief(e) {
    e.preventDefault(); const prompt = chiefPrompt.trim(); if (!prompt) return
    const identity = memory.mission || memory.annual_goal ? ` I am grounding this in your mission and current goals stored in Executive Memory.` : ''
    setChiefResponse(`Executive direction received: “${prompt}”.${identity} The live AI workflow is the next intelligence layer.`)
    setChiefPrompt(''); track('chief_of_staff_prompted', { prompt })
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
  const executiveQuestion = dailyBrief?.executive_question || (data.constraint === 'Leadership Multiplication' ? 'What are you still doing that someone else should own?' : 'What is the one decision only you can make today?')
  const briefPriorities = Array.isArray(dailyBrief?.priority_snapshot) && dailyBrief.priority_snapshot.length ? dailyBrief.priority_snapshot : active.slice(0, 3)
  const decisionItems = decisions.length ? decisions : [{ id: 'q1', title: 'Choose what to delegate this week', impact: 'high', urgency: 'high' }, { id: 'q2', title: 'Protect tomorrow’s strategy block', impact: 'medium', urgency: 'normal' }]
  const memoryProgress = Math.round(([memory.mission, memory.vision, memory.leadership_style, memory.annual_goal, memory.quarterly_focus, memory.definition_of_success].filter(Boolean).length / 6) * 100)

  const nav = (
  <ExecutiveSidebar
    activeView={activeView}
    mobileNav={mobileNav}
    onChangeView={changeView}
    onCloseMobileNav={() => setMobileNav(false)}
    onSignOut={() => supabase.auth.signOut()}
  />
);

  if (activeView === 'memory') return <div className="app-shell">{nav}<main>
    <button className="menu-button" onClick={() => setMobileNav(true)}><Menu/></button>
    <header className="command-header memory-header"><div><p className="eyebrow">EXECUTIVE MEMORY</p><h1>Your leadership intelligence.</h1><p className="muted">Teach AI Executive who you are, what you lead, and what matters most.</p></div><div className="memory-progress"><strong>{memoryProgress}%</strong><span>Memory profile complete</span><div><i style={{ width: `${memoryProgress}%` }}/></div></div></header>

    <section className="memory-hero">
      <div><BrainCircuit/><p className="eyebrow">SHARED INTELLIGENCE LAYER</p><h2>Every future recommendation begins here.</h2><p>Your Daily Brief, Chief of Staff, decisions, and AI Executive Team will use this context so you never have to begin from zero.</p></div>
      <span>{memoryItems.length} active memories</span>
    </section>

    <form onSubmit={saveMemory} className="memory-layout">
      <section className="panel memory-section">
        <PanelHeader eyebrow="EXECUTIVE IDENTITY" title="Who you are as a leader" action={<CircleUserRound className="gold-icon"/>}/>
        <div className="memory-form-grid">
          <div className="memory-field full"><label>Mission</label><textarea value={memory.mission || ''} onChange={e => setMemory({ ...memory, mission: e.target.value })} placeholder="Why do you lead and what are you here to create?"/></div>
          <div className="memory-field full"><label>Vision</label><textarea value={memory.vision || ''} onChange={e => setMemory({ ...memory, vision: e.target.value })} placeholder="What future are you building?"/></div>
          <div className="memory-field"><label>Leadership style</label><input value={memory.leadership_style || ''} onChange={e => setMemory({ ...memory, leadership_style: e.target.value })} placeholder="Visionary, Architect, Builder..."/></div>
          <div className="memory-field"><label>Decision style</label><input value={memory.decision_style || ''} onChange={e => setMemory({ ...memory, decision_style: e.target.value })} placeholder="Fast, collaborative, analytical..."/></div>
          <div className="memory-field full"><label>Leadership philosophy</label><textarea value={memory.leadership_philosophy || ''} onChange={e => setMemory({ ...memory, leadership_philosophy: e.target.value })} placeholder="How do you believe people and organizations should be led?"/></div>
          <TextListInput label="Core values" value={memory.core_values || []} onChange={value => setMemory({ ...memory, core_values: value })} placeholder="Add a value"/>
          <TextListInput label="Strengths" value={memory.strengths || []} onChange={value => setMemory({ ...memory, strengths: value })} placeholder="Add a strength"/>
          <TextListInput label="Blind spots" value={memory.blind_spots || []} onChange={value => setMemory({ ...memory, blind_spots: value })} placeholder="Add a blind spot"/>
        </div>
      </section>

      <section className="panel memory-section">
        <PanelHeader eyebrow="DIRECTION" title="What you are building" action={<Target className="gold-icon"/>}/>
        <div className="memory-form-grid">
          <div className="memory-field full"><label>Definition of success</label><textarea value={memory.definition_of_success || ''} onChange={e => setMemory({ ...memory, definition_of_success: e.target.value })} placeholder="What does a successful life and leadership season look like?"/></div>
          <div className="memory-field full"><label>Annual goal</label><textarea value={memory.annual_goal || ''} onChange={e => setMemory({ ...memory, annual_goal: e.target.value })} placeholder="Your most important outcome for the next 12 months"/></div>
          <div className="memory-field"><label>Quarterly focus</label><textarea value={memory.quarterly_focus || ''} onChange={e => setMemory({ ...memory, quarterly_focus: e.target.value })} placeholder="What must move this quarter?"/></div>
          <div className="memory-field"><label>Current constraint</label><textarea value={memory.current_constraint || ''} onChange={e => setMemory({ ...memory, current_constraint: e.target.value })} placeholder="What is limiting progress right now?"/></div>
          <div className="memory-field"><label>Communication style</label><input value={memory.communication_style || ''} onChange={e => setMemory({ ...memory, communication_style: e.target.value })} placeholder="Direct, thoughtful, concise..."/></div>
        </div>
      </section>

      <section className="panel memory-section full-width">
        <PanelHeader eyebrow="ORGANIZATIONAL CONTEXT" title="Companies and key relationships" action={<Building2 className="gold-icon"/>}/>
        <p className="memory-note">Add detailed companies, people, projects, commitments, and context below as individual memories. This structure lets the intelligence engine retrieve the exact context it needs.</p>
      </section>

      <section className="panel memory-section full-width">
        <PanelHeader eyebrow="MEMORY VAULT" title="Add a permanent memory" action={<BookOpen className="gold-icon"/>}/>
        <div className="memory-vault">
          <form onSubmit={addMemoryItem} className="memory-item-form">
            <div className="memory-field"><label>Category</label><select value={newMemory.category} onChange={e => setNewMemory({ ...newMemory, category: e.target.value })}><option value="context">Context</option><option value="company">Company</option><option value="relationship">Relationship</option><option value="goal">Goal</option><option value="preference">Preference</option><option value="decision">Decision</option><option value="lesson">Lesson</option><option value="commitment">Commitment</option><option value="identity">Identity</option></select></div>
            <div className="memory-field"><label>Importance</label><select value={newMemory.importance} onChange={e => setNewMemory({ ...newMemory, importance: e.target.value })}>{[5,4,3,2,1].map(v => <option key={v} value={v}>{v} — {v === 5 ? 'Critical' : v === 4 ? 'High' : v === 3 ? 'Standard' : 'Supporting'}</option>)}</select></div>
            <div className="memory-field full"><label>Memory title</label><input value={newMemory.title} onChange={e => setNewMemory({ ...newMemory, title: e.target.value })} placeholder="Example: Owners Club leadership role"/></div>
            <div className="memory-field full"><label>What should AI Executive remember?</label><textarea value={newMemory.content} onChange={e => setNewMemory({ ...newMemory, content: e.target.value })} placeholder="Add the people, responsibilities, preferences, goals, or context that should shape future intelligence." /></div>
            <button className="primary-memory-button">Add to memory <Plus size={17}/></button>
          </form>
          <div className="memory-item-list">
            {memoryItems.length === 0 && <div className="empty-memory"><BrainCircuit/><strong>Your memory vault is ready.</strong><p>Add the first piece of context your AI Chief of Staff should always know.</p></div>}
            {memoryItems.map(item => <article className="memory-item" key={item.id}><div className="memory-item-top"><span>{item.category}</span><small>Importance {item.importance}</small></div><strong>{item.title}</strong><p>{item.content}</p><button type="button" onClick={() => removeMemoryItem(item)}><Trash2 size={14}/> Remove</button></article>)}
          </div>
        </div>
      </section>

      <div className="memory-save-bar"><div>{memorySaved ? <><CheckCircle2/> Executive Memory saved.</> : <><Sparkles/> Changes become available to every intelligence engine.</>}</div><button type="submit" disabled={memorySaving}><Save size={17}/>{memorySaving ? 'Saving…' : 'Save Executive Memory'}</button></div>
    </form>
  </main></div>

  return <div className="app-shell">{nav}<main>
    <button className="menu-button" onClick={() => setMobileNav(true)}><Menu/></button>
    <header className="command-header"><div><p className="eyebrow">EXECUTIVE COMMAND CENTER</p><h1>Good morning, {firstName}.</h1><p className="muted">Here is what deserves your attention today.</p></div><div className="date-block"><strong>{dateLabel}</strong><span><Clock3 size={14}/> {timeLabel}</span></div></header>

    {!memory.onboarding_complete && <section className="memory-activation"><BrainCircuit/><div><p className="eyebrow">EXECUTIVE MEMORY</p><h3>Your intelligence is ready to become personal.</h3><p>Complete your leadership profile so every future brief and recommendation understands you.</p></div><button onClick={() => changeView('memory')}>Build my memory <ArrowRight size={16}/></button></section>}

    <section className="executive-question"><div className="question-icon"><Lightbulb/></div><div><p className="eyebrow">TODAY'S EXECUTIVE QUESTION</p><h2>{executiveQuestion}</h2></div><button onClick={() => setReflectionOpen(true)}>Reflect <ArrowRight size={16}/></button></section>

    <section className="command-grid top-grid">
      <article className="panel daily-brief"><PanelHeader eyebrow="DAILY EXECUTIVE BRIEF" title="Your five-minute briefing" action={<span className="brief-status"><Sparkles size={14}/> Updated now</span>}/><div className="mission-card"><span>Today's mission</span><h3>{dailyBrief?.mission || memory.quarterly_focus || `Advance ${data.constraint.toLowerCase()} without sacrificing strategic capacity.`}</h3></div><div className="brief-columns"><div><p className="section-label">THREE PRIORITIES</p>{(briefPriorities.length ? briefPriorities : [{ id: 'd1', title: 'Protect one strategic focus block' }, { id: 'd2', title: 'Resolve the highest-impact decision' }, { id: 'd3', title: 'Transfer one recurring responsibility' }]).map((item, index) => <div className="brief-line" key={item.id || index}><CheckCircle2 size={17}/><span>{item.title}</span></div>)}</div><div><p className="section-label">WATCH FOR</p><p className="brief-copy">{dailyBrief?.watch_for || memory.current_constraint || 'Operational urgency can consume the hours intended for leadership.'}</p></div></div><div className="ai-observation"><BrainCircuit size={18}/><div><strong>AI observation</strong><p>{dailyBrief?.observation || (memory.leadership_philosophy ? `Your stated leadership philosophy should guide today's highest-impact decision.` : 'Your next level will come from clearer ownership, not more personal effort.')}</p></div></div></article>
      <article className="panel decision-queue"><PanelHeader eyebrow="DECISION QUEUE" title="What needs your judgment" action={<span className="count-badge">{decisionItems.length} waiting</span>}/><div className="decision-list">{decisionItems.map((item, index) => <button className="decision-row" key={item.id} onClick={() => resolveDecision(item)}><span className={`priority-dot p${index + 1}`}/><div><strong>{item.title}</strong><small>{item.impact || 'Executive decision'}</small></div><ChevronRight size={17}/></button>)}</div></article>
    </section>

    <section className="command-grid middle-grid">
      <article className="panel capacity-panel"><PanelHeader eyebrow="EXECUTIVE CAPACITY" title="Leadership operating signal" action={<span className="trend"><TrendingUp size={14}/> +6 this week</span>}/><div className="capacity-layout"><div className="large-ring" style={{ '--score': `${data.capacity * 3.6}deg` }}><span>{data.capacity}<small>/100</small></span></div><div className="capacity-bars">{[['Focus', 89], ['Delegation', 67], ['Systems', 74], ['Decision quality', 91], ['Energy', 78]].map(([label, value]) => <div className="bar-row" key={label}><div><span>{label}</span><strong>{value}</strong></div><div className="bar"><i style={{ width: `${value}%` }}/></div></div>)}</div></div></article>
      <article className="panel intelligence-feed"><PanelHeader eyebrow="INTELLIGENCE FEED" title="Signals worth noticing" action={<BrainCircuit className="gold-icon"/>}/><div className="signal-list">{signals.slice(0, 3).map((signal, index) => <div className="signal" key={signal.title}><span className={`signal-icon ${signal.tone}`}>{index === 0 ? <ShieldAlert size={16}/> : <Activity size={16}/>}</span><div><strong>{signal.title}</strong><p>{signal.insight}</p></div></div>)}</div></article>
    </section>

    <section className="command-grid lower-grid">
      <article className="panel priorities-panel"><PanelHeader eyebrow="TOP PRIORITIES" title="What matters now" action={<span className="count-badge">{active.length} active</span>}/><form className="priority-form" onSubmit={addPriority}><input value={newPriority} onChange={e => setNewPriority(e.target.value)} placeholder="Add a high-leverage priority"/><button><Plus size={18}/></button></form><div className="priority-list">{active.map(item => <button className="priority" key={item.id} onClick={() => completePriority(item)}><span className="check"/><div><strong>{item.title}</strong><small>Executive priority</small></div><ChevronRight size={17}/></button>)}{completed.slice(0,1).map(item => <div className="priority done" key={item.id}><CheckCircle2/><div><strong>{item.title}</strong><small>Completed</small></div></div>)}</div></article>
      <article className="panel chief-panel"><PanelHeader eyebrow="AI CHIEF OF STAFF" title="Give executive direction" action={<Sparkles className="gold-icon"/>}/><p className="chief-copy">Ask for preparation, synthesis, planning, or a decision brief.</p><div className="prompt-chips">{['Prepare me for today', 'Review my priorities', 'Draft my CEO update'].map(text => <button key={text} onClick={() => setChiefPrompt(text)}>{text}</button>)}</div><form className="chief-form" onSubmit={submitChief}><textarea value={chiefPrompt} onChange={e => setChiefPrompt(e.target.value)} placeholder="What should your AI Chief of Staff handle?"/><button>Send direction <ArrowRight size={16}/></button></form>{chiefResponse && <div className="chief-response"><Sparkles size={16}/><p>{chiefResponse}</p></div>}</article>
    </section>

    <section className="panel timeline-panel"><PanelHeader eyebrow="EXECUTIVE TIMELINE" title="Today’s intelligence activity" action={<span className="live-label"><span/> Live</span>}/><div className="timeline">{fallbackTimeline.map(item => <div className="timeline-item" key={item.time}><time>{item.time}</time><span className="timeline-node"/><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div></section>
    {reflectionOpen && <div className="modal-backdrop" onClick={() => setReflectionOpen(false)}><section className="reflection-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setReflectionOpen(false)}><X/></button><p className="eyebrow">EXECUTIVE REFLECTION</p><h2>{executiveQuestion}</h2><p className="muted">Your response becomes part of your Executive Memory.</p><form onSubmit={saveReflection}><textarea value={reflectionResponse} onChange={e => setReflectionResponse(e.target.value)} autoFocus/><button disabled={reflectionSaving}>{reflectionSaving ? 'Saving…' : 'Save reflection'} <ArrowRight size={16}/></button></form></section></div>}
  </main></div>
}
