import { GameLevel } from '@/types'
import { Metadata } from 'next'
import Game from './game'

type Props = {
  params: Promise<{ slug: GameLevel }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: slug }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <Game level={slug} />
}
