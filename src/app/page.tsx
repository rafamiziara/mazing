import Card from '@/app/components/card'

export default function Page() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('stage')
  }

  return (
    <div className="grid grid-cols-6 gap-4 lg:gap-20 h-screen place-items-center font-[family-name:var(--font-fredoka)]">
      <div className="col-span-6" />
      <div className="align-middle text-6xl md:text-8xl font-extrabold col-start-3 col-span-2">mazing</div>
      <Card stage="easy" href="/easy" className="bg-blue-400 lg:col-start-2" />
      <Card stage="medium" href="/medium" className="bg-emerald-400" />
      <Card stage="hard" href="/hard" className="bg-amber-300" />
      <Card stage="super hard" href="/super-hard" className="bg-red-400" />
      <div className="col-span-6" />
    </div>
  )
}
