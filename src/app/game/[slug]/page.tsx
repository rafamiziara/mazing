'use client'
import { useState } from 'react'
import Header from './header'
import Maze from './maze'
import Message from './message'

export default function Page() {
  const [finished, setFinished] = useState(false)

  const onFinished = () => {
    setFinished(true)
  }

  return (
    <>
      <Header />
      <Maze onFinished={onFinished} />
      {finished && <Message />}
    </>
  )
}
