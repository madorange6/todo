'use client'

import { useEffect, useMemo, useState } from 'react'

// ── Types ──────────────────────────────────────────────
type Category   = 'work' | 'personal'
type Importance = 'must' | 'optional' | 'focus'
type Difficulty = 'easy' | 'normal' | 'hard'

type Todo = {
  id:         string
  text:       string
  done:       boolean
  date:       string
  category:   Category
  importance: Importance
  difficulty: Difficulty
  memo:       string
}

// ── Storage keys ───────────────────────────────────────
const S_TODOS = 'mood-routine-todos'
const S_MOOD  = 'yy-mood'
const S_DROPS = 'yy-drops'

// ── Config ─────────────────────────────────────────────
const IMP_CFG: Record<Importance, { label: string; color: string; bg: string; ring: string }> = {
  must:     { label: 'MUST',     color: 'text-rose-500', bg: 'bg-rose-50',  ring: 'ring-rose-300'  },
  focus:    { label: 'FOCUS',    color: 'text-blue-500', bg: 'bg-blue-50',  ring: 'ring-blue-300'  },
  optional: { label: 'OPTIONAL', color: 'text-zinc-400', bg: 'bg-zinc-50',  ring: 'ring-zinc-200'  },
}

const DIFF_CFG: Record<Difficulty, { label: string; reward: string; mini: number; drop: number }> = {
  easy:   { label: '쉬움',   reward: '💧×1',  mini: 1, drop: 0 },
  normal: { label: '보통',   reward: '💧×5',  mini: 5, drop: 0 },
  hard:   { label: '어려움', reward: '🫧×1',  mini: 0, drop: 1 },
}

const IMP_ORDER: Record<Importance, number> = { must: 0, focus: 1, optional: 2 }

// ── Helpers ────────────────────────────────────────────
function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function fmtKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function normalizeTodo(raw: Record<string, unknown>): Todo {
  return {
    id:         typeof raw.id         === 'string'  ? raw.id         : makeId(),
    text:       typeof raw.text       === 'string'  ? raw.text       : '',
    done:       Boolean(raw.done),
    date:       typeof raw.date       === 'string'  ? raw.date       : fmtKey(new Date()),
    category:   raw.category          === 'personal' ? 'personal'    : 'work',
    importance: ['must','optional','focus'].includes(raw.importance as string) ? raw.importance as Importance : 'must',
    difficulty: ['easy','normal','hard'].includes(raw.difficulty as string)    ? raw.difficulty as Difficulty : 'normal',
    memo:       typeof raw.memo       === 'string'  ? raw.memo       : '',
  }
}

// ── Component ─────────────────────────────────────────
export default function TodoPage() {
  const today    = new Date()
  const todayKey = fmtKey(today)

  const [mounted,       setMounted]       = useState(false)
  const [todos,         setTodos]         = useState<Todo[]>([])
  const [category,      setCategory]      = useState<Category>('work')
  const [mood,          setMood]          = useState(2)
  const [showForm,      setShowForm]      = useState(false)
  const [addText,       setAddText]       = useState('')
  const [addImportance, setAddImportance] = useState<Importance>('must')
  const [addDifficulty, setAddDifficulty] = useState<Difficulty>('normal')

  // ── Load ──────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)

    const savedTodos = localStorage.getItem(S_TODOS)
    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos)
        setTodos(Array.isArray(parsed) ? parsed.map(normalizeTodo) : [])
      } catch {}
    }

    const savedMood = localStorage.getItem(S_MOOD)
    if (savedMood) {
      try {
        const p = JSON.parse(savedMood)
        if (p.date === todayKey) setMood(p.value ?? 2)
      } catch {}
    }
  }, [])

  // ── Persist ───────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(S_TODOS, JSON.stringify(todos))
  }, [todos, mounted])

  // ── Handlers ──────────────────────────────────────────
  function addTodo() {
    if (!addText.trim()) return
    const newTodo: Todo = {
      id:         makeId(),
      text:       addText.trim(),
      done:       false,
      date:       todayKey,
      category,
      importance: addImportance,
      difficulty: addDifficulty,
      memo:       '',
    }
    setTodos(prev => [newTodo, ...prev])
    setAddText('')
    setShowForm(false)
  }

  function toggleTodo(id: string) {
    setTodos(prev => {
      const todo = prev.find(t => t.id === id)
      if (!todo) return prev

      // Give drops when completing
      if (!todo.done) {
        const savedDrops = localStorage.getItem(S_DROPS)
        let d = { mini: 0, drops: 0, big: 0 }
        if (savedDrops) {
          try { d = JSON.parse(savedDrops) } catch {}
        }
        const cfg = DIFF_CFG[todo.difficulty]
        d.mini  += cfg.mini
        d.drops += cfg.drop
        while (d.mini  >= 10) { d.mini  -= 10; d.drops += 1 }
        while (d.drops >= 10) { d.drops -= 10; d.big   += 1 }
        localStorage.setItem(S_DROPS, JSON.stringify(d))
      }

      return prev.map(t => t.id === id ? { ...t, done: !t.done } : t)
    })
  }

  // ── Derived ───────────────────────────────────────────
  const isLowMood  = mood <= 1
  const todayItems = useMemo(() => {
    const filtered = todos.filter(t => t.date === todayKey && t.category === category)
    const undone   = filtered.filter(t => !t.done).sort((a, b) => IMP_ORDER[a.importance] - IMP_ORDER[b.importance])
    const done     = filtered.filter(t => t.done)
    return [...undone, ...done]
  }, [todos, todayKey, category])

  if (!mounted) return null

  // ── Render ────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg min-h-screen">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-lg font-bold text-zinc-800">투두</h1>
        <button
          onClick={() => setShowForm(o => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white text-2xl font-light shadow-md active:bg-violet-600"
        >
          +
        </button>
      </div>

      {/* ─── Category tabs ─── */}
      <div className="flex gap-2 px-5 mb-4">
        {(['work', 'personal'] as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              category === cat
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'bg-white text-zinc-500 border border-zinc-200'
            }`}
          >
            {cat === 'work' ? '💼 Work' : '🏠 Personal'}
          </button>
        ))}
      </div>

      {/* ─── Low mood banner ─── */}
      {isLowMood && (
        <div className="mx-5 mb-3 rounded-2xl bg-sky-50 border border-sky-100 px-4 py-2.5 flex items-center gap-2">
          <span>🪫</span>
          <p className="text-xs text-sky-700">오늘은 MUST만 해도 충분해. 수고했어.</p>
        </div>
      )}

      {/* ─── Add form ─── */}
      {showForm && (
        <div className="mx-5 mb-4 rounded-2xl bg-white border border-zinc-200 p-4 shadow-sm">
          <input
            type="text"
            value={addText}
            onChange={e => setAddText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            placeholder="할 일 입력..."
            autoFocus
            className="w-full rounded-xl bg-zinc-50 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-400 mb-3"
          />

          {/* Importance */}
          <p className="text-[10px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">중요도</p>
          <div className="flex gap-1.5 mb-3">
            {(['must', 'focus', 'optional'] as Importance[]).map(imp => {
              const cfg = IMP_CFG[imp]
              return (
                <button
                  key={imp}
                  onClick={() => setAddImportance(imp)}
                  className={`flex-1 rounded-xl py-1.5 text-xs font-bold ring-1 transition ${
                    addImportance === imp
                      ? `${cfg.bg} ${cfg.color} ${cfg.ring}`
                      : 'bg-white text-zinc-400 ring-zinc-200'
                  }`}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>

          {/* Difficulty */}
          <p className="text-[10px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">난이도</p>
          <div className="flex gap-1.5 mb-4">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map(diff => {
              const cfg = DIFF_CFG[diff]
              return (
                <button
                  key={diff}
                  onClick={() => setAddDifficulty(diff)}
                  className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 ring-1 transition ${
                    addDifficulty === diff
                      ? 'bg-sky-50 text-sky-600 ring-sky-300'
                      : 'bg-white text-zinc-400 ring-zinc-200'
                  }`}
                >
                  <span className="text-xs font-medium">{cfg.label}</span>
                  <span className="text-[10px] text-zinc-400">{cfg.reward}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={addTodo}
            className="w-full rounded-xl bg-violet-500 py-2.5 text-sm font-bold text-white active:bg-violet-600"
          >
            추가
          </button>
        </div>
      )}

      {/* ─── Todo list ─── */}
      <div className="px-5 flex flex-col gap-2 pb-4">
        {todayItems.length === 0 && (
          <div className="py-12 text-center text-sm text-zinc-400">
            <div className="text-4xl mb-2">🐉</div>
            할 일이 없어요. + 버튼으로 추가해봐요!
          </div>
        )}

        {todayItems.map(todo => {
          const imp    = IMP_CFG[todo.importance]
          const diff   = DIFF_CFG[todo.difficulty]
          const dimmed = isLowMood && !todo.done && todo.importance !== 'must'

          return (
            <div
              key={todo.id}
              className={`flex items-start gap-3 rounded-2xl bg-white border p-3.5 transition ${
                todo.done ? 'border-zinc-100 opacity-40' : 'border-zinc-200'
              } ${dimmed ? 'opacity-30' : ''}`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition ${
                  todo.done
                    ? 'bg-violet-400 border-violet-400'
                    : 'border-zinc-300 hover:border-violet-300'
                }`}
              >
                {todo.done && <span className="text-[10px] text-white font-bold">✓</span>}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${
                  todo.done ? 'line-through text-zinc-400' : 'text-zinc-800'
                }`}>
                  {todo.text}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-bold ${imp.color}`}>{imp.label}</span>
                  <span className="text-zinc-200">·</span>
                  <span className="text-[10px] text-zinc-400">{diff.label}</span>
                  <span className="text-zinc-200">·</span>
                  <span className="text-[10px] text-sky-400 font-medium">{diff.reward}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
