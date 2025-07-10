import { Metadata } from 'next'
import Game from './game'

type Props = {
  searchParams: Promise<{ stage: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { stage } = await searchParams
  return { title: stage }
}

export default async function Page({ searchParams }: Props) {
  const { stage } = await searchParams
  return <Game stage={parseInt(stage)} />
}
