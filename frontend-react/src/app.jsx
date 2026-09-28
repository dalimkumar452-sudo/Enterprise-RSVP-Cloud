import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  
  const [events, setEvents] = useState([])
  const [eventName, setEventName] = useState('')
  const [capacity, setCapacity] = useState(50)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState('')

  useEffect(() => {
    const savedUser = localStorage.getItem('cloud_event_user')
    if (savedUser) {
      setSession(JSON.parse(savedUser))
    }
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    if (!error) {
      if (!data || data.length === 0) {
        loadDefaultEvents()
      } else {
        setEvents(data)
      }
    }
  }

  const loadDefaultEvents = async () => {
    const defaultEvents = [
      { name: 'Global Cloud Computing & DevOps Summit 2026', capacity: 120, going_count: 45 },
      { name: 'Enterprise AI & Machine Learning Masterclass', capacity: 80, going_count: 78 },
      { name: 'Full-Stack Serverless Architecture Workshop', capacity: 60, going_count: 30 },
      { name: 'Blockchain Security & Smart Contract Bootcamp', capacity: 50, going_count: 20 }
    ]
    await supabase.from('events').insert(defaultEvents)
    fetchEvents()
    showNotification('✨ Professional events loaded successfully!')
  }

  const clearAndReloadEvents = async () => {
    setLoading(true)
    await supabase.from('events').delete().neq('event_id', '00000000-0000-0000-0000-000000000000')
    await loadDefaultEvents()
    setLoading(false)
  }

  const deleteEvent = async (eventId) => {
    const { error } = await supabase.from('events').delete().eq('event_id', eventId)
    if (error) {
      console.error("Delete error:", error)
      showNotification('⚠️ Delete failed: ' + error.message)
    } else {
      fetchEvents()
      showNotification('🗑️ Event deleted successfully.')
    }
  }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 4000)
  }

  const handleAuth = (e) => {
    e.preventDefault()
    if (!email || !password) return

    if (authMode === 'register' && !name) {
      showNotification('⚠️ Please enter your full name.')
      return
    }

    const userData = { email, name: name || email.split('@')[0] }
    setSession(userData)
    localStorage.setItem('cloud_event_user', JSON.stringify(userData))
    showNotification(`🎉 Welcome back, ${userData.name}!`)
  }

  const handleLogout = () => {
    setSession(null)
    localStorage.removeItem('cloud_event_user')
    showNotification('🔒 Logged out successfully.')
  }

  const createEvent = async (e) => {
    e.preventDefault()
    if (!eventName) return
    setLoading(true)

    const { error } = await supabase.from('events').insert([
      { name: eventName, capacity: parseInt(capacity), going_count: 0 }
    ])

    if (!error) {
      setEventName('')
      setCapacity(50)
      fetchEvents()
      showNotification('✨ Professional event published successfully!')
    }
    setLoading(false)
  }

  const handleRSVP = async (event, status) => {
    if (!session) {
      showNotification('⚠️ Please log in to RSVP.')
      return
    }

    const userId = session.email

    const { data: existing } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', event.event_id)
      .eq('user_id', userId)
      .single()

    let finalStatus = status
    if (status === 'GOING' && event.going_count >= event.capacity && (!existing || existing.status !== 'GOING')) {
      finalStatus = 'WAITLISTED'
    }

    if (existing) {
      await supabase
        .from('rsvps')
        .update({ status: finalStatus })
        .eq('rsvp_id', existing.rsvp_id)
    } else {
      await supabase.from('rsvps').insert([
        { event_id: event.event_id, user_id: userId, status: finalStatus }
      ])
    }

    if (finalStatus === 'GOING' && (!existing || existing.status !== 'GOING')) {
      await supabase
        .from('events')
        .update({ going_count: event.going_count + 1 })
        .eq('event_id', event.event_id)
    } else if (existing && existing.status === 'GOING' && finalStatus !== 'GOING') {
      await supabase
        .from('events')
        .update({ going_count: Math.max(0, event.going_count - 1) })
        .eq('event_id', event.event_id)
    }

    fetchEvents()
    showNotification(`🚀 RSVP status recorded: ${finalStatus}`)
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: '20px' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>Cloud Event Portal</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{authMode === 'login' ? 'Sign in to manage & RSVP events' : 'Create your account to get started'}</p>
          </div>

          {notification && (
            <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', border: '1px solid #fca5a5' }}>
              {notification}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'grid', gap: '16px' }}>
            {authMode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="Dalim Kumar" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Email Address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>

            <button 
              type="submit"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>
          </div>

        </div>
      </div>
    )
  }

  const filteredEvents = events.filter(ev => ev.name.toLowerCase().includes(searchTerm.toLowerCase()))
  const totalCapacity = events.reduce((acc, curr) => acc + curr.capacity, 0)
  const totalGoing = events.reduce((acc, curr) => acc + curr.going_count, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', fontFamily: 'Inter, system-ui, sans-serif', padding: '30px 20px', color: '#1e293b' }}>
      
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {notification && (
          <div style={{ background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{notification}</span>
          </div>
        )}

        <header style={{ background: 'linear-gradient(90deg, #4f46e5 0%, #9333ea 100%)', color: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>⚡ Cloud Event & RSVP Hub</h1>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '15px' }}>Welcome back, <b>{session.name}</b> ({session.email})</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={clearAndReloadEvents}
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '8px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              🔄 Reset Events
            </button>
            <button 
              onClick={handleLogout}
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              🔒 Sign Out
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: '5px solid #4f46e5' }}>
            <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>TOTAL EVENTS</p>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{events.length}</h2>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: '5px solid #10b981' }}>
            <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>CONFIRMED GOING</p>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{totalGoing}</h2>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderLeft: '5px solid #f59e0b' }}>
            <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>GLOBAL CAPACITY</p>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>{totalCapacity}</h2>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.03)', marginBottom: '35px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#0f172a' }}>✨ Host a Professional Cloud Event</h3>
          <form onSubmit={createEvent} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Event Title (e.g. Enterprise DevOps Workshop)" 
              value={eventName} 
              onChange={(e) => setEventName(e.target.value)} 
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#f8fafc' }}
              required
            />
            <input 
              type="number" 
              placeholder="Max Capacity" 
              value={capacity} 
              onChange={(e) => setCapacity(e.target.value)} 
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#f8fafc' }}
              min="1"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: '#0f172a' }}>📅 Professional Event Streams</h2>
          <input 
            type="text" 
            placeholder="🔍 Search events..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '240px', fontSize: '14px', outline: 'none', background: '#fff' }}
          />
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {filteredEvents.map((ev) => {
            const isFull = ev.going_count >= ev.capacity;
            const percentage = Math.min(100, Math.round((ev.going_count / ev.capacity) * 100));

            return (
              <div key={ev.event_id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative' }}>
                
                <button 
                  onClick={() => deleteEvent(ev.event_id)}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  🗑️ Delete
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', paddingRight: '70px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{ev.name}</h3>
                    <span style={{ background: isFull ? '#fee2e2' : '#dcfce7', color: isFull ? '#991b1b' : '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                      {isFull ? '🔴 CAPACITY FULL (Waitlist Active)' : '🟢 REGISTRATION OPEN'}
                    </span>
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#334155' }}>{ev.going_count} / {ev.capacity}</span>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Seats Filled</div>
                  </div>
                </div>

                <div style={{ width: '100%', background: '#f1f5f9', height: '10px', borderRadius: '6px', margin: '15px 0', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: `${percentage}%`, background: isFull ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #4f46e5, #6366f1)', height: '100%', borderRadius: '6px' }}></div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
                  <button onClick={() => handleRSVP(ev, 'GOING')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>✅ Going</button>
                  <button onClick={() => handleRSVP(ev, 'MAYBE')} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>🤔 Maybe</button>
                  <button onClick={() => handleRSVP(ev, 'NOT_GOING')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>❌ Not Going</button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  )
}