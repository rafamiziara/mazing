'use client'
import { useTimer } from '@/hooks'
import Header from './header'
import Maze from './maze'

type Props = {
  stage: number
}

export default function Game({ stage }: Props) {
  const { time, pause, start, reset } = useTimer({})

  return (
    <>
      <Header time={time} />
      <Maze reset={reset} pause={pause} start={start} time={time} stage={stage} />
    </>
  )
}
