'use client'

import { useEffect, useMemo, useState } from 'react'

type AnswerMap = Record<string, string>

const STORAGE_ANSWERS = 'mood-routine-question-answers'

const questions = [
  '오늘 내가 조금이라도 기분 좋았던 순간',
  '요즘 나를 살짝 끌어당기는 것',
  '아무 생각 없이 자주 하게 되는 행동',
  '요즘 나 상태를 한 단어로',
  '내가 요즘 피하고 있는 것',
  '오늘 가장 기억 남는 장면',
  '나는 언제 나답다고 느끼는지',
  '요즘 나를 불편하게 만드는 것',
  '계속 머리에 맴도는 생각 하나',
  '요즘 나를 지치게 하는 것',
  '내가 편안함을 느끼는 순간',
  '지금 나한테 필요한 것 하나',
  '요즘 자주 하는 생각',
  '내가 유지하고 싶은 것',
  '놓치고 있는 것 같다고 느끼는 것',
  '내가 편하게 느끼는 사람의 특징',
  '내가 싫어하는 상황 하나',
  '나는 어떤 사람으로 보이고 싶은지',
  '요즘 나한테 중요한 것',
  '최근에 잘했다 싶은 거 하나',
  '나에게 해주고 싶은 말',
  '요즘 자주 듣거나 쓰는 단어',
  '오늘 당장 할 수 있는 작은 행동 하나',
  '요즘 내가 기대하는 것',
  '내가 요즘 자주 느끼는 감정',
  '내가 자유로워지고 싶은 부분',
  '내가 사람들에게 남기고 싶은 느낌',
  '최근 가장 기억에 남는 순간',
  '나를 하나의 색으로 표현하면',
  '이번 달 나를 한 줄로 정리하면',
]

function formatDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}


export default function QuestionPage() {
  const today = new Date()
  const todayKey = formatDateKey(today)
  const dayIndex = today.getDate() - 1

  const [mounted, setMounted] = useState(false)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [text, setText] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const todayQuestion = useMemo(() => {
    return questions[dayIndex] ?? '오늘의 질문 없음'
  }, [dayIndex])

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_ANSWERS)

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AnswerMap
        setAnswers(parsed)
        setText(parsed[todayKey] ?? '')
      } catch {}
    }
  }, [todayKey])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_ANSWERS, JSON.stringify(answers))
  }, [answers, mounted])

  const historyItems = useMemo(() => {
    return Object.entries(answers)
      .filter(([_, value]) => value.trim() !== '')
      .sort((a, b) => b[0].localeCompare(a[0]))
  }, [answers])

  function saveAnswer() {
    setAnswers((prev) => ({
      ...prev,
      [todayKey]: text,
    }))

    setSavedMessage('저장됐어')

    setTimeout(() => {
      setSavedMessage('')
    }, 1500)
  }

  function getQuestionByDateKey(dateKey: string) {
    const day = Number(dateKey.slice(-2))
    return questions[day - 1] ?? '질문 없음'
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-28 text-zinc-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
        <header className="mb-1">
          <h1 className="text-2xl font-bold">📝 오늘의 질문</h1>
          <p className="mt-1 text-sm text-zinc-500">
            부담 없이 짧게 적어도 돼
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-sm text-zinc-400">
            {today.getMonth() + 1}월 {today.getDate()}일
          </div>

          <h2 className="mb-4 text-lg font-semibold leading-relaxed">
            {todayQuestion}
          </h2>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="짧게 적어도 괜찮아"
            className="min-h-[220px] w-full resize-none rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={saveAnswer}
              className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
            >
              저장
            </button>

            <span className="text-sm text-zinc-400">{savedMessage}</span>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-base font-semibold">오늘 기록</h3>

          <div className="rounded-2xl bg-zinc-50 px-4 py-4 text-sm leading-6 text-zinc-700 whitespace-pre-wrap">
            {answers[todayKey]?.trim()
              ? answers[todayKey]
              : '아직 저장된 기록이 없어'}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">지난 기록</h3>

            <button
              onClick={() => setShowHistory((prev) => !prev)}
              className="text-sm text-zinc-500"
            >
              {showHistory ? '닫기' : '보기'}
            </button>
          </div>

          {!showHistory ? (
            <div className="rounded-2xl bg-zinc-50 px-4 py-4 text-sm text-zinc-400">
              버튼을 누르면 지난 기록을 볼 수 있어
            </div>
          ) : historyItems.length === 0 ? (
            <div className="rounded-2xl bg-zinc-50 px-4 py-4 text-sm text-zinc-400">
              아직 기록이 없어
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {historyItems.map(([dateKey, answer]) => (
                <div
                  key={dateKey}
                  className="rounded-2xl border border-zinc-100 p-4"
                >
                  <div className="mb-1 text-xs text-zinc-400">{dateKey}</div>

                  <div className="mb-2 text-sm font-medium text-zinc-700">
                    {getQuestionByDateKey(dateKey)}
                  </div>

                  <div className="text-sm leading-6 text-zinc-700 whitespace-pre-wrap">{answer}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

    </main>
  )
}