import dayjs from 'dayjs'
import Link from 'next/link'

type Props = {
  time: number
}

export default function Header({ time }: Props) {
  return (
    <div className="flex justify-between place-items-center px-4 h-20 font-bold font-[family-name:var(--font-fredoka)]">
      <Link key="home" href="/" className="bg-slate-600 px-3 py-1.5 rounded-md">
        mazing
      </Link>
      <div className="bg-slate-600 min-w-20 text-center py-1.5 rounded-md">{dayjs(time).format('mm:ss')}</div>
    </div>
  )
}
