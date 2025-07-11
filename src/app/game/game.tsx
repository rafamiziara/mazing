'use client'
import { useMaze, useTimer } from '@/hooks'
import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef } from 'react'

type Props = {
  stage: number
}

export default function Game({ stage }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { time, pause, start, reset } = useTimer({ autoStart: false })
  const { status, buildStage, clearStage } = useMaze(canvasRef.current)

  const onNext = useCallback(() => {
    clearStage()
    reset()
  }, [reset, clearStage])

  useEffect(() => {
    switch (status) {
      case 'initializing':
      case 'ready':
        break
      case 'running':
        start()
        break
      case 'paused':
      case 'finished':
        pause()
        break
      default:
        break
    }
  }, [pause, start, status])

  return (
    <>
      <div className="flex justify-between place-items-center px-4 h-20 font-bold font-[family-name:var(--font-fredoka)]">
        <Link key="home" href="/" className="bg-slate-600 px-3 py-1.5 rounded-md">
          mazing
        </Link>
        <div className="bg-slate-600 min-w-20 text-center py-1.5 rounded-md">{dayjs(time).format('mm:ss')}</div>
      </div>
      <canvas ref={canvasRef} />
      {status === 'ready' && (
        <div className="fixed top-32 bottom-0 right-0 left-0 z-10 flex justify-center items-center">
          <Image
            onClick={() => buildStage(stage)}
            className=" cursor-pointer "
            src="/play.png"
            alt="play button"
            width={150}
            height={150}
          />
        </div>
      )}
      {status === 'finished' && (
        <div className="fixed top-32 left-0 right-0 z-10 flex flex-col items-center font-bold font-[family-name:var(--font-fredoka)]">
          <div className="place-items-center my-8">
            <h1 className="text-4xl mb-4">Well done!</h1>
            <p>You completed this stage in {dayjs(time).second()} seconds!</p>
          </div>
          <Link onClick={onNext} href={`/game?stage=${stage + 1}`} className="bg-emerald-600 text-2xl p-6 rounded-md cursor-pointer mt-12">
            NEXT STAGE
          </Link>
        </div>
      )}
    </>
  )
}
