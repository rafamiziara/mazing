import dayjs from 'dayjs'

type Props = {
  time: number
}

export default function Message({ time }: Props) {
  return (
    <div className="fixed top-32 left-0 right-0 z-10 flex flex-col items-center font-bold font-[family-name:var(--font-fredoka)]">
      <div className="place-items-center my-8">
        <h1 className="text-4xl mb-4">Well done!</h1>
        <p>You completed this stage in {dayjs(time).second()} seconds!</p>
      </div>
      <button onClick={() => console.log('Go to next stage!')} className="bg-emerald-600 text-2xl p-6 rounded-md cursor-pointer mt-12">
        NEXT STAGE
      </button>
    </div>
  )
}
