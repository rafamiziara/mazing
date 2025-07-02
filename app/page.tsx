import StageCard from "@components/StageCard"

export default function Page() {
  return (
    <div className="bg-gray-950 flex flex-wrap justify-center items-center h-screen">
      <div className="text-white text-9xl">mazing</div>
      <div className="flex w-full justify-around">
        <StageCard stage="easy" className="bg-blue-400" />
        <StageCard stage="medium" className="bg-emerald-400" />
        <StageCard stage="hard" className="bg-amber-400" />
        <StageCard stage="super-hard" className="bg-red-400" />
      </div>
    </div>
  )
}
