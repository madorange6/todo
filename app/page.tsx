'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type TodoCategory = 'work' | 'personal'

type Subtask = {
  id: string
  text: string
  done: boolean
}

type Todo = {
  id: string
  text: string
  done: boolean
  date: string
  category: TodoCategory
  memo: string
  subtasks: Subtask[]
  expanded: boolean
}

type PaletteColor = {
  id: string
  name: string
  value: string
}

type Routine = {
  id: string
  name: string
  colorId: string
}

type RoutineChecks = Record<string, string[]>

type QuickNote = {
  id: string
  text: string
  createdAt: string
}

const STORAGE_TODOS = 'mood-routine-todos'
const STORAGE_ROUTINES = 'mood-routine-routines'
const STORAGE_ROUTINE_CHECKS = 'mood-routine-routine-checks'
const STORAGE_QUICK_NOTES = 'mood-routine-quick-notes'

const defaultColors: PaletteColor[] = [
  { id: 'blue', name: '파랑', value: '#60a5fa' },
  { id: 'green', name: '초록', value: '#34d399' },
  { id: 'orange', name: '주황', value: '#fb923c' },
  { id: 'purple', name: '보라', value: '#a78bfa' },
  { id: 'pink', name: '핑크', value: '#f472b6' },
  { id: 'yellow', name: '노랑', value: '#facc15' },
]

const defaultRoutines: Routine[] = [
  { id: 'english', name: '영어', colorId: 'blue' },
  { id: 'exercise', name: '운동', colorId: 'orange' },
  { id: 'record', name: '기록', colorId: 'purple' },
]

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getCalendarDays(baseDate: Date) {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())

  const end = new Date(lastDay)
  end.setDate(lastDay.getDate() + (6 - lastDay.getDay()))

  const days: Date[] = []
  const current = new Date(start)

  while (current <= end) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return days
}

function normalizeTodo(raw: any): Todo {
  return {
    id: raw?.id ?? makeId(),
    text: raw?.text ?? '',
    done: Boolean(raw?.done),
    date: raw?.date ?? formatDateKey(new Date()),
    category: raw?.category === 'personal' ? 'personal' : 'work',
    memo: typeof raw?.memo === 'string' ? raw.memo : '',
    expanded: Boolean(raw?.expanded),
    subtasks: Array.isArray(raw?.subtasks)
      ? raw.subtasks.map((sub: any) => ({
          id: sub?.id ?? makeId(),
          text: sub?.text ?? '',
          done: Boolean(sub?.done),
        }))
      : [],
  }
}

function DockNav({
  current,
}: {
  current: 'check' | 'ideas' | 'note'
}) {
  const base =
    'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition'
  const active = 'bg-zinc-900 text-white shadow-md'
  const inactive = 'border border-zinc-200 bg-white text-zinc-500'

  return (
    <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-3xl border border-zinc-200 bg-zinc-50/95 px-3 py-3 shadow-lg backdrop-blur">
        <Link
          href="/"
          className={`${base} ${current === 'check' ? active : inactive}`}
          aria-label="오늘 페이지"
        >
          ☑️
        </Link>

        <Link
          href="/ideas"
          className={`${base} ${current === 'ideas' ? active : inactive}`}
          aria-label="아이디어 페이지"
        >
          💡
        </Link>

        <Link
          href="/question"
          className={`${base} ${current === 'note' ? active : inactive}`}
          aria-label="질문 페이지"
        >
          📝
        </Link>
      </div>
    </div>
  )
}

export default function HomePage() {
  const today = new Date()
  const todayKey = formatDateKey(today)

  const [mounted, setMounted] = useState(false)

  const [todoInput, setTodoInput] = useState('')
  const [todoCategory, setTodoCategory] = useState<TodoCategory>('work')
  const [todos, setTodos] = useState<Todo[]>([])
  const [activeTab, setActiveTab] = useState<TodoCategory>('work')

  const colors = defaultColors

  const [routineInput, setRoutineInput] = useState('')
  const [selectedColorId, setSelectedColorId] = useState('green')
  const [routines, setRoutines] = useState<Routine[]>(defaultRoutines)
  const [routineChecks, setRoutineChecks] = useState<RoutineChecks>({})

  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
  const [editingRoutineName, setEditingRoutineName] = useState('')
  const [editingRoutineColorId, setEditingRoutineColorId] = useState('green')

  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)

  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [editingTodoText, setEditingTodoText] = useState('')
  const [editingTodoCategory, setEditingTodoCategory] =
    useState<TodoCategory>('work')

  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({})
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingSubtaskText, setEditingSubtaskText] = useState('')

  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([])
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)
  const [quickNoteText, setQuickNoteText] = useState('')

  useEffect(() => {
    setMounted(true)

    const savedTodos = localStorage.getItem(STORAGE_TODOS)
    const savedRoutines = localStorage.getItem(STORAGE_ROUTINES)
    const savedChecks = localStorage.getItem(STORAGE_ROUTINE_CHECKS)
    const savedQuickNotes = localStorage.getItem(STORAGE_QUICK_NOTES)

    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos)
        setTodos(Array.isArray(parsed) ? parsed.map(normalizeTodo) : [])
      } catch {}
    }

    if (savedRoutines) {
      try {
        setRoutines(JSON.parse(savedRoutines))
      } catch {}
    }

    if (savedChecks) {
      try {
        setRoutineChecks(JSON.parse(savedChecks))
      } catch {}
    }

    if (savedQuickNotes) {
      try {
        const parsed = JSON.parse(savedQuickNotes)
        setQuickNotes(Array.isArray(parsed) ? parsed : [])
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_TODOS, JSON.stringify(todos))
  }, [todos, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_ROUTINES, JSON.stringify(routines))
  }, [routines, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_ROUTINE_CHECKS, JSON.stringify(routineChecks))
  }, [routineChecks, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_QUICK_NOTES, JSON.stringify(quickNotes))
  }, [quickNotes, mounted])

  const todayTodosByTab = useMemo(() => {
    const filtered = todos.filter(
      (t) => t.date === todayKey && t.category === activeTab
    )
    const undone = filtered.filter((t) => !t.done)
    const done = filtered.filter((t) => t.done)
    return [...undone, ...done]
  }, [todos, todayKey, activeTab])

  const calendarDays = useMemo(() => getCalendarDays(today), [today])
  const monthLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월`

  const selectedDateRoutines = useMemo(() => {
    return routines.map((routine) => {
      const checked = (routineChecks[selectedDateKey] ?? []).includes(routine.id)
      return { ...routine, checked }
    })
  }, [routines, routineChecks, selectedDateKey])

  const selectedDateTodos = useMemo(() => {
    const filtered = todos.filter(
      (todo) => todo.date === selectedDateKey && todo.category === activeTab
    )
    const undone = filtered.filter((todo) => !todo.done)
    const done = filtered.filter((todo) => todo.done)
    return [...undone, ...done]
  }, [todos, selectedDateKey, activeTab])

  function getColorById(colorId: string) {
    return colors.find((c) => c.id === colorId)
  }

  function isRoutineChecked(dateKey: string, routineId: string) {
    return (routineChecks[dateKey] ?? []).includes(routineId)
  }

  function addTodo() {
    const text = todoInput.trim()
    if (!text) return

    const newTodo: Todo = {
      id: makeId(),
      text,
      done: false,
      date: todayKey,
      category: todoCategory,
      memo: '',
      subtasks: [],
      expanded: false,
    }

    setTodos((prev) => [newTodo, ...prev])
    setTodoInput('')
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    )
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  function startEditTodo(todo: Todo) {
    setEditingTodoId(todo.id)
    setEditingTodoText(todo.text)
    setEditingTodoCategory(todo.category)
  }

  function saveTodoEdit() {
    const text = editingTodoText.trim()
    if (!editingTodoId || !text) return

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === editingTodoId
          ? { ...todo, text, category: editingTodoCategory }
          : todo
      )
    )

    cancelTodoEdit()
  }

  function cancelTodoEdit() {
    setEditingTodoId(null)
    setEditingTodoText('')
    setEditingTodoCategory('work')
  }

  function toggleTodoExpanded(id: string) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, expanded: !todo.expanded } : todo
      )
    )
  }

  function updateTodoMemo(id: string, memo: string) {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, memo } : todo))
    )
  }

  function addSubtask(todoId: string) {
    const text = (subtaskInputs[todoId] ?? '').trim()
    if (!text) return

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              expanded: true,
              subtasks: [...todo.subtasks, { id: makeId(), text, done: false }],
            }
          : todo
      )
    )

    setSubtaskInputs((prev) => ({ ...prev, [todoId]: '' }))
  }

  function toggleSubtask(todoId: string, subtaskId: string) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks.map((sub) =>
                sub.id === subtaskId ? { ...sub, done: !sub.done } : sub
              ),
            }
          : todo
      )
    )
  }

  function deleteSubtask(todoId: string, subtaskId: string) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks.filter((sub) => sub.id !== subtaskId),
            }
          : todo
      )
    )
  }

  function startEditSubtask(subtask: Subtask) {
    setEditingSubtaskId(subtask.id)
    setEditingSubtaskText(subtask.text)
  }

  function saveSubtaskEdit(todoId: string, subtaskId: string) {
    const text = editingSubtaskText.trim()
    if (!text) return

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks.map((sub) =>
                sub.id === subtaskId ? { ...sub, text } : sub
              ),
            }
          : todo
      )
    )

    cancelSubtaskEdit()
  }

  function cancelSubtaskEdit() {
    setEditingSubtaskId(null)
    setEditingSubtaskText('')
  }

  function addRoutine() {
    const name = routineInput.trim()
    if (!name) return

    const newRoutine: Routine = {
      id: makeId(),
      name,
      colorId: selectedColorId,
    }

    setRoutines((prev) => [...prev, newRoutine])
    setRoutineInput('')
    setSelectedColorId('green')
  }

  function deleteRoutine(routineId: string) {
    setRoutines((prev) => prev.filter((r) => r.id !== routineId))

    setRoutineChecks((prev) => {
      const next: RoutineChecks = {}

      for (const [date, checkedIds] of Object.entries(prev)) {
        next[date] = checkedIds.filter((id) => id !== routineId)
      }

      return next
    })

    if (editingRoutineId === routineId) {
      cancelEditingRoutine()
    }
  }

  function toggleRoutineForDate(dateKey: string, routineId: string) {
    setRoutineChecks((prev) => {
      const checked = prev[dateKey] ?? []
      const exists = checked.includes(routineId)

      return {
        ...prev,
        [dateKey]: exists
          ? checked.filter((id) => id !== routineId)
          : [...checked, routineId],
      }
    })
  }

  function startEditingRoutine(routine: Routine) {
    setEditingRoutineId(routine.id)
    setEditingRoutineName(routine.name)
    setEditingRoutineColorId(routine.colorId)
  }

  function saveRoutineEdit() {
    const name = editingRoutineName.trim()
    if (!editingRoutineId || !name) return

    setRoutines((prev) =>
      prev.map((routine) =>
        routine.id === editingRoutineId
          ? {
              ...routine,
              name,
              colorId: editingRoutineColorId,
            }
          : routine
      )
    )

    cancelEditingRoutine()
  }

  function cancelEditingRoutine() {
    setEditingRoutineId(null)
    setEditingRoutineName('')
    setEditingRoutineColorId('green')
  }

  function saveQuickNote() {
    const text = quickNoteText.trim()
    if (!text) return

    const newNote: QuickNote = {
      id: makeId(),
      text,
      createdAt: new Date().toISOString(),
    }

    setQuickNotes((prev) => [newNote, ...prev])
    setQuickNoteText('')
    setQuickNoteOpen(false)
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-28 text-zinc-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
        <header className="mb-1">
          <h1 className="text-2xl font-bold">☑️ 오늘</h1>
          <p className="mt-1 text-sm text-zinc-500">
            오늘 할 일과 루틴을 체크해봐
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex gap-2 rounded-2xl bg-zinc-100 p-1">
            <button
              onClick={() => setActiveTab('work')}
              className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium ${
                activeTab === 'work'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600'
              }`}
            >
              WORK
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium ${
                activeTab === 'personal'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600'
              }`}
            >
              PERSONAL
            </button>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold">오늘 할 일</h2>
            <p className="mt-1 text-sm text-zinc-500">
              현재 탭: {activeTab === 'work' ? 'WORK' : 'PERSONAL'}
            </p>
          </div>

          <div className="mb-2 flex gap-2">
            <input
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTodo()
              }}
              placeholder="할 일을 입력해"
              className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />

            <button
              onClick={addTodo}
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
            >
              추가
            </button>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setTodoCategory('work')}
              className={`rounded-full px-3 py-1.5 text-xs ${
                todoCategory === 'work'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              WORK로 추가
            </button>
            <button
              onClick={() => setTodoCategory('personal')}
              className={`rounded-full px-3 py-1.5 text-xs ${
                todoCategory === 'personal'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              PERSONAL로 추가
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {todayTodosByTab.length === 0 ? (
              <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-400">
                아직 할 일이 없어
              </div>
            ) : (
              todayTodosByTab.map((todo) => {
                const doneCount = todo.subtasks.filter((s) => s.done).length
                const totalCount = todo.subtasks.length

                return (
                  <div
                    key={todo.id}
                    className="rounded-2xl border border-zinc-100 px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                          todo.done
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-300 bg-white text-transparent'
                        }`}
                        aria-label="할 일 체크"
                      >
                        ✓
                      </button>

                      <div className="min-w-0 flex-1">
                        {editingTodoId === todo.id ? (
                          <div className="space-y-2">
                            <input
                              value={editingTodoText}
                              onChange={(e) => setEditingTodoText(e.target.value)}
                              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
                            />

                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingTodoCategory('work')}
                                className={`rounded-full px-3 py-1.5 text-xs ${
                                  editingTodoCategory === 'work'
                                    ? 'bg-zinc-900 text-white'
                                    : 'bg-zinc-100 text-zinc-600'
                                }`}
                              >
                                WORK
                              </button>

                              <button
                                onClick={() => setEditingTodoCategory('personal')}
                                className={`rounded-full px-3 py-1.5 text-xs ${
                                  editingTodoCategory === 'personal'
                                    ? 'bg-zinc-900 text-white'
                                    : 'bg-zinc-100 text-zinc-600'
                                }`}
                              >
                                PERSONAL
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={saveTodoEdit}
                                className="rounded-2xl bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                              >
                                저장
                              </button>
                              <button
                                onClick={cancelTodoEdit}
                                className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className={`text-sm ${
                                todo.done
                                  ? 'text-zinc-400 line-through'
                                  : 'text-zinc-800'
                              }`}
                            >
                              {todo.text}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                onClick={() => startEditTodo(todo)}
                                className="text-xs text-zinc-500"
                              >
                                수정
                              </button>

                              <button
                                onClick={() => toggleTodoExpanded(todo.id)}
                                className="text-xs text-zinc-500"
                              >
                                {todo.expanded ? '접기' : '열기'}
                              </button>

                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="text-xs text-zinc-400"
                              >
                                삭제
                              </button>

                              {totalCount > 0 && (
                                <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600">
                                  하위할일 {doneCount}/{totalCount}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {todo.expanded && (
                      <div className="mt-4 space-y-4 rounded-2xl bg-zinc-50 p-3">
                        <div>
                          <div className="mb-2 text-xs font-medium text-zinc-500">
                            하위 할 일
                          </div>

                          <div className="mb-2 flex gap-2">
                            <input
                              value={subtaskInputs[todo.id] ?? ''}
                              onChange={(e) =>
                                setSubtaskInputs((prev) => ({
                                  ...prev,
                                  [todo.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addSubtask(todo.id)
                              }}
                              placeholder="하위 할 일 추가"
                              className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none"
                            />
                            <button
                              onClick={() => addSubtask(todo.id)}
                              className="rounded-2xl bg-zinc-900 px-3 py-2.5 text-xs font-medium text-white"
                            >
                              추가
                            </button>
                          </div>

                          <div className="space-y-2">
                            {todo.subtasks.length === 0 ? (
                              <div className="rounded-2xl bg-white px-3 py-3 text-sm text-zinc-400">
                                아직 하위 할 일이 없어
                              </div>
                            ) : (
                              todo.subtasks.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="rounded-2xl bg-white px-3 py-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() =>
                                        toggleSubtask(todo.id, sub.id)
                                      }
                                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                                        sub.done
                                          ? 'border-zinc-900 bg-zinc-900 text-white'
                                          : 'border-zinc-300 bg-white text-transparent'
                                      }`}
                                    >
                                      ✓
                                    </button>

                                    <div className="flex-1 min-w-0">
                                      {editingSubtaskId === sub.id ? (
                                        <input
                                          value={editingSubtaskText}
                                          onChange={(e) =>
                                            setEditingSubtaskText(e.target.value)
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              saveSubtaskEdit(todo.id, sub.id)
                                            }
                                          }}
                                          className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none"
                                        />
                                      ) : (
                                        <div
                                          className={`text-sm ${
                                            sub.done
                                              ? 'text-zinc-400 line-through'
                                              : 'text-zinc-800'
                                          }`}
                                        >
                                          {sub.text}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-2 pl-8">
                                    {editingSubtaskId === sub.id ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            saveSubtaskEdit(todo.id, sub.id)
                                          }
                                          className="text-xs text-zinc-600"
                                        >
                                          저장
                                        </button>
                                        <button
                                          onClick={cancelSubtaskEdit}
                                          className="text-xs text-zinc-400"
                                        >
                                          취소
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => startEditSubtask(sub)}
                                          className="text-xs text-zinc-500"
                                        >
                                          수정
                                        </button>
                                        <button
                                          onClick={() =>
                                            deleteSubtask(todo.id, sub.id)
                                          }
                                          className="text-xs text-zinc-400"
                                        >
                                          삭제
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-xs font-medium text-zinc-500">
                            메모
                          </div>
                          <textarea
                            value={todo.memo}
                            onChange={(e) =>
                              updateTodoMemo(todo.id, e.target.value)
                            }
                            placeholder="업무 흐름 메모나 체크 포인트를 적어둬"
                            className="min-h-[110px] w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-zinc-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">루틴 관리</h2>
            <p className="mt-1 text-sm text-zinc-500">
              색을 골라서 루틴을 추가해
            </p>
          </div>

          <div className="mb-3">
            <input
              value={routineInput}
              onChange={(e) => setRoutineInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addRoutine()
              }}
              placeholder="루틴 이름"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColorId(color.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  selectedColorId === color.id
                    ? 'border-zinc-900'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                aria-label={`${color.name} 선택`}
              >
                {selectedColorId === color.id ? '✓' : ''}
              </button>
            ))}
          </div>

          <button
            onClick={addRoutine}
            className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
          >
            루틴 추가
          </button>

          <div className="mt-5 flex flex-col gap-2">
            {routines.map((routine) => {
              const color = getColorById(routine.colorId)

              return (
                <div
                  key={routine.id}
                  className="rounded-2xl border border-zinc-100 px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color?.value }}
                    />

                    <div className="flex-1 text-sm">{routine.name}</div>

                    <button
                      onClick={() => startEditingRoutine(routine)}
                      className="text-sm text-zinc-500"
                    >
                      수정
                    </button>

                    <button
                      onClick={() => deleteRoutine(routine.id)}
                      className="text-sm text-zinc-400"
                    >
                      삭제
                    </button>
                  </div>

                  {editingRoutineId === routine.id && (
                    <div className="mt-3 rounded-2xl bg-zinc-50 p-3">
                      <input
                        value={editingRoutineName}
                        onChange={(e) => setEditingRoutineName(e.target.value)}
                        placeholder="루틴 이름 수정"
                        className="mb-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
                      />

                      <div className="mb-3 flex flex-wrap gap-2">
                        {colors.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => setEditingRoutineColorId(color.id)}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                              editingRoutineColorId === color.id
                                ? 'border-zinc-900'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {editingRoutineColorId === color.id ? '✓' : ''}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={saveRoutineEdit}
                          className="flex-1 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
                        >
                          저장
                        </button>

                        <button
                          onClick={cancelEditingRoutine}
                          className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-600"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">오늘 루틴 체크</h2>
          </div>

          <div className="flex flex-col gap-2">
            {routines.length === 0 ? (
              <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-400">
                먼저 루틴을 추가해줘
              </div>
            ) : (
              routines.map((routine) => {
                const checked = isRoutineChecked(todayKey, routine.id)
                const color = getColorById(routine.colorId)

                return (
                  <div
                    key={routine.id}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-100 px-3 py-3"
                  >
                    <button
                      onClick={() => toggleRoutineForDate(todayKey, routine.id)}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                        checked
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-white text-transparent'
                      }`}
                      aria-label={`${routine.name} 체크`}
                    >
                      ✓
                    </button>

                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color?.value }}
                    />

                    <div className="flex-1 text-sm">{routine.name}</div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">루틴 달력</h2>
            <p className="mt-1 text-sm text-zinc-500">{monthLabel}</p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {routines.map((routine) => {
              const color = getColorById(routine.colorId)

              return (
                <div
                  key={routine.id}
                  className="flex items-center gap-2 rounded-full bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color?.value }}
                  />
                  <span>{routine.name}</span>
                </div>
              )
            })}
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs text-zinc-400">
            <div>일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div>토</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date) => {
              const dateKey = formatDateKey(date)
              const inCurrentMonth = date.getMonth() === today.getMonth()
              const isToday = isSameDate(date, today)
              const isSelected = selectedDateKey === dateKey

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDateKey(dateKey)}
                  className={`min-h-[88px] rounded-2xl border p-2 text-left transition ${
                    inCurrentMonth
                      ? 'border-zinc-200 bg-white'
                      : 'border-zinc-100 bg-zinc-50 text-zinc-300'
                  } ${isToday ? 'ring-2 ring-zinc-900' : ''} ${
                    isSelected ? 'bg-zinc-50' : ''
                  }`}
                >
                  <div className="mb-2 text-xs font-medium">{date.getDate()}</div>

                  <div className="flex flex-wrap gap-1">
                    {routines.map((routine) => {
                      const checked = isRoutineChecked(dateKey, routine.id)
                      const color = getColorById(routine.colorId)

                      return (
                        <span
                          key={routine.id}
                          className={`h-2.5 w-2.5 rounded-full ${
                            checked ? '' : 'opacity-20'
                          }`}
                          style={{ backgroundColor: color?.value }}
                          title={`${routine.name} ${checked ? '완료' : '미완료'}`}
                        />
                      )
                    })}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">선택한 날짜 루틴</h2>
            <p className="mt-1 text-sm text-zinc-500">{selectedDateKey}</p>
          </div>

          <div className="flex flex-col gap-2">
            {selectedDateRoutines.length === 0 ? (
              <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-400">
                등록된 루틴이 없어
              </div>
            ) : (
              selectedDateRoutines.map((routine) => {
                const color = getColorById(routine.colorId)

                return (
                  <div
                    key={routine.id}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-100 px-3 py-3"
                  >
                    <button
                      onClick={() =>
                        toggleRoutineForDate(selectedDateKey, routine.id)
                      }
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                        routine.checked
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </button>

                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color?.value }}
                    />

                    <div className="flex-1 text-sm">{routine.name}</div>

                    <div
                      className={`text-xs ${
                        routine.checked ? 'text-zinc-700' : 'text-zinc-400'
                      }`}
                    >
                      {routine.checked ? '완료' : '미완료'}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">선택한 날짜 할 일</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {selectedDateKey} / {activeTab === 'work' ? 'WORK' : 'PERSONAL'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {selectedDateTodos.length === 0 ? (
              <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-400">
                할 일이 없어
              </div>
            ) : (
              selectedDateTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="rounded-2xl border border-zinc-100 px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                        todo.done
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </button>

                    <div
                      className={`flex-1 text-sm ${
                        todo.done ? 'text-zinc-400 line-through' : 'text-zinc-800'
                      }`}
                    >
                      {todo.text}
                    </div>

                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-sm text-zinc-400"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <button
        onClick={() => setQuickNoteOpen(true)}
        className="fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-2xl text-white shadow-lg"
        aria-label="빠른 노트 열기"
      >
        ✏️
      </button>

      {quickNoteOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 px-4">
          <div className="mx-auto mt-24 w-full max-w-md rounded-3xl bg-white p-4 shadow-xl">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">빠른 노트</h2>
              <p className="mt-1 text-sm text-zinc-500">
                떠오른 생각을 짧게 남겨둬
              </p>
            </div>

            <textarea
              value={quickNoteText}
              onChange={(e) => setQuickNoteText(e.target.value)}
              placeholder="갑자기 떠오른 아이디어"
              className="min-h-[160px] w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={saveQuickNote}
                className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setQuickNoteOpen(false)
                  setQuickNoteText('')
                }}
                className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <DockNav current="check" />
    </main>
  )
}