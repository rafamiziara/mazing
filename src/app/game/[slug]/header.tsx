import Link from 'next/link'

export default function Header() {
  return (
    <div className="flex justify-between place-items-center px-4 h-20 font-bold font-[family-name:var(--font-fredoka)]">
      <Link key="home" href="/" className="bg-slate-600 px-3 py-1.5 rounded-md">
        mazing
      </Link>
      <div className="bg-slate-600 px-3 py-1.5 rounded-md">00:00</div>
    </div>
  )
}
