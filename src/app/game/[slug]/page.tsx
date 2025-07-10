import { GameLevel, GameLevels } from '@/types'
import Header from './header'
import Maze from './maze'

type Props = {
  params: {
    slug: GameLevel
  }
}

export async function generateMetadata(): Promise<Props['params'][]> {
  return GameLevels.map((level) => ({ slug: level }))
}

export default async function Page({ params }: Props) {
  const { slug } = await params

  return (
    <>
      <Header />
      <Maze level={slug} />
    </>
  )
}
