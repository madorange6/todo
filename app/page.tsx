'use client'

import { useEffect, useMemo, useState } from 'react'

// ── Types ──────────────────────────────────────────────
type MoodValue = 0 | 1 | 2 | 3 | 4
type TimeSlot = 'morning' | 'afternoon' | 'evening'
type Drops = { mini: number; drops: number; big: number }
type AttendRecord = Record<string, TimeSlot[]>

// ── Storage keys ───────────────────────────────────────
const S_MOOD    = 'yy-mood'
const S_ATTEND  = 'yy-attend'
const S_DROPS   = 'yy-drops'
const S_WEATHER = 'yy-weather'
const S_STREAK  = 'yy-streak'
const S_TODOS   = 'mood-routine-todos'

// ── Constants ──────────────────────────────────────────
const MOODS = [
  { emoji: '🪫', label: '바닥',   ring: 'ring-zinc-300',   bg: 'bg-zinc-100'   },
  { emoji: '😞', label: '안좋음', ring: 'ring-sky-300',    bg: 'bg-sky-50'     },
  { emoji: '😐', label: '보통',   ring: 'ring-amber-300',  bg: 'bg-amber-50'   },
  { emoji: '😊', label: '좋음',   ring: 'ring-green-300',  bg: 'bg-green-50'   },
  { emoji: '🔥', label: '개좋음', ring: 'ring-violet-400', bg: 'bg-violet-50'  },
]

const YONGYONG_FACE = ['😴', '😔', '🐲', '🐉', '🌟']

const WEATHER_OPTS = ['☀️', '🌤️', '⛅', '☁️', '🌧️', '🌩️', '❄️', '🌫️']

const ATTEND_MSGS = [
  '오늘도 왔네~? 대단해! 미니물방울 +1 💧',
  '밍! 용용이 보러 왔구나~ 미니물방울 획득 💧',
  '어서와~ 오늘도 화이팅! 미니물방울 +1 💧',
  '왔다! 용용이가 기다리고 있었어~ 💧',
  '짝짝짝! 미니물방울 하나 드립니다 💧',
  '어머 왔어~ 오늘도 잘할 수 있어! 💧',
  '넌 할 수 있어! 오늘도 미니물방울 +1 💧',
]

const DAY_KR = ['日', '月', '火', '水', '木', '金', '土']

const SLOT_LABEL: Record<TimeSlot, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
}

// ── Helpers ────────────────────────────────────────────
function fmtKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getSlot(h: number): TimeSlot | null {
  if (h >= 6  && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18)           return 'evening'
  return null
}

function randMsg() {
  return ATTEND_MSGS[Math.floor(Math.random() * ATTEND_MSGS.length)]
}

function isYesterday(dateStr: string, today: string) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return fmtKey(d) === today
}

// ── Component ─────────────────────────────────────────
export default function HomePage() {
  const today    = new Date()
  const todayKey = fmtKey(today)
  const todayLabel = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일 ${DAY_KR[today.getDay()]}`

  const [mounted,      setMounted]      = useState(false)
  const [mood,         setMood]         = useState<MoodValue>(2)
  const [attend,       setAttend]       = useState<AttendRecord>({})
  const [drops,        setDrops]        = useState<Drops>({ mini: 0, drops: 0, big: 0 })
  const [weather,      setWeather]      = useState('☀️')
  const [weatherOpen,  setWeatherOpen]  = useState(false)
  const [streak,       setStreak]       = useState(1)
  const [todayTodos,   setTodayTodos]   = useState({ total: 0, done: 0 })
  const [popupVisible, setPopupVisible] = useState(false)
  const [popupMsg,     setPopupMsg]     = useState('')
  const [popupSlot,    setPopupSlot]    = useState<TimeSlot | null>(null)

  // ── Load ──────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)

    // Mood
    const savedMood = localStorage.getItem(S_MOOD)
    if (savedMood) {
      try {
        const p = JSON.parse(savedMood)
        if (p.date === todayKey) setMood(p.value as MoodValue)
      } catch {}
    }

    // Attendance
    let attendData: AttendRecord = {}
    const savedAttend = localStorage.getItem(S_ATTEND)
    if (savedAttend) {
      try { attendData = JSON.parse(savedAttend) } catch {}
    }
    setAttend(attendData)

    // Drops
    const savedDrops = localStorage.getItem(S_DROPS)
    if (savedDrops) {
      try { setDrops(JSON.parse(savedDrops)) } catch {}
    }

    // Weather
    const savedWeather = localStorage.getItem(S_WEATHER)
    if (savedWeather) {
      try {
        const p = JSON.parse(savedWeather)
        if (p.date === todayKey) setWeather(p.emoji)
      } catch {}
    }

    // Streak
    let streakCount = 1
    const savedStreak = localStorage.getItem(S_STREAK)
    if (savedStreak) {
      try {
        const p = JSON.parse(savedStreak)
        if (p.lastDate === todayKey)              streakCount = p.count
        else if (isYesterday(p.lastDate, todayKey)) streakCount = p.count + 1
        else                                       streakCount = 1
      } catch {}
    }
    setStreak(streakCount)
    localStorage.setItem(S_STREAK, JSON.stringify({ lastDate: todayKey, count: streakCount }))

    // Today todos count
    const savedTodos = localStorage.getItem(S_TODOS)
    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos)
        if (Array.isArray(parsed)) {
          const items = parsed.filter((t: Record<string, unknown>) => t.date === todayKey)
          setTodayTodos({
            total: items.length,
            done:  items.filter((t: Record<string, unknown>) => Boolean(t.done)).length,
          })
        }
      } catch {}
    }

    // Attendance popup
    const slot = getSlot(today.getHours())
    if (slot && !(attendData[todayKey] ?? []).includes(slot)) {
      setPopupSlot(slot)
      setPopupMsg(randMsg())
      setTimeout(() => setPopupVisible(true), 600)
    }
  }, [])

  // ── Persist ───────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(S_MOOD, JSON.stringify({ date: todayKey, value: mood }))
  }, [mood, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(S_WEATHER, JSON.stringify({ date: todayKey, emoji: weather }))
  }, [weather, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(S_DROPS, JSON.stringify(drops))
  }, [drops, mounted])

  // ── Handlers ──────────────────────────────────────────
  function handleAttend() {
    if (!popupSlot) return
    const next = { ...attend }
    if (!next[todayKey]) next[todayKey] = []
    if (!next[todayKey].includes(popupSlot)) {
      next[todayKey] = [...next[todayKey], popupSlot]
    }
    setAttend(next)
    localStorage.setItem(S_ATTEND, JSON.stringify(next))
    setDrops(prev => {
      const d = { ...prev, mini: prev.mini + 1 }
      while (d.mini  >= 10) { d.mini  -= 10; d.drops += 1 }
      while (d.drops >= 10) { d.drops -= 10; d.big   += 1 }
      return d
    })
    setPopupVisible(false)
  }

  // ── Derived ───────────────────────────────────────────
  const todayAttend = attend[todayKey] ?? []
  const moodInfo    = MOODS[mood]

  const dropCircles = useMemo(() => {
    const total = Math.min(todayTodos.total, 10)
    return Array.from({ length: total }, (_, i) => i < todayTodos.done)
  }, [todayTodos])

  if (!mounted) return null

  // ── Render ────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg min-h-screen">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">오늘</p>
          <p className="text-sm font-bold text-zinc-800">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Streak */}
          <div className="flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1">
            <span className="text-sm leading-none">💧</span>
            <span className="text-xs font-bold text-sky-600">{streak}</span>
          </div>
          {/* Weather picker */}
          <div className="relative">
            <button
              onClick={() => setWeatherOpen(o => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-lg transition hover:bg-zinc-200"
            >
              {weather}
            </button>
            {weatherOpen && (
              <div className="absolute right-0 top-10 z-10 flex flex-wrap w-40 gap-1.5 rounded-2xl bg-white p-2.5 shadow-xl border border-zinc-100">
                {WEATHER_OPTS.map(e => (
                  <button
                    key={e}
                    onClick={() => { setWeather(e); setWeatherOpen(false) }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl transition ${
                      weather === e ? 'bg-violet-100' : 'hover:bg-zinc-50'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Yongyong ─── */}
      <div className={`mx-5 mb-4 rounded-3xl ${moodInfo.bg} flex flex-col items-center justify-center py-10`}>
        <div className="text-8xl mb-2 leading-none select-none">
          {YONGYONG_FACE[mood]}
        </div>
        <p className="text-xs font-medium text-zinc-400">용용이</p>
        <p className="text-[10px] text-zinc-400 mt-0.5">(캐릭터 준비 중)</p>
      </div>

      {/* ─── Mood selector ─── */}
      <div className="px-5 mb-4">
        <p className="text-xs font-semibold text-zinc-500 mb-2">오늘 기분</p>
        <div className="flex gap-1.5">
          {MOODS.map((m, i) => (
            <button
              key={i}
              onClick={() => setMood(i as MoodValue)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2.5 ring-2 transition ${
                mood === i
                  ? `${m.bg} ${m.ring}`
                  : 'bg-white ring-transparent hover:bg-zinc-50'
              }`}
            >
              <span className="text-xl leading-none">{m.emoji}</span>
              <span className="text-[10px] font-medium text-zinc-600">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Waterdrop progress ─── */}
      <div className="mx-5 mb-4 rounded-3xl bg-white border border-zinc-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-zinc-500">오늘 할 일</p>
          <span className="text-xs text-zinc-400">{todayTodos.done} / {todayTodos.total}</span>
        </div>
        {todayTodos.total === 0 ? (
          <p className="py-2 text-center text-xs text-zinc-400">
            투두 탭에서 할 일을 추가해봐요
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dropCircles.map((done, i) => (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition-colors ${
                  done ? 'bg-sky-400' : 'bg-sky-100'
                }`}
              >
                💧
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Drops counter ─── */}
      <div className="mx-5 mb-4 rounded-3xl bg-white border border-zinc-100 p-4">
        <p className="text-xs font-semibold text-zinc-500 mb-3">물방울 현황</p>
        <div className="flex justify-around">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">💧</span>
            <span className="text-lg font-bold text-sky-500">{drops.mini}</span>
            <span className="text-[10px] text-zinc-400">미니물방울</span>
          </div>
          <div className="w-px bg-zinc-100" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🫧</span>
            <span className="text-lg font-bold text-sky-500">{drops.drops}</span>
            <span className="text-[10px] text-zinc-400">물방울</span>
          </div>
          <div className="w-px bg-zinc-100" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🌊</span>
            <span className="text-lg font-bold text-sky-600">{drops.big}</span>
            <span className="text-[10px] text-zinc-400">큰물방울</span>
            <span className="text-[9px] text-zinc-300">= {drops.big * 1000}원</span>
          </div>
        </div>
      </div>

      {/* ─── Attendance card ─── */}
      <div className="mx-5 mb-4 rounded-3xl bg-white border border-zinc-100 p-4">
        <p className="text-xs font-semibold text-zinc-500 mb-3">오늘 출석</p>
        <div className="flex justify-around">
          {(['morning', 'afternoon', 'evening'] as TimeSlot[]).map(slot => {
            const checked = todayAttend.includes(slot)
            return (
              <div key={slot} className="flex flex-col items-center gap-1.5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-colors ${
                  checked ? 'bg-sky-400' : 'bg-zinc-100'
                }`}>
                  {checked ? '💧' : '○'}
                </div>
                <span className="text-[10px] text-zinc-400">{SLOT_LABEL[slot]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Attendance popup ─── */}
      {popupVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
          onClick={() => setPopupVisible(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-3 text-5xl">🐉</div>
            <p className="mb-1 text-sm font-bold text-zinc-800">
              {popupSlot ? SLOT_LABEL[popupSlot] : ''} 출석!
            </p>
            <p className="mb-5 text-sm text-zinc-500 leading-relaxed">{popupMsg}</p>
            <button
              onClick={handleAttend}
              className="w-full rounded-2xl bg-violet-500 py-3 text-sm font-bold text-white active:bg-violet-600"
            >
              받기 💧
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
