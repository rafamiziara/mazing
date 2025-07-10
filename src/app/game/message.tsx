import dayjs from 'dayjs'
import Link from 'next/link'

type Props = {
  time: number
  stage: number
}

export default function Message({ time, stage }: Props) {
  return (
    <div className="fixed top-32 left-0 right-0 z-10 flex flex-col items-center font-bold font-[family-name:var(--font-fredoka)]">
      <div className="place-items-center my-8">
        <h1 className="text-4xl mb-4">Well done!</h1>
        <p>You completed this stage in {dayjs(time).second()} seconds!</p>
      </div>
      <Link href={`/game?stage=${stage + 1}`} className="bg-emerald-600 text-2xl p-6 rounded-md cursor-pointer mt-12">
        NEXT STAGE
      </Link>
    </div>
  )
}
