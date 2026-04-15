'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',          icon: '🐉', label: '홈' },
  { href: '/todo',      icon: '☑️', label: '투두' },
  { href: '/manage',    icon: '🌱', label: '관리' },
  { href: '/ideas',     icon: '💡', label: '아이디어' },
  { href: '/challenge', icon: '🏆', label: '챌린지' },
  { href: '/money',     icon: '💰', label: '머니북' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-zinc-100">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1 transition-colors ${
                active ? 'text-violet-600' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <span className={`text-xl leading-none transition-transform ${active ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
