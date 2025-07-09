'use client'
import { useState } from 'react'
import Header from './header'
import Maze from './maze'
import Message from './message'

type Props = {
  params: {
    slug: string
  }
}

export default function Page({ params }: Props) {
  const [finished, setFinished] = useState(false)

  const onFinished = () => {
    console.log('FINISHED LEVEL!', params.slug)
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
