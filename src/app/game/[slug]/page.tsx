'use client'
import { useCallback, useState } from 'react'
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

  const onFinished = useCallback(() => {
    setFinished(true)
  }, [])

  return (
    <>
      <Header />
      <Maze level={params.slug} onFinished={onFinished} />
      {finished && <Message />}
    </>
  )
}
