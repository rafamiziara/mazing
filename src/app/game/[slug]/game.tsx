'use client'
import { useTimer } from '@/hooks'
import { GameLevel } from '@/types'
import Header from './header'
import Maze from './maze'

type Props = {
  level: GameLevel
}

export default function Game({ level }: Props) {
  const { time, pause, start } = useTimer({})

  return (
    <>
      <Header time={time} />
      <Maze pause={pause} start={start} time={time} level={level} />
    </>
  )
}
