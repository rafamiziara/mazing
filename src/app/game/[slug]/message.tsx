export default function Message() {
  return (
    <div className="z-10 flex flex-col items-center font-bold font-[family-name:var(--font-fredoka)]">
      <div className="place-items-center my-8">
        <h1 className="text-4xl mb-4">Well done!</h1>
        <p>You completed this stage in **add timer** seconds!</p>
      </div>
      <button onClick={() => console.log('Go to next stage!')} className="bg-emerald-600 text-2xl p-6 rounded-md cursor-pointer mt-12">
        NEXT STAGE
      </button>
    </div>
  )
}
