import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function login(e) {
    e.preventDefault()
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const res = await fetch(`${BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    if (!res.ok) {
      alert('Login failed')
      return
    }
    const data = await res.json()
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
  }

  async function register(e) {
    e.preventDefault()
    const res = await fetch(`${BACKEND}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (data.access_token) {
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)
    } else {
      alert(data.detail || 'Registration failed')
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setToken('')
  }

  return { token, email, password, setEmail, setPassword, login, register, logout }
}

function VoiceCard({ v, onPreview, onFav, favorites }) {
  const fav = favorites.includes(v.key)
  return (
    <div className="p-4 rounded-xl border bg-white/70 backdrop-blur shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-800">{v.name}</div>
          <div className="text-xs text-slate-500">{v.language}{v.accent ? ` • ${v.accent}` : ''}</div>
        </div>
        <button onClick={() => onFav(v.key, !fav)} className={`text-sm px-3 py-1 rounded-full ${fav ? 'bg-yellow-500 text-white' : 'bg-slate-200 text-slate-700'}`}>{fav ? '★' : '☆'} Favorite</button>
      </div>
      <div className="text-xs text-slate-500">{v.tags?.join(', ')}</div>
      <div className="flex gap-2">
        <button onClick={() => onPreview(v)} className="px-3 py-1 rounded-md bg-indigo-600 text-white text-sm">Preview</button>
      </div>
    </div>
  )
}

export default function App() {
  const { token, email, password, setEmail, setPassword, login, register, logout } = useAuth()
  const [voices, setVoices] = useState([])
  const [favorites, setFavorites] = useState([])
  const [snippet, setSnippet] = useState('Hello, this is a preview of my voice!')
  const [audioUrl, setAudioUrl] = useState('')

  useEffect(() => {
    fetch(`${BACKEND}/voices`).then(r => r.json()).then(setVoices)
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${BACKEND}/favorites`, { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.json()).then(setFavorites)
  }, [token])

  async function preview(v) {
    if (!token) {
      alert('Please login to preview')
      return
    }
    const res = await fetch(`${BACKEND}/tts/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ voice_key: v.key, text: snippet, format: 'wav' })
    })
    const data = await res.json()
    setAudioUrl(`${BACKEND}${data.url}`)
  }

  async function setFavorite(voice_key, favorite) {
    if (!token) {
      alert('Login first')
      return
    }
    await fetch(`${BACKEND}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ voice_key, favorite })
    })
    const favs = await fetch(`${BACKEND}/favorites`, { headers: { Authorization: `Bearer ${token}` }}).then(r => r.json())
    setFavorites(favs)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1020] to-[#0b1226] text-white">
      <div className="relative h-[55vh] w-full">
        <Spline scene="https://prod.spline.design/4cHQr84zOGAHOehh/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#0f1020]/30 to-[#0f1020]"></div>
        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-3 px-6">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-center">Studio-grade Text‑to‑Speech</h1>
          <p className="text-slate-300 text-center max-w-2xl">Preview pristine voices, synthesize longform audio with SSML, and manage projects — all in one secure workspace.</p>
          {!token ? (
            <form onSubmit={login} className="flex flex-col sm:flex-row gap-2 w-full max-w-xl mt-2">
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="flex-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 outline-none" />
              <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="flex-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 outline-none" />
              <button className="px-4 py-2 rounded-md bg-indigo-500">Login</button>
              <button type="button" onClick={register} className="px-4 py-2 rounded-md bg-slate-600">Sign up</button>
            </form>
          ) : (
            <div className="flex items-center gap-3 mt-2">
              <button onClick={logout} className="px-3 py-1 rounded-md bg-slate-700">Logout</button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm text-slate-300 mb-1">Preview text</div>
            <textarea value={snippet} onChange={e=>setSnippet(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-md bg-black/20 border border-white/10 outline-none" />
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {voices.map(v => (
              <VoiceCard key={v.key} v={v} onPreview={preview} onFav={setFavorite} favorites={favorites} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="font-medium mb-2">Now Playing</div>
            {audioUrl ? (
              <audio src={audioUrl} controls className="w-full" />
            ) : (
              <div className="text-sm text-slate-400">Hit Preview on any voice to listen instantly.</div>
            )}
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">
            <div className="font-semibold text-white mb-1">Developer guide</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fetch voices: GET /voices</li>
              <li>Preview audio: POST /tts/preview</li>
              <li>Full synth: POST /tts/synthesize</li>
              <li>Clone voice: POST /voices/clone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
