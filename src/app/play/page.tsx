import type { Metadata } from 'next'
import GameCanvas from '@/components/GameCanvas'

export const metadata: Metadata = {
  title: 'mazing — in the maze',
}

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams
  return <GameCanvas mode={mode === 'daily' ? 'daily' : 'journey'} />
}
