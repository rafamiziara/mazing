import Card from '@/app/components/card'

export default function Page() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('stage')
  }

  return (
    <div className="grid grid-cols-6 gap-4 lg:gap-20 h-screen place-items-center font-(family-name:--font-fredoka)">
      <div className="col-span-6" />
      <div className="align-middle text-6xl md:text-8xl font-extrabold col-start-3 col-span-2">mazing</div>
      <Card title="easy" stage={0} className="bg-blue-400 lg:col-start-2" />
      <Card title="medium" stage={5} className="bg-emerald-400" />
      <Card title="hard" stage={10} className="bg-amber-300" />
      <Card title="super hard" stage={15} className="bg-red-400" />
      <div className="col-span-6" />
    </div>
  )
}
