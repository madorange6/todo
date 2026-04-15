'use client'

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

type QuickNote = {
  id: string
  text: string
  createdAt: string
}

const STORAGE_QUICK_NOTES = 'mood-routine-quick-notes'
const STORAGE_TODOS = 'mood-routine-todos'
const STORAGE_IDEA_MEMO = 'mood-routine-idea-memo'
const STORAGE_IDEA_MEMO_OPEN = 'mood-routine-idea-memo-open'

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}


export default function IdeasPage() {
  const [mounted, setMounted] = useState(false)
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const [ideaMemoOpen, setIdeaMemoOpen] = useState(false)
  const [ideaMemoText, setIdeaMemoText] = useState('')

  useEffect(() => {
    setMounted(true)

    const savedQuickNotes = localStorage.getItem(STORAGE_QUICK_NOTES)
    if (savedQuickNotes) {
      try {
        const parsed = JSON.parse(savedQuickNotes)
        setQuickNotes(Array.isArray(parsed) ? parsed : [])
      } catch {}
    }

    const savedIdeaMemo = localStorage.getItem(STORAGE_IDEA_MEMO)
    if (savedIdeaMemo !== null) {
      setIdeaMemoText(savedIdeaMemo)
    }

    const savedIdeaMemoOpen = localStorage.getItem(STORAGE_IDEA_MEMO_OPEN)
    if (savedIdeaMemoOpen === 'true') {
      setIdeaMemoOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_QUICK_NOTES, JSON.stringify(quickNotes))
  }, [quickNotes, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_IDEA_MEMO, ideaMemoText)
  }, [ideaMemoText, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_IDEA_MEMO_OPEN, String(ideaMemoOpen))
  }, [ideaMemoOpen, mounted])

  const sortedNotes = useMemo(() => {
    return [...quickNotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [quickNotes])

  function startEdit(note: QuickNote) {
    setEditingId(note.id)
    setEditingText(note.text)
  }

  function saveEdit() {
    const text = editingText.trim()
    if (!editingId || !text) return

    setQuickNotes((prev) =>
      prev.map((note) => (note.id === editingId ? { ...note, text } : note))
    )

    setEditingId(null)
    setEditingText('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingText('')
  }

  function deleteNote(id: string) {
    setQuickNotes((prev) => prev.filter((note) => note.id !== id))
  }

  function sendToTodo(note: QuickNote, category: TodoCategory) {
    const savedTodos = localStorage.getItem(STORAGE_TODOS)

    let todos: Todo[] = []
    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos)
        todos = Array.isArray(parsed) ? parsed : []
      } catch {}
    }

    const newTodo: Todo = {
      id: makeId(),
      text: note.text,
      done: false,
      date: formatDateKey(new Date()),
      category,
      memo: '',
      subtasks: [],
      expanded: false,
    }

    localStorage.setItem(STORAGE_TODOS, JSON.stringify([newTodo, ...todos]))
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-28 text-zinc-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
        <header className="mb-1">
          <h1 className="text-2xl font-bold">💡 아이디어</h1>
          <p className="mt-1 text-sm text-zinc-500">
            빠르게 남긴 노트를 보고 키우거나 할 일로 보낼 수 있어
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          {sortedNotes.length === 0 ? (
            <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-400">
              아직 빠른 노트가 없어
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-zinc-100 px-3 py-3"
                >
                  <div className="mb-2 text-xs text-zinc-400">
                    {new Date(note.createdAt).toLocaleString('ko-KR')}
                  </div>

                  {editingId === note.id ? (
                    <>
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="min-h-[140px] w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none"
                      />

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="rounded-2xl bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600"
                        >
                          취소
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                        {note.text}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(note)}
                          className="text-xs text-zinc-500"
                        >
                          확장/수정
                        </button>

                        <button
                          onClick={() => sendToTodo(note, 'work')}
                          className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700"
                        >
                          WORK 할 일로
                        </button>

                        <button
                          onClick={() => sendToTodo(note, 'personal')}
                          className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700"
                        >
                          PERSONAL 할 일로
                        </button>

                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-xs text-zinc-400"
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <button
            onClick={() => setIdeaMemoOpen((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <h2 className="text-lg font-semibold">메모</h2>
              <p className="mt-1 text-sm text-zinc-500">
                메모장처럼 자유롭게 적어둘 수 있어
              </p>
            </div>
            <span className="text-sm text-zinc-500">
              {ideaMemoOpen ? '접기' : '열기'}
            </span>
          </button>

          {ideaMemoOpen && (
            <div className="mt-4">
              <textarea
                value={ideaMemoText}
                onChange={(e) => setIdeaMemoText(e.target.value)}
                placeholder="아이디어 정리, 초안, 생각 확장..."
                className="min-h-[260px] w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm outline-none placeholder:text-zinc-400"
              />
            </div>
          )}
        </section>
      </div>

    </main>
  )
}